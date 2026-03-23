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
                cardType       = row[CreditCards.cardType],
                isPointsBased  = row[CreditCards.isPointsBased]
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
     * Optional [RecommendationsRequest.filters] restrict which cards are returned.
     * Optional [RecommendationsRequest.annualIncome], [householdIncome], and
     * [estimatedCreditScore] gate out cards the user is ineligible for.
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

        return calculateRecommendations(
            spending,
            request.filters,
            request.annualIncome,
            request.householdIncome,
            request.estimatedCreditScore
        )
    }

    /** Core calculation — accepts a resolved [SpendingBreakdown] and optional filters/eligibility. */
    fun calculateRecommendations(
        spending:             SpendingBreakdown,
        filters:              FormFilters? = null,
        annualIncome:         Int?         = null,
        householdIncome:      Int?         = null,
        estimatedCreditScore: Int?         = null
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
                    isPointsBased         = row[CreditCards.isPointsBased],
                    noForeignFee          = row[CreditCards.noForeignFee],
                    airportLounge         = row[CreditCards.airportLounge],
                    priorityTravel        = row[CreditCards.priorityTravel],
                    freeCheckedBag        = row[CreditCards.freeCheckedBag],
                    rogersBonusMultiplier = row[CreditCards.rogersBonusMultiplier].toDouble(),
                    amazonPrimeMultiplier = row[CreditCards.amazonPrimeMultiplier].toDouble(),
                    minIncomePersonal     = row[CreditCards.minIncomePersonal],
                    minIncomeHousehold    = row[CreditCards.minIncomeHousehold],
                    minCreditScore        = row[CreditCards.minCreditScore],
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

        // Pre-filter: FormFilters predicates (network, fee, reward type, institution, benefits)
        val afterFormFilter = if (filters == null) {
            allCardRows.values.toList()
        } else {
            allCardRows.values.filter { passesFilters(it, filters) }
        }

        // Pre-filter: eligibility — hard-exclude cards the user cannot qualify for
        val cardRows = afterFormFilter.filter { card ->
            eligibilityPasses(card, annualIncome, householdIncome, estimatedCreditScore)
        }

        log.info(
            "[Recommendations] filters={} totalCards={} afterFormFilter={} afterEligibility={}",
            filters, allCardRows.size, afterFormFilter.size, cardRows.size
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

            // Soft eligibility: warn when credit score is close to but below the minimum
            val warning = eligibilityWarning(card, estimatedCreditScore)

            RecommendationResult(
                card               = CardSummary(card.id, card.name, card.issuer, card.annualFeeCad, card.pointsCurrency, card.cardType, card.isPointsBased),
                breakdown          = breakdown,
                totalPointsEarned  = round2(breakdown.sumOf { it.pointsEarned }),
                totalValueCAD      = round2(totalValue),
                netAnnualValue     = round2(totalValue - card.annualFeeCad),
                eligibilityWarning = warning
            )
        }

        return results.sortedByDescending { it.netAnnualValue }
    }

    // ── Eligibility helpers ─────────────────────────────────────────────────

    /**
     * Returns `true` when the user passes the card's income and credit-score hard gates.
     *
     * Income rule: the user qualifies if their personal income meets [CardRow.minIncomePersonal]
     * OR their household income meets [CardRow.minIncomeHousehold].  If neither threshold is
     * set, income is not evaluated.
     *
     * Credit-score rule: scores below `minCreditScore - CREDIT_SCORE_SOFT_BUFFER` are hard-excluded.
     * Scores within the buffer are allowed but surface a [eligibilityWarning].
     * If the user did not supply a score (null), no filtering is applied.
     */
    private fun eligibilityPasses(
        card:                 CardRow,
        annualIncome:         Int?,
        householdIncome:      Int?,
        estimatedCreditScore: Int?
    ): Boolean {
        // Income: only evaluated when the card has at least one income threshold
        val minPersonal  = card.minIncomePersonal
        val minHousehold = card.minIncomeHousehold
        if ((minPersonal != null || minHousehold != null) && (annualIncome != null || householdIncome != null)) {
            val meetsPersonal  = minPersonal  == null || (annualIncome  ?: 0) >= minPersonal
            val meetsHousehold = minHousehold == null || (householdIncome ?: 0) >= minHousehold
            if (!meetsPersonal && !meetsHousehold) return false
        }

        // Credit score: hard-exclude if user is below the soft-buffer floor
        val minScore = card.minCreditScore
        if (minScore != null && estimatedCreditScore != null) {
            if (estimatedCreditScore < minScore - CREDIT_SCORE_SOFT_BUFFER) return false
        }

        return true
    }

    /**
     * Returns a human-readable warning when the user's credit score is within the soft buffer
     * of the card's minimum, or `null` when no warning is needed.
     */
    private fun eligibilityWarning(card: CardRow, estimatedCreditScore: Int?): String? {
        val minScore = card.minCreditScore ?: return null
        val score    = estimatedCreditScore ?: return null
        return if (score in (minScore - CREDIT_SCORE_SOFT_BUFFER) until minScore) {
            "Your estimated credit score may be slightly below the typical approval threshold " +
            "for this card (${minScore}+). You may still be approved at the issuer's discretion."
        } else null
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
        val isPointsBased:         Boolean,
        val noForeignFee:          Boolean,
        val airportLounge:         Boolean,
        val priorityTravel:        Boolean,
        val freeCheckedBag:        Boolean,
        val rogersBonusMultiplier: Double,
        val amazonPrimeMultiplier: Double,
        // Eligibility thresholds (V7); null = no minimum enforced
        val minIncomePersonal:     Int?,
        val minIncomeHousehold:    Int?,
        val minCreditScore:        Int?,
        val earnRates:             MutableMap<String, Double>
    )

    private fun round2(value: Double): Double = Math.round(value * 100.0) / 100.0

    companion object {
        /** Credit scores within this many points below the minimum show a soft warning instead of being excluded. */
        private const val CREDIT_SCORE_SOFT_BUFFER = 30
    }
}
