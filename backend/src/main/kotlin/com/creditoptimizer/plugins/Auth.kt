package com.creditoptimizer.plugins

import com.auth0.jwk.JwkProviderBuilder
import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.auth.*
import io.ktor.server.auth.jwt.*
import io.ktor.server.response.*
import java.util.concurrent.TimeUnit

fun Application.configureAuth() {
    val domain = environment.config.propertyOrNull("auth0.domain")?.getString()
        ?: System.getenv("AUTH0_DOMAIN")
        ?: error("AUTH0_DOMAIN is not configured")
    val audience = environment.config.propertyOrNull("auth0.audience")?.getString()
        ?: System.getenv("AUTH0_AUDIENCE")
        ?: error("AUTH0_AUDIENCE is not configured")

    val jwkProvider = JwkProviderBuilder("https://$domain/")
        .cached(10, 24, TimeUnit.HOURS)
        .rateLimited(10, 1, TimeUnit.MINUTES)
        .build()

    install(Authentication) {
        jwt("auth0-jwt") {
            realm = "Points Optimizer API"
            verifier(jwkProvider, "https://$domain/") {
                withAudience(audience)
                withIssuer("https://$domain/")
            }
            validate { credential ->
                if (credential.payload.audience.contains(audience))
                    JWTPrincipal(credential.payload)
                else null
            }
            challenge { _, _ ->
                call.respond(
                    HttpStatusCode.Unauthorized,
                    mapOf("error" to "Token is missing or invalid")
                )
            }
        }
    }
}
