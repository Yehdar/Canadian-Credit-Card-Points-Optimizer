package com.creditoptimizer.service

import com.creditoptimizer.db.CardEarnRates
import com.creditoptimizer.db.CreditCards
import com.creditoptimizer.dto.*
import org.jetbrains.exposed.sql.selectAll
import org.jetbrains.exposed.sql.transactions.transaction
import org.slf4j.LoggerFactory

class PointsService {

    private val log            = LoggerFactory.getLogger(PointsService::class.java)
    private val profileService = ProfileService()

    fun getAllCards(): List<CardSummary> = transaction {
        CreditCards.selectAll().map { row ->
            CardSummary(
                id             = row[CreditCards.id],
                name           = row[CreditCards.name],
                issuer         = row[CreditCards.issuer],
                annualFee      = row[CreditCards.annualFeeCad].toDouble(),
                pointsCurrency = row[CreditCards.pointsCurrency],
                cardType       = row[CreditCards.cardType]
            )
        }
    }

    /**
     * Search-first entry point: stateless recommendations require no saved profile.
     *
     * Resolution order:
     *  1. [RecommendationsRequest.profileId] — loads spending from the DB (priority).
     *  2. [RecommendationsRequest.spending]  — uses inline values directly.
     *  3. Neither provided                   — returns 400.
     *
     * Sending both fields is allowed; [profileId] wins.
     * An optional [RecommendationsRequest.filters] object is forwarded to the
     * core calculation to pre-filter and adjust the card list.
     */
    fun calculateRecommendations(request: RecommendationsRequest): List<RecommendationResult> {
        val spending = when {
            request.profileId != null -> {
                profileService.getProfile(request.profileId)?.spending
                    ?: throw ProfileNotFoundException(request.profileId)
            }
            request.spending != null -> request.spending
            else -> throw IllegalArgumentException(
                "Provide either 'profileId' or 'spending' in the request body."
            )
        }

        return calculateRecommendations(spending, request.filters)
    }

    /** Core calculation — accepts a resolved [SpendingBreakdown] and optional [FormFilters]. */
    fun calculateRecommendations(
        spending: SpendingBreakdown,
        filters:  FormFilters? = null
    ): List<RecommendationResult> {
        // Coerce all inputs to non-negative Doubles.
        // kotlinx.serialization already deserialises missing JSON fields as 0.0
        // (DTO defaults), but this guards against call-sites passing negative/NaN values.
        val spendMap = mapOf(
            "groceries"              to spending.groceries.coerceAtLeast(0.0),
            "dining"                 to spending.dining.coerceAtLeast(0.0),
            "gas"                    to spending.gas.coerceAtLeast(0.0),
            "travel"                 to spending.travel.coerceAtLeast(0.0),
            "entertainment"          to spending.entertainment.coerceAtLeast(0.0),
            "subscriptions"          to spending.subscriptions.coerceAtLeast(0.0),
            "transit"                to spending.transit.coerceAtLeast(0.0),
            "other"                  to spending.other.coerceAtLeast(0.0),
            // Expanded categories (V4)
            "pharmacy"               to spending.pharmacy.coerceAtLeast(0.0),
            "online_shopping"        to spending.onlineShopping.coerceAtLeast(0.0),
            "home_improvement"       to spending.homeImprovement.coerceAtLeast(0.0),
            "canadian_tire_partners" to spending.canadianTirePartners.coerceAtLeast(0.0),
            "foreign_purchases"      to spending.foreignPurchases.coerceAtLeast(0.0)
        )

        val allCardRows: Map<Int, CardRow> = transaction {
            val cards = CreditCards.selectAll().associate { row ->
                row[CreditCards.id] to CardRow(
                    id                    = row[CreditCards.id],
                    name                  = row[CreditCards.name],
                    issuer                = row[CreditCards.issuer],
                    annualFeeCad          = row[CreditCards.annualFeeCad].toDouble(),
                    pointsCurrency        = row[CreditCards.pointsCurrency],
                    cpp                   = row[CreditCards.cpp].toDouble(),
                    cardType              = row[CreditCards.cardType],
                    noForeignFee          = row[CreditCards.noForeignFee],
                    airportLounge         = row[CreditCards.airportLounge],
                    priorityTravel        = row[CreditCards.priorityTravel],
                    freeCheckedBag        = row[CreditCards.freeCheckedBag],
                    rogersBonusMultiplier = row[CreditCards.rogersBonusMultiplier].toDouble(),
                    amazonPrimeMultiplier = row[CreditCards.amazonPrimeMultiplier].toDouble(),
                    earnRates             = mutableMapOf()
                )
            }
            CardEarnRates.selectAll().forEach { row ->
                cards[row[CardEarnRates.cardId]]?.earnRates?.put(
                    row[CardEarnRates.category],
                    row[CardEarnRates.earnRate].toDouble()
                )
            }
            cards
        }

        // Pre-filter the card list based on FormFilters predicates
        val cardRows = if (filters == null) {
            allCardRows.values
        } else {
            allCardRows.values.filter { passesFilters(it, filters) }
        }

        log.info(
            "[Recommendations] filters={} totalCards={} afterFilter={}",
            filters, allCardRows.size, cardRows.count()
        )

        val results = cardRows.map { card ->
            // Apply per-card earn-rate bonus multiplier when the user flag is set.
            // Only the card's own multiplier is used (Rogers bonus only applies to
            // the Rogers card; Amazon Prime multiplier only to an Amazon card).
            val bonusMultiplier = when {
                filters?.rogersOwner == true && card.rogersBonusMultiplier > 1.0 ->
                    card.rogersBonusMultiplier
                filters?.amazonPrime == true && card.amazonPrimeMultiplier > 1.0 ->
                    card.amazonPrimeMultiplier
                else -> 1.0
            }

            val breakdown = spendMap.entries
                .filter { (_, amount) -> amount > 0.0 }
                .mapNotNull { (category, monthlySpend) ->
                    val baseRate = card.earnRates.getOrDefault(category, 0.0)
                    // Skip categories this card earns nothing on — keeps breakdown clean
                    if (baseRate == 0.0) return@mapNotNull null
                    val earnRate     = baseRate * bonusMultiplier
                    val annualSpend  = monthlySpend * 12.0
                    val pointsEarned = annualSpend * earnRate
                    val valueCAD     = round2(pointsEarned * card.cpp / 100.0)
                    CategoryBreakdown(
                        category     = category,
                        spent        = annualSpend,
                        pointsEarned = round2(pointsEarned),
                        valueCAD     = valueCAD
                    )
                }

            val totalValue = breakdown.sumOf { it.valueCAD }
            RecommendationResult(
                card              = CardSummary(card.id, card.name, card.issuer, card.annualFeeCad, card.pointsCurrency, card.cardType),
                breakdown         = breakdown,
                totalPointsEarned = round2(breakdown.sumOf { it.pointsEarned }),
                totalValueCAD     = round2(totalValue),
                netAnnualValue    = round2(totalValue - card.annualFeeCad)
            )
        }

        return results.sortedByDescending { it.netAnnualValue }
    }

