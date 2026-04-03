package com.creditoptimizer.dto

import kotlinx.serialization.Serializable

/**
 * Spending breakdown — kept for OptimizeRequest so Gemini can receive structured
 * spending data if the caller ever populates it. All categories default to 0.
 */
@Serializable
data class SpendingBreakdown(
    val groceries:            Double = 0.0,
    val dining:               Double = 0.0,
    val gas:                  Double = 0.0,
    val travel:               Double = 0.0,
    val entertainment:        Double = 0.0,
    val subscriptions:        Double = 0.0,
    val transit:              Double = 0.0,
    val other:                Double = 0.0,
    val pharmacy:             Double = 0.0,
    val onlineShopping:       Double = 0.0,
    val homeImprovement:      Double = 0.0,
    val canadianTirePartners: Double = 0.0,
    val foreignPurchases:     Double = 0.0
)

@Serializable
data class BenefitFilters(
    val noForeignFee:   Boolean = false,
    val airportLounge:  Boolean = false,
    val priorityTravel: Boolean = false,
    val freeCheckedBag: Boolean = false
)

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
