package com.creditoptimizer.dto

import kotlinx.serialization.Serializable

@Serializable
data class HouseholdOptimizationRequest(
    /** 2–4 distinct profile IDs to compare. */
    val profileIds: List<Int>
)

/** Slim profile identifier returned inside optimization results. */
@Serializable
data class ProfileSummaryDto(
    val id:          Int,
    val name:        String,
    val profileType: String
)

/** The best card assigned to one profile in a household optimization run. */
@Serializable
data class ProfileOptimization(
    val profile:       ProfileSummaryDto,
    val bestCard:      CardSummary,
    val breakdown:     List<CategoryBreakdown>,
    val netAnnualValue: Double
)

@Serializable
data class HouseholdOptimizationResult(
    /** One entry per requested profile, sorted by netAnnualValue descending. */
    val assignments:            List<ProfileOptimization>,
    /** Sum of all profiles' netAnnualValue for the assigned cards. */
    val combinedNetAnnualValue: Double,
    /** True when at least two profiles are assigned different cards. */
    val isDualCardStrategy:     Boolean,
    /** Human-readable summary sentence for the UI. */
    val insight:                String
)
