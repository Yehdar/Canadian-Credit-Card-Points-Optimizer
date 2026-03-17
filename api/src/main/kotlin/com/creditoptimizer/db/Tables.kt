package com.creditoptimizer.db

import org.jetbrains.exposed.sql.Table
import org.jetbrains.exposed.dao.id.IntIdTable
import org.jetbrains.exposed.sql.javatime.timestamp

object CreditCards : Table("credit_cards") {
    val id                    = integer("id").autoIncrement()
    val name                  = varchar("name", 100)
    val issuer                = varchar("issuer", 100)
    val annualFeeCad          = decimal("annual_fee_cad", 8, 2)
    val pointsCurrency        = varchar("points_currency", 50)
    val cpp                   = decimal("cpp", 6, 4)
    val cardType              = varchar("card_type", 20)

    // Benefit flags (added in V5)
    val noForeignFee          = bool("no_foreign_fee")
    val airportLounge         = bool("airport_lounge")
    val priorityTravel        = bool("priority_travel")
    val freeCheckedBag        = bool("free_checked_bag")

    // Earn-rate multipliers applied when the matching user flag is set (added in V5)
    val rogersBonusMultiplier = decimal("rogers_bonus_multiplier", 4, 2)
    val amazonPrimeMultiplier = decimal("amazon_prime_multiplier", 4, 2)

    // Metadata (added in V6)
    val issuerIconUrl  = varchar("issuer_icon_url", 255).nullable()
    val isPointsBased  = bool("is_points_based")

    override val primaryKey = PrimaryKey(id)
}

object CardEarnRates : Table("card_earn_rates") {
    val id       = integer("id").autoIncrement()
    val cardId   = integer("card_id").references(CreditCards.id)
    val category = varchar("category", 30)
    val earnRate = decimal("earn_rate", 6, 2)

    override val primaryKey = PrimaryKey(id)
}

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

    val createdAt     = timestamp("created_at")
    val updatedAt     = timestamp("updated_at")
}
