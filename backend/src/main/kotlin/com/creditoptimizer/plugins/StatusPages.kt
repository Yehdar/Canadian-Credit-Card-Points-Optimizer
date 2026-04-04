package com.creditoptimizer.plugins

import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.plugins.*
import io.ktor.server.plugins.statuspages.*
import io.ktor.server.response.*

fun Application.configureStatusPages() {
    install(StatusPages) {
        exception<BadRequestException> { call, _ ->
            call.respond(HttpStatusCode.BadRequest, mapOf("error" to "Invalid request body"))
        }
        exception<IllegalArgumentException> { call, cause ->
            call.respond(HttpStatusCode.UnprocessableEntity, mapOf("error" to (cause.message ?: "Validation error")))
        }
    }
}
