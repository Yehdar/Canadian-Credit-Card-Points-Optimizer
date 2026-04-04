package com.creditoptimizer.plugins

import com.creditoptimizer.dto.OptimizeRequest
import com.creditoptimizer.dto.CreateProfileRequest
import com.creditoptimizer.dto.UpdateProfileRequest
import com.creditoptimizer.service.GeminiService
import com.creditoptimizer.service.ProfileService
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
        allowMethod(HttpMethod.Put)
        allowMethod(HttpMethod.Delete)
    }

    val profileService = ProfileService()
    val geminiService  = GeminiService(System.getenv("GEMINI_API_KEY") ?: "")

    routing {
        get("/health") {
            call.respond(HttpStatusCode.OK, mapOf("status" to "ok"))
        }

        route("/api") {

            // ------------------------------------------------------------------
            // Chat  (Gemini 2.0 Flash — Akinator-style card advisor)
            // ------------------------------------------------------------------
            post("/chat") {
                val request = call.receive<OptimizeRequest>()
                val response = geminiService.optimize(request)
                call.respond(HttpStatusCode.OK, response)
            }

            // ------------------------------------------------------------------
            // Profiles  (CRUD)
            // ------------------------------------------------------------------
            route("/profiles") {

                // GET /api/profiles — list all saved profiles
                get {
                    call.respond(HttpStatusCode.OK, profileService.getAllProfiles())
                }

                // POST /api/profiles — create a new profile
                post {
                    val request = call.receive<CreateProfileRequest>()
                    val profile = profileService.createProfile(request)
                    call.respond(HttpStatusCode.Created, profile)
                }

                route("/{id}") {

                    // GET /api/profiles/{id}
                    get {
                        val id = call.parameters["id"]?.toIntOrNull()
                            ?: return@get call.respond(HttpStatusCode.BadRequest, mapOf("error" to "Invalid profile id"))

                        val profile = profileService.getProfile(id)
                            ?: return@get call.respond(HttpStatusCode.NotFound, mapOf("error" to "Profile not found"))

                        call.respond(HttpStatusCode.OK, profile)
                    }

                    // PUT /api/profiles/{id} — full or partial update
                    put {
                        val id = call.parameters["id"]?.toIntOrNull()
                            ?: return@put call.respond(HttpStatusCode.BadRequest, mapOf("error" to "Invalid profile id"))

                        val request = call.receive<UpdateProfileRequest>()
                        val updated = profileService.updateProfile(id, request)

                        if (updated == null) {
                            call.respond(HttpStatusCode.NotFound, mapOf("error" to "Profile not found"))
                        } else {
                            call.respond(HttpStatusCode.OK, updated)
                        }
                    }

                    // DELETE /api/profiles/{id}
                    delete {
                        val id = call.parameters["id"]?.toIntOrNull()
                            ?: return@delete call.respond(HttpStatusCode.BadRequest, mapOf("error" to "Invalid profile id"))

                        if (profileService.deleteProfile(id)) {
                            call.respond(HttpStatusCode.NoContent)
                        } else {
                            call.respond(HttpStatusCode.NotFound, mapOf("error" to "Profile not found"))
                        }
                    }
                }
            }
        }
    }
}
