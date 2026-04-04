package com.creditoptimizer.service

import com.creditoptimizer.dto.ChatResponse
import com.creditoptimizer.dto.OptimizeRequest
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
import kotlinx.serialization.encodeToString
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
            requestTimeoutMillis = 90_000
        }
    }

    // Pretty-printer for injecting the request data into the prompt.
    private val prettyJson = Json { prettyPrint = true; encodeDefaults = true }

    private val httpJson = Json { ignoreUnknownKeys = true }

    suspend fun optimize(request: OptimizeRequest): ChatResponse {
        val isExtract = request.strategy == "extract"
        val systemPrompt = if (isExtract) EXTRACT_SYSTEM_PROMPT else SYSTEM_PROMPT

        val userMessage = if (isExtract) {
            // For extraction, just pass the raw conversation text
            request.userText ?: "No messages yet."
        } else {
            val userDataJson = prettyJson.encodeToString(request)
            buildString {
                if (!request.userText.isNullOrBlank()) {
                    appendLine("The user said:")
                    appendLine("<user_message>")
                    appendLine(request.userText)
                    appendLine("</user_message>")
                    appendLine()
                    appendLine("Extract all spending amounts, income, credit score, reward type preference, fee preference, and network preferences from this message. Values stated in the message override the structured profile below.")
                    appendLine()
                }
                appendLine("Structured profile (use as fallback if the message above is missing data):")
                appendLine("<user_data>")
                appendLine(userDataJson)
                appendLine("</user_data>")
                appendLine()
                append("Analyze this data and return the optimal card strategy. Output ONLY the <recommendation_data> block — no greeting, no preamble, no explanation after.")
            }
        }

        val payload = buildJsonObject {
            put("system_instruction", buildJsonObject {
                putJsonArray("parts") {
                    addJsonObject { put("text", systemPrompt) }
                }
            })
            putJsonArray("contents") {
                addJsonObject {
                    put("role", "user")
                    putJsonArray("parts") {
                        addJsonObject { put("text", userMessage) }
                    }
                }
            }
            put("generationConfig", buildJsonObject {
                put("thinkingConfig", buildJsonObject {
                    put("thinkingBudget", 0)
                })
            })
        }

        val httpResponse = try {
            client.post(
                "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=$apiKey"
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
                httpJson.parseToJsonElement(bodyText)
                    .jsonObject["error"]?.jsonObject?.get("message")?.jsonPrimitive?.content
            }.getOrNull() ?: "Rate limit exceeded."
            logger.error("Gemini 429: $geminiMsg")
            return ChatResponse(
                message = "I'm receiving a lot of requests right now — please wait a moment and try again.",
                isDone = false
            )
        }

        if (httpResponse.status.value == 503 || httpResponse.status.value == 502) {
            val bodyText = httpResponse.bodyAsText()
            logger.error("Gemini API error ${httpResponse.status.value}: $bodyText")
            return ChatResponse(
                message = "The AI service is temporarily unavailable due to high demand — please wait a moment and try again.",
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

        // Single-shot: every response is final.
        return ChatResponse(message = text, isDone = true)
    }

    companion object {
        private val SYSTEM_PROMPT = """
You are the Arsenal Optimizer Engine — a precision tool for Canadian credit card strategy.
Use your live knowledge of the Canadian card market (Big 5 banks, fintechs, telecoms, credit unions).
Output ONLY a single <recommendation_data> block of valid JSON. No text before or after.

## HARD LIMITS
- strategy="simple"  → EXACTLY 1 card.
- strategy="arsenal" → EXACTLY 2 or 3 cards.
- No annual fee requested → NEVER include annualFee > 0.
- Income below card minimum → NEVER recommend that card.
- Arsenal: each card must cover a DIFFERENT primary spending role.

## ELIGIBILITY
- Visa Infinite: income ≥ ${'$'}60k personal OR ${'$'}100k household; score ≥ 680
- World Elite MC: income ≥ ${'$'}80k personal OR ${'$'}150k household; score ≥ 700
- Amex Platinum/Gold: income ≥ ${'$'}80k; score ≥ 720
- Rogers World Elite: no income minimum, requires ${'$'}15k annual spend
- Both incomes null → assume ~${'$'}58k; prefer mid-tier; no Infinite/World Elite
- Score < 650 → no-annual-fee or secured cards only

## CALCULATIONS (all values ANNUAL = monthly × 12)
- Cash-back (isPointsBased=false): pointsEarned=0; valueCAD = annual_spend × rate / 100
- Points (isPointsBased=true): pointsEarned = annual_spend × earn_rate; valueCAD = pointsEarned × cpp / 100
- totalValueCAD = sum of all category valueCAD; netAnnualValue = totalValueCAD − annualFee
- Omit breakdown rows where monthly spend = 0 or card has no earn rate for that category.

## REASONING (silent — do NOT output)
1. Extract spending, income, score, preferences from user message
2. For each candidate, calculate netAnnualValue across all categories
3. Apply eligibility gates and fee/reward filters
4. simple: #1 card; arsenal: 2–3 top-ranked cards with distinct spending roles

## VISUAL CONFIG (required on every card)
Fields: baseColor, metalness, roughness, finish ("glossy"|"matte"|"brushed_metal"), brandDomain, companyName, network ("visa"|"mastercard"|"amex"), cardNumber ("XXXX XXXX XXXX XXXX"), isMetal
- Metal card: metalness=0.9, roughness=0.4, finish="brushed_metal", isMetal=true
- Plastic:    metalness=0.2, roughness=0.15, finish="glossy",        isMetal=false
- Matte:      metalness=0.2, roughness=0.6,  finish="matte",         isMetal=false
baseColor: Amex Cobalt=#00754A Gold=#C9992C Plat=#B0B0B0 SimplyCash=#006FCF | Scotia=#EC111A TD=#00539B RBC=#EE1C25 BMO=#0076CF CIBC=#006AC3 NBC=#DA291C Desj=#009A44 | Rogers=#DA291C Fido=#FF6600 PC=#C8102E WS=#111111 HomeTrust=#1A3A5C EQ=#1C3F6E MBNA=#003087 CdnTire=#C8102E Tangerine=#FF6B00 Neo=#000000 ATB=#0055A4 Meridian=#00205B Simplii=#E31837
brandDomain: Amex=americanexpress.com Scotia=scotiabank.com TD=td.com RBC=rbc.com BMO=bmo.com CIBC=cibc.com NBC=nbc.ca Desj=desjardins.com Rogers=rogersbankcard.com Fido=fido.ca PC=pcfinancial.ca WS=wealthsimple.com HomeTrust=hometrust.ca Simplii=simplii.com Meridian=meridiancu.ca ATB=atb.com EQ=eqbank.ca MBNA=mbna.ca CdnTire=canadiantire.ca Tangerine=tangerine.ca Neo=neofinancial.com

## OUTPUT SCHEMA
Valid categories: groceries, dining, gas, travel, entertainment, subscriptions, transit, other, pharmacy, online_shopping, home_improvement, canadian_tire_partners, foreign_purchases
Descriptions must cite the user's actual dollar amounts and explain why this card wins its role.
annualIncome / householdIncome / estimatedCreditScore: echo from user input, null if not provided.

<recommendation_data>
{
  "cards": [{
    "name": "", "issuer": "", "annualFee": 0.0, "pointsCurrency": "", "cardType": "visa|mastercard|amex",
    "isPointsBased": false,
    "breakdown": [{ "category": "", "spent": 0.0, "pointsEarned": 0.0, "valueCAD": 0.0 }],
    "totalPointsEarned": 0.0, "totalValueCAD": 0.0, "netAnnualValue": 0.0,
    "eligibilityWarning": null, "purpose": "", "description": "",
    "visualConfig": { "baseColor": "#HEX", "metalness": 0.2, "roughness": 0.15, "finish": "glossy",
      "brandDomain": "", "companyName": "", "network": "visa", "cardNumber": "1234 5678 9012 3456", "isMetal": false }
  }],
  "annualIncome": null, "householdIncome": null, "estimatedCreditScore": null
}
</recommendation_data>
        """.trimIndent()

        val EXTRACT_SYSTEM_PROMPT = """
You are a financial data extractor for a Canadian credit card optimizer.
Given one or more user messages, extract spending and financial profile information.

Rules:
- Extract MONTHLY spending amounts in CAD for each category the user mentioned; use null for categories not mentioned
- Extract annualIncome if the user mentions salary, income, or yearly earnings (convert to annual if needed)
- Extract estimatedCreditScore if mentioned
- Infer rewardType: "cashback" if user prefers cash back, "points" if travel/points preferred, "both" if no preference stated or both mentioned — null if completely unclear
- Infer feePreference: "no_fee" if user explicitly wants no annual fee, "include_fee" if they are open to fees — null if not mentioned
- rogersOwner: true only if user mentions Rogers, Fido, or Shaw; false otherwise
- amazonPrime: true only if user mentions Amazon Prime; false otherwise
- institutions and networks: use empty array and ["visa","mastercard","amex"] as defaults unless user specifies

Return ONLY the block below, then on the next line write a brief conversational reply (1–2 sentences) acknowledging what you learned and asking for the single most important missing piece (income if unknown, or reward preference if unknown):

<extracted_data>
{
  "spending": {
    "groceries": <number|null>, "dining": <number|null>, "gas": <number|null>,
    "travel": <number|null>, "entertainment": <number|null>, "subscriptions": <number|null>,
    "transit": <number|null>, "pharmacy": <number|null>, "onlineShopping": <number|null>,
    "homeImprovement": <number|null>, "canadianTirePartners": <number|null>,
    "foreignPurchases": <number|null>, "other": <number|null>
  },
  "filters": {
    "rewardType": <"cashback"|"points"|"both"|null>,
    "feePreference": <"no_fee"|"include_fee"|null>,
    "rogersOwner": <boolean>, "amazonPrime": <boolean>,
    "institutions": [], "networks": ["visa","mastercard","amex"],
    "benefits": { "noForeignFee": false, "airportLounge": false, "priorityTravel": false, "freeCheckedBag": false }
  },
  "annualIncome": <number|null>,
  "householdIncome": <number|null>,
  "estimatedCreditScore": <number|null>
}
</extracted_data>
        """.trimIndent()
    }
}
