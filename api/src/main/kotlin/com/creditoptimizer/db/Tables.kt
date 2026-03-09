package com.creditoptimizer.db

import org.jetbrains.exposed.sql.Table
import org.jetbrains.exposed.dao.id.IntIdTable
import org.jetbrains.exposed.sql.javatime.timestamp

object CreditCards : Table("credit_cards") {
    val id             = integer("id").autoIncrement()
    val name           = varchar("name", 100)
    val issuer         = varchar("issuer", 100)
    val annualFeeCad   = decimal("annual_fee_cad", 8, 2)
    val pointsCurrency = varchar("points_currency", 50)
    val cpp            = decimal("cpp", 6, 4)
    val cardType       = varchar("card_type", 20)

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

    // Monthly CAD spend per category
    val groceries     = decimal("groceries",     10, 2)
    val dining        = decimal("dining",        10, 2)
    val gas           = decimal("gas",           10, 2)
    val travel        = decimal("travel",        10, 2)
    val entertainment = decimal("entertainment", 10, 2)
    val subscriptions = decimal("subscriptions", 10, 2)
    val transit       = decimal("transit",       10, 2)
    val other         = decimal("other",         10, 2)

    val createdAt     = timestamp("created_at")
    val updatedAt     = timestamp("updated_at")
}