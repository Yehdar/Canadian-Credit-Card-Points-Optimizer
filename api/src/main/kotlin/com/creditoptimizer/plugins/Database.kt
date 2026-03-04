package com.creditoptimizer.plugins

import com.zaxxer.hikari.HikariConfig
import com.zaxxer.hikari.HikariDataSource
import io.ktor.server.application.*
import org.flywaydb.core.Flyway
import org.jetbrains.exposed.sql.Database

fun Application.configureDatabase() {
    val jdbcUrl  = environment.config.propertyOrNull("database.url")?.getString()
        ?: "jdbc:postgresql://localhost:5432/creditoptimizer"
    val user     = environment.config.propertyOrNull("database.user")?.getString() ?: "postgres"
    val password = environment.config.propertyOrNull("database.password")?.getString() ?: "postgres"

    val dataSource = HikariDataSource(HikariConfig().apply {
        this.jdbcUrl    = jdbcUrl
        driverClassName = "org.postgresql.Driver"
        username        = user
        this.password   = password
        maximumPoolSize = 10
    })

    Flyway.configure()
        .dataSource(dataSource)
        .locations("classpath:db/migration")
        .load()
        .migrate()

    Database.connect(dataSource)
}
