package com.creditoptimizer.db

import org.jetbrains.exposed.dao.id.IntIdTable
import org.jetbrains.exposed.sql.javatime.timestamp

// IntIdTable provides `id` (auto-increment PK) and `primaryKey` automatically.
object SpendingProfiles : IntIdTable("spending_profiles") {
    val name          = varchar("name", 100)
    val profileType   = varchar("profile_type", 20)   // 'personal' | 'business' | 'partner'

    // Original 8 monthly-CAD spend categories
    val groceries     = decimal("groceries",     10, 2)
    val dining        = decimal("dining",        10, 2)
    val gas           = decimal("gas",           10, 2)
    val travel        = decimal("travel",        10, 2)
    val entertainment = decimal("entertainment", 10, 2)
    val subscriptions = decimal("subscriptions", 10, 2)
    val transit       = decimal("transit",       10, 2)
    val other         = decimal("other",         10, 2)

    // 5 expanded categories (added in V4)
    val pharmacy               = decimal("pharmacy",               10, 2)
    val onlineShopping         = decimal("online_shopping",        10, 2)
    val homeImprovement        = decimal("home_improvement",       10, 2)
    val canadianTirePartners   = decimal("canadian_tire_partners", 10, 2)
    val foreignPurchases       = decimal("foreign_purchases",      10, 2)

    // Eligibility inputs (added in V7); NULL means user did not provide
    val annualIncome          = integer("annual_income").nullable()
    val householdIncome       = integer("household_income").nullable()
    val estimatedCreditScore  = integer("estimated_credit_score").nullable()

    // Gemini-recommended cards serialized as JSON (added in V10); NULL until user saves
    val savedCardsJson        = text("saved_cards_json").nullable()

    val createdAt     = timestamp("created_at")
    val updatedAt     = timestamp("updated_at")
}
