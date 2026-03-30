package com.creditoptimizer.dto

import kotlinx.serialization.Serializable

/**
 * Allowed profile types.
 * Validated server-side; mirrors the CHECK constraint in V3 migration.
 */
object ProfileType {
    const val PERSONAL = "personal"
    const val BUSINESS = "business"
    const val PARTNER  = "partner"

    val all = setOf(PERSONAL, BUSINESS, PARTNER)
}

// ---------------------------------------------------------------------------
// Requests
// ---------------------------------------------------------------------------

@Serializable
data class CreateProfileRequest(
    /** Display name chosen by the user, e.g. "My Personal Card Setup". */
    val name:        String,
    /** Must be one of: personal | business | partner */
    val profileType: String,
    /** Monthly CAD spending per category. */
    val spending:    SpendingBreakdown
)

@Serializable
data class UpdateProfileRequest(
    val name:        String?           = null,
    val profileType: String?           = null,
    val spending:    SpendingBreakdown? = null
)

// ---------------------------------------------------------------------------
// Responses
// ---------------------------------------------------------------------------

@Serializable
data class ProfileResponse(
    val id:          Int,
    val name:        String,
    val profileType: String,
    val spending:    SpendingBreakdown,
    /** ISO-8601 string; omit timezone conversion — store UTC, display locally. */
    val createdAt:   String,
    val updatedAt:   String
)
