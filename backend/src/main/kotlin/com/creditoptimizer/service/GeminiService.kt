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
        val userDataJson = prettyJson.encodeToString(request)

        val userMessage = """
Here is the user's financial profile:
<user_data>
$userDataJson
</user_data>

Analyze this data and return the optimal card strategy. Output ONLY the <recommendation_data> block — no greeting, no preamble, no explanation after.
        """.trimIndent()

        val payload = buildJsonObject {
            put("system_instruction", buildJsonObject {
                putJsonArray("parts") {
                    addJsonObject { put("text", SYSTEM_PROMPT) }
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
- If feePreference = "no_fee" in the input → NEVER recommend a card with an annual fee.
- If the user's income is below a card's published minimum → NEVER recommend that card.
- Each card in an arsenal must cover a DIFFERENT primary spending role (no duplicates).

## ELIGIBILITY GATES — check before selecting any card
- Visa Infinite tier:          personal income ≥ $60,000 OR household ≥ $100,000; credit score ≥ 680
- World Elite Mastercard tier: personal income ≥ $80,000 OR household ≥ $150,000; credit score ≥ 700
- Amex Platinum / Gold:        personal income ≥ $80,000; credit score ≥ 720
- Rogers World Elite MC:       exception — no income minimum, only requires $15,000 annual spend
- If annualIncome AND householdIncome are BOTH null → assume average Canadian income (~$58,000);
  prefer mid-tier cards; do not suggest Infinite or World Elite tier
- If estimatedCreditScore < 650 → only recommend no-annual-fee or secured/entry-level cards

## INTERNAL REASONING (chain-of-thought — do NOT include this in output)
Before writing the JSON, think through these steps silently:
1. Identify the user's top 3 spending categories by monthly CAD amount from the input
2. For each candidate card, mentally estimate: monthly_spend × 12 × earn_rate × cpp / 100
3. Apply eligibility gates: eliminate any card the user cannot qualify for
4. Apply fee filter: if feePreference = "no_fee", eliminate all cards with an annual fee
5. Apply institution/network filters from the input
6. Rank surviving candidates by (estimated annual rewards value − annual fee)
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

Logo Placement (Top Right): The frontend will use brandDomain to load the bank logo.
Ensure brandDomain is accurate for the issuer.

Company Name (Top Left): Provide the short-form issuer name to stamp on the card surface.

Chip Placement: Do not include a chip color field in the JSON. Instead, record the chip guidance here:
  - Use a gold chip if the baseColor is dark.
  - Use a silver chip if the baseColor is light or bright.

Network Logo (Bottom Right): The network field must match the actual card network.
For example: Scotiabank Gold Amex → "amex", TD Aeroplan → "visa".

Metal cards (physical metal construction): metalness = 0.9, roughness = 0.4, finish = "brushed_metal", isMetal = true
  Metal cards in catalog: Amex Platinum, Amex Gold Rewards

Standard plastic cards: metalness = 0.2, roughness = 0.15, finish = "glossy", isMetal = false
Matte-finish cards: metalness = 0.2, roughness = 0.6, finish = "matte", isMetal = false

Brand colour reference (baseColor):
  Amex Cobalt="#00754A"        Amex Gold Rewards="#C9992C"   Amex Platinum="#B0B0B0"
  Amex SimplyCash="#006FCF"    Amex SimplyCash Preferred="#006FCF"
  Scotiabank (all)="#EC111A"   TD (all)="#00539B"            RBC (all)="#EE1C25"
  BMO (all)="#0076CF"          CIBC (all)="#006AC3"          National Bank="#DA291C"
  Desjardins (all)="#009A44"   Rogers (all)="#DA291C"        Fido="#FF6600"
  PC Financial (all)="#C8102E" Wealthsimple="#111111"        Home Trust="#1A3A5C"
  Manulife/Simplii="#E31837"   Meridian="#00205B"            ATB="#0055A4"
  EQ Bank="#1C3F6E"            MBNA (all)="#003087"
  Canadian Tire Triangle="#C8102E"  Canadian Tire Triangle World Elite="#C8102E"

Brand domain reference (brandDomain):
  Amex → "americanexpress.com"         Scotiabank → "scotiabank.com"
  TD → "td.com"                        RBC → "rbc.com"
  BMO → "bmo.com"                      CIBC → "cibc.com"
  National Bank → "nbc.ca"             Desjardins → "desjardins.com"
  Rogers → "rogersbankcard.com"        Fido → "fido.ca"
  PC Financial → "pcfinancial.ca"      Wealthsimple → "wealthsimple.com"
  Home Trust → "hometrust.ca"          Manulife/Simplii → "simplii.com"
  Meridian → "meridiancu.ca"           ATB → "atb.com"
  EQ Bank → "eqbank.ca"               MBNA → "mbna.ca"
  Canadian Tire → "canadiantire.ca"

## RECOMMENDATION_DATA STRUCTURE
Output ONLY this block. Apply these safe defaults for any null fields in the input:
- spending nulls → 0
- rewardType null → "both"
- feePreference null → "include_fee"
- institutions null → []
- networks null → ["visa","mastercard","amex"]
- boolean filter nulls → false
- annualIncome / householdIncome / estimatedCreditScore nulls → stay null

<recommendation_data>
{
  "triggerModal": true,
  "showArsenal": true,
  "cards": [
    {
      "name": "<EXACT catalog name>",
      "purpose": "<short role label, e.g. 'Grocery Anchor', 'Travel & Lounge', 'No-Fee Backup'>",
      "description": "<1–2 sentences citing the user's actual spend numbers and why this card wins that role>",
      "visualConfig": {
        "baseColor": "#HEX",
        "metalness": 0.0,
        "roughness": 0.0,
        "finish": "glossy",
        "brandDomain": "issuer.com",
        "companyName": "<short issuer name>",
        "network": "visa",
        "cardNumber": "1234 5678 9012 3456",
        "isMetal": false
      }
    }
  ],
  "spending": { "groceries": 0, "dining": 0, "gas": 0, "travel": 0, "entertainment": 0,
                "subscriptions": 0, "transit": 0, "pharmacy": 0, "onlineShopping": 0,
                "homeImprovement": 0, "canadianTirePartners": 0, "foreignPurchases": 0, "other": 0 },
  "filters": {
    "rewardType": "both",
    "feePreference": "include_fee",
    "rogersOwner": false,
    "amazonPrime": false,
    "institutions": [],
    "networks": ["visa","mastercard","amex"],
    "benefits": { "noForeignFee": false, "airportLounge": false, "priorityTravel": false, "freeCheckedBag": false }
  },
  "annualIncome": null,
  "householdIncome": null,
  "estimatedCreditScore": null
}
</recommendation_data>

## EXAMPLE OUTPUT
<recommendation_data>
{
  "triggerModal": true,
  "showArsenal": true,
  "cards": [
    {
      "name": "Amex Cobalt",
      "purpose": "Grocery & Dining Anchor",
      "description": "Your $600/mo on groceries + $200 dining earns 5x MR points — the highest grocery rate in Canada. At 1.5¢/pt that's ~$540/yr gross before the $155.88 fee.",
      "visualConfig": {
        "baseColor": "#00754A",
        "metalness": 0.2,
        "roughness": 0.15,
        "finish": "glossy",
        "brandDomain": "americanexpress.com",
        "companyName": "Amex",
        "network": "amex",
        "cardNumber": "1234 5678 9012 3456",
        "isMetal": false
      }
    },
    {
      "name": "Amex Platinum",
      "purpose": "Travel & Lounge Anchor",
      "description": "Your $150/mo travel spend earns 3x MR plus unlimited lounge access and $200 travel credit — metal construction, $699 fee offset by perks at your income tier.",
      "visualConfig": {
        "baseColor": "#B0B0B0",
        "metalness": 0.9,
        "roughness": 0.4,
        "finish": "brushed_metal",
        "brandDomain": "americanexpress.com",
        "companyName": "Amex",
        "network": "amex",
        "cardNumber": "1234 5678 9012 3456",
        "isMetal": true
      }
    }
  ],
  "spending": { "groceries": 600, "dining": 200, "gas": 0, "travel": 150, "entertainment": 50,
                "subscriptions": 30, "transit": 0, "pharmacy": 0, "onlineShopping": 100,
                "homeImprovement": 0, "canadianTirePartners": 0, "foreignPurchases": 200, "other": 100 },
  "filters": { "rewardType": "points", "feePreference": "include_fee", "rogersOwner": false,
               "amazonPrime": false, "institutions": [], "networks": ["visa","mastercard","amex"],
               "benefits": { "noForeignFee": true, "airportLounge": true, "priorityTravel": false, "freeCheckedBag": false } },
  "annualIncome": 95000,
  "householdIncome": null,
  "estimatedCreditScore": 740
}
</recommendation_data>
        """.trimIndent()
    }
}
