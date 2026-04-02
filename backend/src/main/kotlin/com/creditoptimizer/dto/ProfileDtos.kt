package com.creditoptimizer.dto

import kotlinx.serialization.Serializable

// ---------------------------------------------------------------------------
// Saved-card types  (serialized as JSON into saved_cards_json column)
// ---------------------------------------------------------------------------

@Serializable
data class SavedCardBreakdownDto(
    val category:     String,
    val spent:        Double,
    val pointsEarned: Double,
    val valueCAD:     Double,
)

@Serializable
data class SavedCardVisualConfigDto(
    val baseColor:   String,
    val metalness:   Double,
    val roughness:   Double,
    val finish:      String,
    val brandDomain: String,
    val companyName: String,
    val network:     String,
    val cardNumber:  String,
    val isMetal:     Boolean,
)

@Serializable
data class SavedCardDto(
    val name:               String,
    val issuer:             String,
    val annualFee:          Double,
    val pointsCurrency:     String,
    val cardType:           String,
    val isPointsBased:      Boolean,
    val breakdown:          List<SavedCardBreakdownDto>,
    val totalPointsEarned:  Double,
    val totalValueCAD:      Double,
    val netAnnualValue:     Double,
    val eligibilityWarning: String?                   = null,
    val purpose:            String,
    val description:        String,
    val visualConfig:       SavedCardVisualConfigDto? = null,
)

// ---------------------------------------------------------------------------

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
    val name:        String?            = null,
    val profileType: String?            = null,
    val spending:    SpendingBreakdown? = null,
    val savedCards:  List<SavedCardDto>? = null,
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
    val savedCards:  List<SavedCardDto>? = null,
    /** ISO-8601 string; omit timezone conversion — store UTC, display locally. */
    val createdAt:   String,
    val updatedAt:   String,
)
