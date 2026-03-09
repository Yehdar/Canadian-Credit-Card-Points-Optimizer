package com.creditoptimizer.dto

import kotlinx.serialization.Serializable

/** Legacy direct-spend request — kept for backwards compatibility. */
@Serializable
data class SpendingRequest(val spending: SpendingBreakdown)

/**
 * Unified recommendations request.
 * Callers supply EITHER a saved [profileId] OR an inline [spending] breakdown.
 * Supplying both is an error; supplying neither is an error.
 */
@Serializable
data class RecommendationsRequest(
    val profileId: Int?              = null,
    val spending:  SpendingBreakdown? = null
)

@Serializable
data class SpendingBreakdown(
    val groceries:     Double = 0.0,
    val dining:        Double = 0.0,
    val gas:           Double = 0.0,
    val travel:        Double = 0.0,
    val entertainment: Double = 0.0,
    val subscriptions: Double = 0.0,
    val transit:       Double = 0.0,
    val other:         Double = 0.0
)

@Serializable
data class CardSummary(
    val id:             Int,
    val name:           String,
    val issuer:         String,
    val annualFee:      Double,
    val pointsCurrency: String,
    val cardType:       String
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
    val card:              CardSummary,
    val breakdown:         List<CategoryBreakdown>,
    val totalPointsEarned: Double,
    val totalValueCAD:     Double,
    val netAnnualValue:    Double
)
