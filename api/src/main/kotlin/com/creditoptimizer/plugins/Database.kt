package com.creditoptimizer.plugins

import com.zaxxer.hikari.HikariConfig
import com.zaxxer.hikari.HikariDataSource
import io.ktor.server.application.*
import org.jetbrains.exposed.sql.Database

fun Application.configureDatabase() {
    val jdbcUrl = environment.config.propertyOrNull("database.url")?.getString()
        ?: "jdbc:postgresql://localhost:5432/creditoptimizer"
    val user = environment.config.propertyOrNull("database.user")?.getString() ?: "postgres"
    val password = environment.config.propertyOrNull("database.password")?.getString() ?: "postgres"

    val config = HikariConfig().apply {
        this.jdbcUrl = jdbcUrl
        driverClassName = "org.postgresql.Driver"
        username = user
        this.password = password
        maximumPoolSize = 10
    }
    Database.connect(HikariDataSource(config))
}
