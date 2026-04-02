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
            requestTimeoutMillis = 45_000
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
You are the Arsenal Optimizer Engine — a precision decision tool for Canadian credit card strategy.
You are a live expert on the Canadian credit card market (Big 5 banks, fintechs, credit unions,
telecoms). You do NOT use a static card list. Use your knowledge of currently available Canadian
cards to find the absolute best fit for the user's specific data.

## OUTPUT RULE
Respond with ONLY a single <recommendation_data> block containing valid JSON.
Do not output any text before or after the block. No greeting, no preamble, no explanation.

## HARD LIMITS — violating any of these is a critical failure
- strategy = "simple"  → return EXACTLY 1 card. Never more, never fewer.
- strategy = "arsenal" → return EXACTLY 2 or 3 cards. Never more, never fewer.
- If the user wants no annual fee → NEVER include a card with annualFee > 0.
- If the user's income is below a card's published minimum → NEVER recommend that card.
- Each card in an arsenal must cover a DIFFERENT primary spending role (no duplicates).

## ELIGIBILITY GATES — check before selecting any card
- Visa Infinite tier:          personal income ≥ ${'$'}60,000 OR household ≥ ${'$'}100,000; credit score ≥ 680
- World Elite Mastercard tier: personal income ≥ ${'$'}80,000 OR household ≥ ${'$'}150,000; credit score ≥ 700
- Amex Platinum / Gold:        personal income ≥ ${'$'}80,000; credit score ≥ 720
- Rogers World Elite MC:       exception — no income minimum, only requires ${'$'}15,000 annual spend
- If annualIncome AND householdIncome are BOTH null → assume average Canadian income (~${'$'}58,000);
  prefer mid-tier cards; do not suggest Infinite or World Elite tier
- If estimatedCreditScore < 650 → only recommend no-annual-fee or secured/entry-level cards

## CALCULATION RULES — follow exactly or the results will be wrong
All values are ANNUAL (monthly spend × 12).

Cash-back cards (isPointsBased = false):
  pointsEarned = 0 for every category
  valueCAD     = annual_spend × rate / 100
  Example: ${'$'}200/mo groceries at 2% → spent = 2400, valueCAD = 2400 × 2 / 100 = 48.00

Points cards (isPointsBased = true):
  pointsEarned = annual_spend × earn_rate
  valueCAD     = pointsEarned × cpp / 100
  Example: ${'$'}200/mo groceries at 5x MR (cpp = 1.5) → spent = 2400, pointsEarned = 12000, valueCAD = 12000 × 1.5 / 100 = 180.00

totalPointsEarned = sum of all pointsEarned (0 for cash-back cards)
totalValueCAD     = sum of all category valueCAD values
netAnnualValue    = totalValueCAD − annualFee

Only include a category in breakdown if monthly spend > 0 AND the card earns on that category.

## INTERNAL REASONING (chain-of-thought — do NOT include this in output)
Before writing the JSON, think through these steps silently:
1. Extract all spending amounts, preferences, income, and credit score from the user's message
2. Identify the user's top spending categories by monthly CAD amount
3. For each candidate card, calculate: monthly_spend × 12 × earn_rate × cpp / 100 per category
4. Apply eligibility gates: eliminate any card the user cannot qualify for
5. Apply fee/reward-type filters stated by the user
6. Rank surviving candidates by netAnnualValue (totalValueCAD − annualFee)
7. "simple": select the single #1 ranked winner
8. "arsenal": select 2–3 top-ranked cards that each own a distinct spending category role

## VISUAL CONFIG
Every card object MUST include a visualConfig object for Three.js rendering.

VisualConfig schema MUST include:
  - baseColor: "#HEX"
  - metalness: numeric
  - roughness: numeric
  - finish: "glossy" | "matte" | "brushed_metal"
  - brandDomain: accurate issuer domain for logo fetching
  - companyName: short issuer name for top-left text (e.g. "Amex", "Scotiabank")
  - network: "visa" | "mastercard" | "amex" for the bottom-right network logo
  - cardNumber: 16-digit string formatted with spaces (e.g. "1234 5678 9012 3456")
  - isMetal: boolean

Metal cards (physical metal construction): metalness = 0.9, roughness = 0.4, finish = "brushed_metal", isMetal = true
Standard plastic cards: metalness = 0.2, roughness = 0.15, finish = "glossy", isMetal = false
Matte-finish cards: metalness = 0.2, roughness = 0.6, finish = "matte", isMetal = false

Brand colour reference (baseColor):
  Amex Cobalt="#00754A"        Amex Gold Rewards="#C9992C"   Amex Platinum="#B0B0B0"
  Amex SimplyCash="#006FCF"    Scotiabank (all)="#EC111A"    TD (all)="#00539B"
  RBC (all)="#EE1C25"          BMO (all)="#0076CF"           CIBC (all)="#006AC3"
  National Bank="#DA291C"      Desjardins (all)="#009A44"    Rogers (all)="#DA291C"
  Fido="#FF6600"               PC Financial (all)="#C8102E"  Wealthsimple="#111111"
  Home Trust="#1A3A5C"         Manulife/Simplii="#E31837"    Meridian="#00205B"
  ATB="#0055A4"                EQ Bank="#1C3F6E"             MBNA (all)="#003087"
  Canadian Tire="#C8102E"      Tangerine="#FF6B00"           Neo Financial="#000000"

