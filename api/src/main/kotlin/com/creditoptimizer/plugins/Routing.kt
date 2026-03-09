package com.creditoptimizer.plugins

import com.creditoptimizer.dto.CreateProfileRequest
import com.creditoptimizer.dto.RecommendationsRequest
import com.creditoptimizer.dto.UpdateProfileRequest
import com.creditoptimizer.service.PointsService
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

    val pointsService  = PointsService()
    val profileService = ProfileService()

    routing {
        get("/health") {
            call.respond(HttpStatusCode.OK, mapOf("status" to "ok"))
        }

        route("/api") {

            // ------------------------------------------------------------------
            // Cards
            // ------------------------------------------------------------------
            get("/cards") {
                call.respond(HttpStatusCode.OK, pointsService.getAllCards())
            }

            // ------------------------------------------------------------------
            // Recommendations
            // Accepts: { "profileId": 1 }  OR  { "spending": { ... } }
            // ------------------------------------------------------------------
            post("/recommendations") {
                val request = try {
                    call.receive<RecommendationsRequest>()
                } catch (e: Exception) {
                    call.respond(HttpStatusCode.BadRequest, mapOf("error" to "Invalid request body"))
                    return@post
                }

                val results = try {
                    pointsService.calculateRecommendations(request)
                } catch (e: IllegalArgumentException) {
                    call.respond(HttpStatusCode.BadRequest, mapOf("error" to (e.message ?: "Bad request")))
                    return@post
                }

                call.respond(HttpStatusCode.OK, results)
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
                    val request = try {
                        call.receive<CreateProfileRequest>()
                    } catch (e: Exception) {
                        call.respond(HttpStatusCode.BadRequest, mapOf("error" to "Invalid request body"))
                        return@post
                    }

                    val profile = try {
                        profileService.createProfile(request)
                    } catch (e: IllegalArgumentException) {
                        call.respond(HttpStatusCode.UnprocessableEntity, mapOf("error" to (e.message ?: "Validation error")))
                        return@post
                    }

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

                        val request = try {
                            call.receive<UpdateProfileRequest>()
                        } catch (e: Exception) {
                            call.respond(HttpStatusCode.BadRequest, mapOf("error" to "Invalid request body"))
                            return@put
                        }

                        val updated = try {
                            profileService.updateProfile(id, request)
                        } catch (e: IllegalArgumentException) {
                            call.respond(HttpStatusCode.UnprocessableEntity, mapOf("error" to (e.message ?: "Validation error")))
                            return@put
                        }

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
