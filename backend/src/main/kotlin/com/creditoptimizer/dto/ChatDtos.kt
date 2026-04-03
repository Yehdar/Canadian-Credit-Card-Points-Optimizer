package com.creditoptimizer.dto

import kotlinx.serialization.Serializable

/**
 * Single-shot optimization request.
 * The frontend collects all user data in a form and sends it in one request.
 * [strategy] controls how many cards are returned: "simple" = 1, "arsenal" = 2–5.
 */
@Serializable
data class OptimizeRequest(
    val strategy:             String,           // "simple" | "arsenal"
    val spending:             SpendingBreakdown,
    val filters:              FormFilters       = FormFilters(),
    val annualIncome:         Int?              = null,
    val householdIncome:      Int?              = null,
    val estimatedCreditScore: Int?              = null,
    val userText:             String?           = null  // Raw chat message from the user
)

@Serializable
data class ChatResponse(
    val message: String,
    val isDone:  Boolean = false
)
