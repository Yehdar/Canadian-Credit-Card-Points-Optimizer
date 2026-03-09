package com.creditoptimizer.service

import com.creditoptimizer.db.CardEarnRates
import com.creditoptimizer.db.CreditCards
import com.creditoptimizer.dto.*
import org.jetbrains.exposed.sql.selectAll
import org.jetbrains.exposed.sql.transactions.transaction

class PointsService {

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
     * Entry point that accepts a [RecommendationsRequest].
     * Exactly one of [RecommendationsRequest.profileId] or
     * [RecommendationsRequest.spending] must be non-null.
     *
     * @throws IllegalArgumentException if neither or both fields are provided,
     *   or if the referenced profile does not exist.
     */
    fun calculateRecommendations(request: RecommendationsRequest): List<RecommendationResult> {
        require((request.profileId == null) != (request.spending == null)) {
            "Provide exactly one of 'profileId' or 'spending', not both (or neither)."
        }

        val spending = if (request.profileId != null) {
            profileService.getProfile(request.profileId)?.spending
                ?: throw IllegalArgumentException("Profile ${request.profileId} not found")
        } else {
            request.spending!!
        }

        return calculateRecommendations(spending)
    }

    /** Core calculation — accepts a resolved [SpendingBreakdown] directly. */
    fun calculateRecommendations(spending: SpendingBreakdown): List<RecommendationResult> {
        val spendMap = mapOf(
            "groceries"     to spending.groceries,
            "dining"        to spending.dining,
            "gas"           to spending.gas,
            "travel"        to spending.travel,
            "entertainment" to spending.entertainment,
            "subscriptions" to spending.subscriptions,
            "transit"       to spending.transit,
            "other"         to spending.other
        )

        val cardRows: Map<Int, CardRow> = transaction {
            val cards = CreditCards.selectAll().associate { row ->
                row[CreditCards.id] to CardRow(
                    id             = row[CreditCards.id],
                    name           = row[CreditCards.name],
                    issuer         = row[CreditCards.issuer],
                    annualFeeCad   = row[CreditCards.annualFeeCad].toDouble(),
                    pointsCurrency = row[CreditCards.pointsCurrency],
                    cpp            = row[CreditCards.cpp].toDouble(),
                    cardType       = row[CreditCards.cardType],
                    earnRates      = mutableMapOf()
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

        val results = cardRows.values.map { card ->
            val breakdown = spendMap.entries
                .filter { (_, amount) -> amount > 0.0 }
                .map { (category, monthlySpend) ->
                    val annualSpend  = monthlySpend * 12.0
                    val earnRate     = card.earnRates.getOrDefault(category, 0.0)
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
                ?: throw IllegalArgumentException("Profile $profileId not found")

            val best = calculateRecommendations(profile.spending).firstOrNull()
                ?: throw IllegalStateException("No card data available — is the database seeded?")

            ProfileOptimization(
                profile        = ProfileSummaryDto(profile.id, profile.name, profile.profileType),
                bestCard       = best.card,
                breakdown      = best.breakdown,
                netAnnualValue = best.netAnnualValue
            )
        }.sortedByDescending { it.netAnnualValue }

        val uniqueCardIds       = assignments.map { it.bestCard.id }.distinct()
        val isDual              = uniqueCardIds.size > 1
        val combined            = round2(assignments.sumOf { it.netAnnualValue })

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

    private data class CardRow(
        val id:             Int,
        val name:           String,
        val issuer:         String,
        val annualFeeCad:   Double,
        val pointsCurrency: String,
        val cpp:            Double,
        val cardType:       String,
        val earnRates:      MutableMap<String, Double>
    )

    private fun round2(value: Double): Double = Math.round(value * 100.0) / 100.0
}
