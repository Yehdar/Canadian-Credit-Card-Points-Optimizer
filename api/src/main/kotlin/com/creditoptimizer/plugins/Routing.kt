package com.creditoptimizer.plugins

import com.creditoptimizer.dto.SpendingRequest
import com.creditoptimizer.service.PointsService
import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.plugins.cors.routing.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*

fun Application.configureRouting() {
    install(CORS) {
        allowHost("localhost:3000")
        allowHeader(HttpHeaders.ContentType)
        allowMethod(HttpMethod.Get)
        allowMethod(HttpMethod.Post)
    }

    val pointsService = PointsService()

    routing {
        get("/health") {
            call.respond(HttpStatusCode.OK, mapOf("status" to "ok"))
        }

        route("/api") {
            get("/cards") {
                call.respond(HttpStatusCode.OK, pointsService.getAllCards())
            }

            post("/recommendations") {
                val request = try {
                    call.receive<SpendingRequest>()
                } catch (e: Exception) {
                    call.respond(HttpStatusCode.BadRequest, mapOf("error" to "Invalid request body"))
                    return@post
                }
                call.respond(HttpStatusCode.OK, pointsService.calculateRecommendations(request.spending))
            }
        }
    }
}
