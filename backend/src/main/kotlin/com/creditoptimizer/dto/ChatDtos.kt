package com.creditoptimizer.dto

import kotlinx.serialization.Serializable

@Serializable
data class ChatMessage(
    val role: String,     // "user" | "model"
    val content: String
)

@Serializable
data class ChatRequest(
    val messages: List<ChatMessage>
)

@Serializable
data class ChatResponse(
    val message: String,
    val isDone: Boolean = false
)
