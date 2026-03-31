package com.creditoptimizer.service

import com.creditoptimizer.dto.ChatMessage
import com.creditoptimizer.dto.ChatResponse
import io.ktor.client.*
import io.ktor.client.call.*
import io.ktor.client.engine.cio.*
import io.ktor.client.plugins.*
import io.ktor.client.plugins.contentnegotiation.*
import io.ktor.client.request.*
import io.ktor.client.statement.*
import io.ktor.http.*
import io.ktor.serialization.kotlinx.json.*
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.*
import org.slf4j.LoggerFactory

@Serializable
private data class GeminiPart(val text: String)

@Serializable
private data class GeminiContent(val parts: List<GeminiPart>, val role: String = "model")

@Serializable
private data class GeminiCandidate(val content: GeminiContent)

@Serializable
private data class GeminiApiResponse(val candidates: List<GeminiCandidate>? = null)

class GeminiService(private val apiKey: String) {

    private val logger = LoggerFactory.getLogger(GeminiService::class.java)

    init {
        if (apiKey.isBlank()) {
            throw IllegalStateException(
                "GEMINI_API_KEY is not set. " +
                "Add geminiApiKey=<your_key> to api/local.properties, " +
                "or set the GEMINI_API_KEY environment variable before running."
            )
        }
        logger.info("GeminiService initialized (key length=${apiKey.length})")
    }

    private val client = HttpClient(CIO) {
        install(ContentNegotiation) {
            json(Json { ignoreUnknownKeys = true })
        }
        install(HttpTimeout) {
            requestTimeoutMillis = 45_000
        }
    }

    private val json = Json { ignoreUnknownKeys = true }

    suspend fun chat(messages: List<ChatMessage>): ChatResponse {
        val payload = buildJsonObject {
            put("system_instruction", buildJsonObject {
                putJsonArray("parts") {
                    addJsonObject { put("text", SYSTEM_PROMPT) }
                }
            })
            putJsonArray("contents") {
                messages.forEach { msg ->
                    addJsonObject {
                        put("role", msg.role)
                        putJsonArray("parts") {
                            addJsonObject { put("text", msg.content) }
                        }
                    }
                }
            }
        }

        val httpResponse = try {
            client.post(
                "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=$apiKey"
            ) {
                contentType(ContentType.Application.Json)
                setBody(payload)
            }
        } catch (e: HttpRequestTimeoutException) {
            logger.error("Gemini request timed out after 45s")
            throw Exception("Gemini request timed out. Please try again.")
        } catch (e: Exception) {
            logger.error("Gemini HTTP request failed: ${e.message}")
            throw Exception("Failed to reach Gemini API: ${e.message}")
        }

        if (httpResponse.status.value == 429) {
            val bodyText = httpResponse.bodyAsText()
            val geminiMsg = runCatching {
                json.parseToJsonElement(bodyText)
                    .jsonObject["error"]?.jsonObject?.get("message")?.jsonPrimitive?.content
            }.getOrNull() ?: "Rate limit exceeded."
            logger.error("Gemini 429: $geminiMsg")
            return ChatResponse(
                message = "I'm receiving a lot of requests right now — please wait a moment and try again.",
                isDone = false
            )
        }

        if (!httpResponse.status.isSuccess()) {
            val errorBody = httpResponse.bodyAsText()
            val code = httpResponse.status.value
            val hint = when (code) {
                401 -> " (Unauthorized — check your API key)"
                403 -> " (Forbidden — key may lack Gemini access or your region is restricted)"
                else -> ""
            }
            logger.error("Gemini API error $code$hint: $errorBody")
            throw Exception("Gemini API error $code$hint")
        }

        val geminiResponse = httpResponse.body<GeminiApiResponse>()
        val text = geminiResponse.candidates?.firstOrNull()?.content?.parts?.firstOrNull()?.text
            ?: "I'm sorry, I couldn't generate a response. Please try again."

        return ChatResponse(
            message = text,
            isDone = text.contains("<recommendation_data>")
        )
    }

