package com.creditoptimizer

import com.creditoptimizer.plugins.configureAuth
import com.creditoptimizer.plugins.configureDatabase
import com.creditoptimizer.plugins.configureRouting
import com.creditoptimizer.plugins.configureSerialization
import com.creditoptimizer.plugins.configureStatusPages
import io.ktor.server.application.*
import io.ktor.server.engine.*
import io.ktor.server.netty.*

fun main() {
    embeddedServer(Netty, port = 8080, host = "0.0.0.0", module = Application::module)
        .start(wait = true)
}

fun Application.module() {
    configureSerialization()
    configureStatusPages()
    configureAuth()
    configureDatabase()
    configureRouting()
}
