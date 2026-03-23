package com.creditoptimizer.dto

import kotlinx.serialization.Serializable

/** Legacy direct-spend request — kept for backwards compatibility. */
@Serializable
data class SpendingRequest(val spending: SpendingBreakdown)

/**
 * Unified recommendations request.
 * Callers supply EITHER a saved [profileId] OR an inline [spending] breakdown.
 * Supplying both is an error; supplying neither is an error.
 * An optional [filters] object restricts which cards are returned.
 *
 * [annualIncome] and [householdIncome] are the user's personal and household annual
 * income in CAD. [estimatedCreditScore] is the user's self-reported credit score.
 * When provided, cards whose minimum income or credit thresholds exceed these values
 * are hard-filtered out; cards close to a credit-score threshold surface an
 * [RecommendationResult.eligibilityWarning].
 */
@Serializable
data class RecommendationsRequest(
    val profileId:            Int?              = null,
    val spending:             SpendingBreakdown? = null,
    val filters:              FormFilters?       = null,
    val annualIncome:         Int?              = null,
    val householdIncome:      Int?              = null,
    val estimatedCreditScore: Int?              = null
)

@Serializable
data class SpendingBreakdown(
    // Original 8 categories
    val groceries:            Double = 0.0,
    val dining:               Double = 0.0,
    val gas:                  Double = 0.0,
    val travel:               Double = 0.0,
    val entertainment:        Double = 0.0,
    val subscriptions:        Double = 0.0,
    val transit:              Double = 0.0,
    val other:                Double = 0.0,

    // 5 expanded categories (V4)
    val pharmacy:             Double = 0.0,
    val onlineShopping:       Double = 0.0,
    val homeImprovement:      Double = 0.0,
    val canadianTirePartners: Double = 0.0,
    val foreignPurchases:     Double = 0.0
)

/** Per-perk filter flags from the BenefitsModule. */
@Serializable
data class BenefitFilters(
    val noForeignFee:        Boolean = false,
    val airportLounge:       Boolean = false,
    val loungeVisitsPerYear: Int     = 4,
    val priorityTravel:      Boolean = false,
    val freeCheckedBag:      Boolean = false
)

/**
 * Form-level filters forwarded from the six UI modules.
 *
 * | Field           | Source module        | Effect                                   |
 * |-----------------|----------------------|------------------------------------------|
 * | rewardType      | PreferencesModule    | Restrict to cashback / points / both     |
 * | feePreference   | PreferencesModule    | Exclude annual-fee cards if "no_fee"     |
 * | rogersOwner     | BonusesModule        | Apply Rogers bonus multiplier            |
 * | amazonPrime     | BonusesModule        | Apply Amazon Prime multiplier (future)   |
 * | institutions    | InstitutionsModule   | Restrict by card issuer                  |
 * | networks        | NetworkModule        | Restrict by card network                 |
 * | benefits        | BenefitsModule       | Require specific card perks              |
 */
@Serializable
data class FormFilters(
    val rewardType:    String        = "both",
    val feePreference: String        = "include_fee",
    val rogersOwner:   Boolean       = false,
    val amazonPrime:   Boolean       = false,
    val institutions:  List<String>  = emptyList(),
    val networks:      List<String>  = emptyList(),
    val benefits:      BenefitFilters = BenefitFilters()
)

@Serializable
data class CardSummary(
    val id:             Int,
    val name:           String,
    val issuer:         String,
    val annualFee:      Double,
    val pointsCurrency: String,
    val cardType:       String,
    val isPointsBased:  Boolean  // TRUE = points currency; FALSE = cash-back / store-credit
)

@Serializable
data class CategoryBreakdown(
    val category:     String,
    val spent:        Double,
    val pointsEarned: Double,
    val valueCAD:     Double
)

@Serializable
data class RecommendationResult(
    val card:               CardSummary,
    val breakdown:          List<CategoryBreakdown>,
    val totalPointsEarned:  Double,
    val totalValueCAD:      Double,
    val netAnnualValue:     Double,
    /** Non-null when the user's credit score is within the soft buffer of the card's minimum. */
    val eligibilityWarning: String? = null
)
