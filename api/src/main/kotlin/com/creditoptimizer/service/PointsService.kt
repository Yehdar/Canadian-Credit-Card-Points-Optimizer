package com.creditoptimizer.service

import com.creditoptimizer.db.CardEarnRates
import com.creditoptimizer.db.CreditCards
import com.creditoptimizer.dto.*
import org.jetbrains.exposed.sql.selectAll
import org.jetbrains.exposed.sql.transactions.transaction

class PointsService {

    fun getAllCards(): List<CardSummary> = transaction {
        CreditCards.selectAll().map { row ->
            CardSummary(
                id             = row[CreditCards.id],
                name           = row[CreditCards.name],
                issuer         = row[CreditCards.issuer],
                annualFee      = row[CreditCards.annualFeeCad].toDouble(),
                pointsCurrency = row[CreditCards.pointsCurrency],
                cardType       = row[CreditCards.cardType]
            )
        }
    }

    fun calculateRecommendations(spending: SpendingBreakdown): List<RecommendationResult> {
        val spendMap = mapOf(
            "groceries"     to spending.groceries,
            "dining"        to spending.dining,
            "gas"           to spending.gas,
            "travel"        to spending.travel,
            "entertainment" to spending.entertainment,
            "subscriptions" to spending.subscriptions,
            "transit"       to spending.transit,
            "other"         to spending.other
        )

        val cardRows: Map<Int, CardRow> = transaction {
            val cards = CreditCards.selectAll().associate { row ->
                row[CreditCards.id] to CardRow(
                    id             = row[CreditCards.id],
                    name           = row[CreditCards.name],
                    issuer         = row[CreditCards.issuer],
                    annualFeeCad   = row[CreditCards.annualFeeCad].toDouble(),
                    pointsCurrency = row[CreditCards.pointsCurrency],
                    cpp            = row[CreditCards.cpp].toDouble(),
                    cardType       = row[CreditCards.cardType],
                    earnRates      = mutableMapOf()
                )
            }
            CardEarnRates.selectAll().forEach { row ->
                cards[row[CardEarnRates.cardId]]?.earnRates?.put(
                    row[CardEarnRates.category],
                    row[CardEarnRates.earnRate].toDouble()
                )
            }
            cards
        }

        val results = cardRows.values.map { card ->
            val breakdown = spendMap.entries
                .filter { (_, amount) -> amount > 0.0 }
                .map { (category, monthlySpend) ->
                    val annualSpend  = monthlySpend * 12.0
                    val earnRate     = card.earnRates.getOrDefault(category, 0.0)
                    val pointsEarned = annualSpend * earnRate
                    val valueCAD     = round2(pointsEarned * card.cpp / 100.0)
                    CategoryBreakdown(
                        category     = category,
                        spent        = annualSpend,
                        pointsEarned = round2(pointsEarned),
                        valueCAD     = valueCAD
                    )
                }

            val totalValue = breakdown.sumOf { it.valueCAD }
            RecommendationResult(
                card              = CardSummary(card.id, card.name, card.issuer, card.annualFeeCad, card.pointsCurrency, card.cardType),
                breakdown         = breakdown,
                totalPointsEarned = round2(breakdown.sumOf { it.pointsEarned }),
                totalValueCAD     = round2(totalValue),
                netAnnualValue    = round2(totalValue - card.annualFeeCad)
            )
        }

        return results.sortedByDescending { it.netAnnualValue }
    }

    private data class CardRow(
        val id:             Int,
        val name:           String,
        val issuer:         String,
        val annualFeeCad:   Double,
        val pointsCurrency: String,
        val cpp:            Double,
        val cardType:       String,
        val earnRates:      MutableMap<String, Double>
    )

    private fun round2(value: Double): Double = Math.round(value * 100.0) / 100.0
}