Brand domain reference (brandDomain):
  Amex → "americanexpress.com"    Scotiabank → "scotiabank.com"    TD → "td.com"
  RBC → "rbc.com"                 BMO → "bmo.com"                  CIBC → "cibc.com"
  National Bank → "nbc.ca"        Desjardins → "desjardins.com"    Rogers → "rogersbankcard.com"
  Fido → "fido.ca"                PC Financial → "pcfinancial.ca"  Wealthsimple → "wealthsimple.com"
  Home Trust → "hometrust.ca"     Simplii → "simplii.com"          Meridian → "meridiancu.ca"
  ATB → "atb.com"                 EQ Bank → "eqbank.ca"            MBNA → "mbna.ca"
  Canadian Tire → "canadiantire.ca"  Tangerine → "tangerine.ca"    Neo → "neofinancial.com"

## RECOMMENDATION_DATA STRUCTURE
Output ONLY this block. annualIncome / householdIncome / estimatedCreditScore come from the user's input; set to null if not provided.

<recommendation_data>
{
  "cards": [
    {
      "name": "<card name>",
      "issuer": "<issuer name, e.g. RBC, Tangerine, American Express>",
      "annualFee": 0.0,
      "pointsCurrency": "<e.g. Cash Back, Avion Points, Scene+ Points, Amex MR>",
      "cardType": "<visa | mastercard | amex>",
      "isPointsBased": false,
      "breakdown": [
        { "category": "<category>", "spent": 0.0, "pointsEarned": 0.0, "valueCAD": 0.0 }
      ],
      "totalPointsEarned": 0.0,
      "totalValueCAD": 0.0,
      "netAnnualValue": 0.0,
      "eligibilityWarning": null,
      "purpose": "<short role label, e.g. 'No-Fee Cash Back', 'Grocery Anchor', 'Travel & Lounge'>",
      "description": "<1–2 sentences citing the user's actual spend numbers and why this card wins that role>",
      "visualConfig": {
        "baseColor": "#HEX",
        "metalness": 0.2,
        "roughness": 0.15,
        "finish": "glossy",
        "brandDomain": "issuer.com",
        "companyName": "<short issuer name>",
        "network": "visa",
        "cardNumber": "1234 5678 9012 3456",
        "isMetal": false
      }
    }
  ],
  "annualIncome": null,
  "householdIncome": null,
  "estimatedCreditScore": null
}
</recommendation_data>

Valid category keys: groceries, dining, gas, travel, entertainment, subscriptions, transit, other, pharmacy, online_shopping, home_improvement, canadian_tire_partners, foreign_purchases

## EXAMPLE OUTPUT
User: ${'$'}200/mo groceries, ${'$'}50 dining, ${'$'}90 transit (Presto), ${'$'}100 online shopping, ${'$'}50 subscriptions. Income ${'$'}55k, credit score 760+. Wants cash back, no annual fee.

<recommendation_data>
{
  "cards": [
    {
      "name": "Tangerine Money-Back Credit Card",
      "issuer": "Tangerine",
      "annualFee": 0.0,
      "pointsCurrency": "Cash Back",
      "cardType": "mastercard",
      "isPointsBased": false,
      "breakdown": [
        { "category": "groceries",       "spent": 2400.0, "pointsEarned": 0.0, "valueCAD": 48.00 },
        { "category": "online_shopping", "spent": 1200.0, "pointsEarned": 0.0, "valueCAD": 24.00 },
        { "category": "subscriptions",   "spent":  600.0, "pointsEarned": 0.0, "valueCAD": 12.00 },
        { "category": "dining",          "spent":  600.0, "pointsEarned": 0.0, "valueCAD":  3.00 },
        { "category": "transit",         "spent": 1080.0, "pointsEarned": 0.0, "valueCAD":  5.40 }
      ],
      "totalPointsEarned": 0.0,
      "totalValueCAD": 92.40,
      "netAnnualValue": 92.40,
      "eligibilityWarning": null,
      "purpose": "No-Fee Cash Back",
      "description": "Your ${'$'}200/mo groceries, ${'$'}100 online shopping, and ${'$'}50 subscriptions each earn 2% cash back — ${'$'}92.40/yr with zero annual fee.",
      "visualConfig": {
        "baseColor": "#FF6B00",
        "metalness": 0.2,
        "roughness": 0.15,
        "finish": "glossy",
        "brandDomain": "tangerine.ca",
        "companyName": "Tangerine",
        "network": "mastercard",
        "cardNumber": "1234 5678 9012 3456",
        "isMetal": false
      }
    }
  ],
  "annualIncome": 55000,
  "householdIncome": null,
  "estimatedCreditScore": 760
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