    /**
     * For each requested profile, independently finds that profile's best card,
     * then aggregates the results into a [HouseholdOptimizationResult].
     *
     * "Dual-card strategy" is flagged whenever the profiles are assigned to
     * at least two distinct cards — meaning household members benefit from
     * splitting rather than sharing one card.
     *
     * @throws IllegalArgumentException for invalid input or missing profiles.
     */
    fun optimizeHousehold(request: HouseholdOptimizationRequest): HouseholdOptimizationResult {
        require(request.profileIds.size in 2..4) {
            "Provide 2 to 4 profile IDs for household optimization"
        }
        require(request.profileIds.distinct().size == request.profileIds.size) {
            "Profile IDs must be unique"
        }

        val assignments = request.profileIds.map { profileId ->
            val profile = profileService.getProfile(profileId)
                ?: throw ProfileNotFoundException(profileId)

            val best = calculateRecommendations(profile.spending).firstOrNull()
                ?: throw IllegalStateException("No card data available — is the database seeded?")

            ProfileOptimization(
                profile        = ProfileSummaryDto(profile.id, profile.name, profile.profileType),
                bestCard       = best.card,
                breakdown      = best.breakdown,
                netAnnualValue = best.netAnnualValue
            )
        }.sortedByDescending { it.netAnnualValue }

        val uniqueCardIds = assignments.map { it.bestCard.id }.distinct()
        val isDual        = uniqueCardIds.size > 1
        val combined      = round2(assignments.sumOf { it.netAnnualValue })

        val insight = if (isDual) {
            val pairings = assignments.joinToString(" + ") {
                "${it.profile.name} → ${it.bestCard.name}"
            }
            "Dual-card strategy: $pairings. Combined annual value: \$$combined CAD."
        } else {
            "All profiles share the same optimal card: ${assignments.first().bestCard.name}. " +
                "Combined annual value: \$$combined CAD."
        }

        return HouseholdOptimizationResult(
            assignments            = assignments,
            combinedNetAnnualValue = combined,
            isDualCardStrategy     = isDual,
            insight                = insight
        )
    }

    // ── Filter predicate ────────────────────────────────────────────────────

    private fun passesFilters(card: CardRow, filters: FormFilters): Boolean {
        // Network: if the caller selected specific networks, the card must match one
        if (filters.networks.isNotEmpty() && card.cardType !in filters.networks) return false

        // Annual fee: "no_fee" means only $0 cards
        if (filters.feePreference == "no_fee" && card.annualFeeCad > 0.0) return false

        // Reward type: cashback = Cash Back currency only, points = non-Cash Back
        when (filters.rewardType) {
            "cashback" -> if (card.pointsCurrency != "Cash Back") return false
            "points"   -> if (card.pointsCurrency == "Cash Back") return false
            // "both" → no restriction
        }

        // Institution: if caller selected specific issuers, card must match one
        if (filters.institutions.isNotEmpty() && card.issuer !in filters.institutions) return false

        // Benefits: each selected perk must be present on the card
        val b = filters.benefits
        if (b.noForeignFee   && !card.noForeignFee)   return false
        if (b.airportLounge  && !card.airportLounge)   return false
        if (b.priorityTravel && !card.priorityTravel)  return false
        if (b.freeCheckedBag && !card.freeCheckedBag)  return false

        return true
    }

    // ── Internal types ──────────────────────────────────────────────────────

    private data class CardRow(
        val id:                    Int,
        val name:                  String,
        val issuer:                String,
        val annualFeeCad:          Double,
        val pointsCurrency:        String,
        val cpp:                   Double,
        val cardType:              String,
        val noForeignFee:          Boolean,
        val airportLounge:         Boolean,
        val priorityTravel:        Boolean,
        val freeCheckedBag:        Boolean,
        val rogersBonusMultiplier: Double,
        val amazonPrimeMultiplier: Double,
        val earnRates:             MutableMap<String, Double>
    )

    private fun round2(value: Double): Double = Math.round(value * 100.0) / 100.0
}
