package com.creditoptimizer.db

import org.jetbrains.exposed.sql.Table

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