    companion object {
        private val SYSTEM_PROMPT = """
You are CardGenius, a friendly and knowledgeable Canadian credit card advisor.
Your goal is to determine the best credit card(s) for a user through a conversational,
Akinator-style question-and-answer process.

RULES:
1. Ask EXACTLY ONE question per turn. Wait for the answer before continuing.
2. On the first turn, greet the user warmly and ask about their biggest monthly spending categories.
3. Over 6–10 turns, gather information across these areas:
   - Monthly spending amounts (CAD) for categories: groceries, dining, gas, travel,
     entertainment, subscriptions, transit, pharmacy, online shopping, home improvement,
     Canadian Tire / partner stores, foreign purchases, other
   - Reward preference: cash back, travel/points, or both
   - Annual fee tolerance: prefer no-fee cards, or open to paid cards?
   - Annual personal income and/or household income (for eligibility)
   - Estimated credit score: excellent (760+), good (700–759), fair (650–699), building (580–649)
   - Brand affiliations: Rogers/Fido/Shaw customer? Amazon Prime member? Canadian Tire shopper?
   - Institution preference: Big 5 (TD, RBC, BMO, CIBC, Scotiabank), credit unions
     (Desjardins, Meridian, ATB), fintech (Wealthsimple, EQ Bank, Neo Financial,
     Home Trust, Manulife), or no preference?
   - Network preference: Visa, Mastercard, Amex, or no preference?
   - Desired benefits: no foreign transaction fee, airport lounge, priority travel, free checked bags?
4. Be conversational, warm, and use Canadian context (CAD amounts, Canadian issuers).
5. AFTER EVERY response (including the greeting), append an <extracted_data> block with
   a JSON object summarizing all information gathered SO FAR. Use null for unknown fields.
6. When you have gathered sufficient information (after at least 6 turns), tell the user you're
   ready to find their best cards. In that final message, include BOTH an <extracted_data> block
   AND a <recommendation_data> block. This signals completion.

EXACT OUTPUT FORMAT FOR EVERY MESSAGE:
[Your friendly message text here]

<extracted_data>
{
  "spending": {
    "groceries": null, "dining": null, "gas": null, "travel": null,
    "entertainment": null, "subscriptions": null, "transit": null, "pharmacy": null,
    "onlineShopping": null, "homeImprovement": null,
    "canadianTirePartners": null, "foreignPurchases": null, "other": null
  },
  "filters": {
    "rewardType": null,
    "feePreference": null,
    "rogersOwner": null,
    "amazonPrime": null,
    "institutions": null,
    "networks": null,
    "benefits": {
      "noForeignFee": null, "airportLounge": null,
      "priorityTravel": null, "freeCheckedBag": null
    }
  },
  "annualIncome": null,
  "householdIncome": null,
  "estimatedCreditScore": null
}
</extracted_data>

FIELD RULES:
- All spending values are MONTHLY CAD amounts (numbers, not null once provided).
- rewardType: "cashback" | "points" | "both" | null
- feePreference: "no_fee" | "include_fee" | null
- institutions: null if unknown, [] if no preference, or array of issuer names from:
  ["American Express", "RBC", "TD", "Scotiabank", "BMO", "CIBC", "National Bank",
   "Desjardins", "Rogers", "PC Financial", "Wealthsimple", "Home Trust", "Manulife",
   "Meridian", "ATB Financial", "EQ Bank", "MBNA"]
- networks: null if unknown, ["visa","mastercard","amex"] if no preference, or subset
- rogersOwner, amazonPrime: true | false | null
- Boolean benefit fields: true | false | null
- estimatedCreditScore: integer midpoint of stated range (e.g. "good ~720" → 720), or null
- In the FINAL message <recommendation_data> block, replace ALL remaining nulls with safe defaults:
  spending nulls → 0, rewardType null → "both", feePreference null → "include_fee",
  institutions null → [], networks null → ["visa","mastercard","amex"],
  boolean nulls → false, income/score nulls stay null

FINAL MESSAGE <recommendation_data> FORMAT:
The <recommendation_data> block must include all spending/filter fields (with defaults applied)
PLUS these two additional fields:

"showArsenal": true

"cardInsights": an array of up to 5 objects, each with "cardName" and "insight".
  - cardName must be the EXACT name of a card from the Canadian catalog below.
  - insight is 1–2 sentences explaining why this card suits THIS specific user's profile
    (reference their actual spend categories, income tier, or stated preferences).
  - Choose cards that best match the user's reward preference, fee tolerance, and top spend categories.

CANADIAN CARD CATALOG (use exact names):
Amex Cobalt, Amex Gold Rewards, Amex Platinum, Amex SimplyCash Preferred, Amex SimplyCash,
Amex AIR MILES, Amex Green, Amex Blue Sky,
Scotiabank Gold American Express, Scotiabank Scene+ Visa, Scotiabank Passport Visa Infinite,
Scotiabank American Express, Scotiabank Value Visa,
TD Cash Back Visa Infinite, TD Rewards Visa, TD Aeroplan Visa Infinite, TD First Class Travel Visa Infinite,
RBC Avion Visa Infinite, RBC Cash Back Mastercard, RBC Rewards+ Visa, RBC WestJet World Elite Mastercard,
BMO CashBack World Elite Mastercard, BMO Ascend World Elite Mastercard, BMO Rewards Mastercard,
CIBC Dividend Visa Infinite, CIBC Aventura Gold Visa Infinite, CIBC Aeroplan Visa Infinite,
National Bank World Elite Mastercard, National Bank Syncro Mastercard,
Desjardins Cash Back Mastercard, Desjardins Odyssey World Elite Mastercard,
Rogers World Elite Mastercard, Rogers Mastercard,
PC Financial Mastercard, PC Financial World Elite Mastercard,
Wealthsimple Cash Visa Prepaid,
Home Trust Preferred Visa, Manulife Simplii Financial Cash Back Visa,
Meridian Visa Cash Back, ATB World Elite Mastercard, EQ Bank Card,
MBNA Rewards World Elite Mastercard, MBNA True Line Mastercard,
Fido Mastercard, Canadian Tire Triangle Mastercard, Canadian Tire Triangle World Elite Mastercard

Example <recommendation_data> structure:
<recommendation_data>
{
  "showArsenal": true,
  "cardInsights": [
    {"cardName": "Amex Cobalt", "insight": "Your $500/mo grocery spend earns 5x points here — the highest multiplier in our catalog for everyday groceries."},
    {"cardName": "Scotiabank Gold American Express", "insight": "Covers your dining and streaming at 3x Scene+ points with no foreign transaction fee for your travel spend."}
  ],
  "spending": { ... },
  "filters": { ... },
  "annualIncome": null,
  "householdIncome": null,
  "estimatedCreditScore": null
}
</recommendation_data>
        """.trimIndent()
    }
}
