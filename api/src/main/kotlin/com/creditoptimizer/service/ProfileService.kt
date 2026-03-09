package com.creditoptimizer.service

import com.creditoptimizer.db.SpendingProfiles
import com.creditoptimizer.dto.*
import org.jetbrains.exposed.sql.*
import org.jetbrains.exposed.sql.SqlExpressionBuilder.eq
import org.jetbrains.exposed.sql.transactions.transaction
import java.math.BigDecimal

class ProfileService {

    // -----------------------------------------------------------------------
    // Public API
    // -----------------------------------------------------------------------

    fun getAllProfiles(): List<ProfileResponse> = transaction {
        SpendingProfiles.selectAll()
            .orderBy(SpendingProfiles.createdAt, SortOrder.DESC)
            .map { it.toResponse() }
    }

    fun getProfile(id: Int): ProfileResponse? = transaction {
        SpendingProfiles.selectAll()
            .where { SpendingProfiles.id eq id }
            .singleOrNull()
            ?.toResponse()
    }

    fun createProfile(request: CreateProfileRequest): ProfileResponse {
        require(request.name.isNotBlank()) { "Profile name must not be blank" }
        require(request.profileType in ProfileType.all) {
            "profileType must be one of: ${ProfileType.all.joinToString()}"
        }

        return transaction {
            val insertedId = SpendingProfiles.insertAndGetId {
                it[name]          = request.name.trim()
                it[profileType]   = request.profileType
                it[groceries]     = request.spending.groceries.toBigDecimal()
                it[dining]        = request.spending.dining.toBigDecimal()
                it[gas]           = request.spending.gas.toBigDecimal()
                it[travel]        = request.spending.travel.toBigDecimal()
                it[entertainment] = request.spending.entertainment.toBigDecimal()
                it[subscriptions] = request.spending.subscriptions.toBigDecimal()
                it[transit]       = request.spending.transit.toBigDecimal()
                it[other]         = request.spending.other.toBigDecimal()
                // created_at / updated_at default via DB trigger
            }

            SpendingProfiles.selectAll()
                .where { SpendingProfiles.id eq insertedId.value }
                .single()
                .toResponse()
        }
    }

    fun updateProfile(id: Int, request: UpdateProfileRequest): ProfileResponse? = transaction {
        val existing = SpendingProfiles.selectAll()
            .where { SpendingProfiles.id eq id }
            .singleOrNull() ?: return@transaction null

        request.profileType?.let {
            require(it in ProfileType.all) { "profileType must be one of: ${ProfileType.all.joinToString()}" }
        }

        val currentSpending = existing.toSpendingBreakdown()
        val merged = request.spending ?: currentSpending

        SpendingProfiles.update({ SpendingProfiles.id eq id }) {
            it[name]          = request.name?.trim() ?: existing[name]
            it[profileType]   = request.profileType  ?: existing[profileType]
            it[groceries]     = merged.groceries.toBigDecimal()
            it[dining]        = merged.dining.toBigDecimal()
            it[gas]           = merged.gas.toBigDecimal()
            it[travel]        = merged.travel.toBigDecimal()
            it[entertainment] = merged.entertainment.toBigDecimal()
            it[subscriptions] = merged.subscriptions.toBigDecimal()
            it[transit]       = merged.transit.toBigDecimal()
            it[other]         = merged.other.toBigDecimal()
            // updated_at is handled by the DB trigger in V3 migration
        }

        SpendingProfiles.selectAll()
            .where { SpendingProfiles.id eq id }
            .single()
            .toResponse()
    }

    fun deleteProfile(id: Int): Boolean = transaction {
        SpendingProfiles.deleteWhere { SpendingProfiles.id eq id } > 0
    }

    // -----------------------------------------------------------------------
    // Internal helpers
    // -----------------------------------------------------------------------

    private fun ResultRow.toSpendingBreakdown() = SpendingBreakdown(
        groceries     = this[SpendingProfiles.groceries].toDouble(),
        dining        = this[SpendingProfiles.dining].toDouble(),
        gas           = this[SpendingProfiles.gas].toDouble(),
        travel        = this[SpendingProfiles.travel].toDouble(),
        entertainment = this[SpendingProfiles.entertainment].toDouble(),
        subscriptions = this[SpendingProfiles.subscriptions].toDouble(),
        transit       = this[SpendingProfiles.transit].toDouble(),
        other         = this[SpendingProfiles.other].toDouble()
    )

    private fun ResultRow.toResponse() = ProfileResponse(
        id          = this[SpendingProfiles.id].value,
        name        = this[SpendingProfiles.name],
        profileType = this[SpendingProfiles.profileType],
        spending    = toSpendingBreakdown(),
        createdAt   = this[SpendingProfiles.createdAt].toString(),
        updatedAt   = this[SpendingProfiles.updatedAt].toString()
    )

    private fun Double.toBigDecimal(): BigDecimal = BigDecimal.valueOf(this)
}
