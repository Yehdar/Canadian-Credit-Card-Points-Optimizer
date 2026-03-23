# Project: Canadian Credit Card Points Optimizer

## Project Overview
An AI-powered app to maximize credit card rewards for Canadians based on financial and lifestyle profiles.

## Tech Stack
- **Frontend:** Next.js 16 (App Router), TypeScript, Tailwind CSS v4, React 19
- **Backend:** Kotlin, Ktor 2.3.12, PostgreSQL 16
- **Database:** Exposed 0.52.0 (DSL), Flyway 10.15.0, HikariCP
- **Environment:** Node 20+, JDK 17+ (Java 21 on this machine)

## Build & Development Commands
- **Frontend Dev:** `cd web && npm run dev` (port 3000)
- **Backend Dev:** `cd api && ./gradlew run` (port 8080 — Flyway migrations run automatically on startup)
- **Testing:** `npm test` (Frontend), `./gradlew test` (Backend)
- **PostgreSQL:** Runs as native Windows service `postgresql-x64-16`. Start via `net start postgresql-x64-16` (admin terminal) or `services.msc`.

## Architecture & Rules
- **Schema First:** Always check `api/src/main/resources/db/migration` before modifying models.
- **Migrations:** Flyway validates checksums — never edit existing migration files. Add new `V{n}__Description.sql` files only.
- **Flyway 10** requires two artifacts: `flyway-core` + `flyway-database-postgresql`.
- **Naming Conventions:**
    - Frontend: PascalCase for Components, camelCase for hooks/utils.
    - Backend: camelCase for variables/functions, PascalCase for Classes.
- **Points Logic:** All calculation logic lives in `service/PointsService.kt`. Frontend only displays results.
- **API Style:** RESTful JSON. Use `kotlinx.serialization` for DTOs. `explicitNulls = false` in JSON config omits null fields.

## Data Model

### `credit_cards`
| Column | Type | Notes |
|--------|------|-------|
| id | SERIAL PK | |
| name | VARCHAR(100) | e.g. "Amex Cobalt" |
| issuer | VARCHAR(100) | e.g. "American Express" |
| annual_fee_cad | NUMERIC(8,2) | In CAD |
| points_currency | VARCHAR(50) | e.g. "Amex MR", "Scene+", "Cash Back" |
| cpp | NUMERIC(6,4) | Cents per point (e.g. 1.5 = 1.5¢/pt) |
| card_type | VARCHAR(20) | 'visa', 'mastercard', or 'amex' |
| is_points_based | BOOLEAN | TRUE = points currency; FALSE = cash-back |
| no_foreign_fee | BOOLEAN | V5 |
| airport_lounge | BOOLEAN | V5 |
| priority_travel | BOOLEAN | V5 |
| free_checked_bag | BOOLEAN | V5 |
| rogers_bonus_multiplier | NUMERIC(4,2) | V5 — applied when user owns Rogers products |
| amazon_prime_multiplier | NUMERIC(4,2) | V5 — applied when user has Amazon Prime |
| min_income_personal | INTEGER nullable | V7 — NULL = no minimum |
| min_income_household | INTEGER nullable | V7 |
| min_credit_score | INTEGER nullable | V7 |

### `card_earn_rates`
| Column | Type | Notes |
|--------|------|-------|
| id | SERIAL PK | |
| card_id | INTEGER FK | References credit_cards |
| category | VARCHAR(30) | See spend categories below |
| earn_rate | NUMERIC(6,2) | Points per CAD spent |

**Spend categories (13 total):** `groceries`, `dining`, `gas`, `travel`, `entertainment`, `subscriptions`, `transit`, `other`, `pharmacy`, `online_shopping`, `home_improvement`, `canadian_tire_partners`, `foreign_purchases`

### `spending_profiles`
| Column | Type | Notes |
|--------|------|-------|
| id | SERIAL PK (IntIdTable) | |
| name | VARCHAR(100) | |
| profile_type | VARCHAR(20) | 'personal', 'business', or 'partner' |
| groceries … foreign_purchases | NUMERIC(10,2) | 13 monthly spend columns |
| annual_income | INTEGER nullable | V7 |
| household_income | INTEGER nullable | V7 |
| estimated_credit_score | INTEGER nullable | V7 |
| created_at / updated_at | TIMESTAMP | |

### Reward Value Formula
`annual_value_CAD = monthly_spend × 12 × earn_rate × cpp / 100`

**"other" category fallback:** If a card has no explicit earn rate for a category, `PointsService` falls back to the card's `other` earn rate rather than skipping.

## Eligibility Filtering
Cards are hard-filtered when the user provides income/credit-score inputs:
- **Income:** User qualifies if personal income ≥ `min_income_personal` OR household income ≥ `min_income_household`.
- **Credit score:** Hard-excluded if score < `min_credit_score - 30`. Within the 30-point buffer, an `eligibilityWarning` string is returned instead.
- Visa Infinite tier: $60k personal / $100k household, 680–700 score
- World Elite Mastercard tier: $80k personal / $150k household, 700–760 score

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| GET | `/api/cards` | All cards (summary) |
| POST | `/api/recommendations` | Ranked cards for given spending + optional eligibility |
| GET | `/api/profiles` | List saved profiles |
| POST | `/api/profiles` | Create profile |
| GET | `/api/profiles/{id}` | Get profile |
| PUT | `/api/profiles/{id}` | Update profile |
| DELETE | `/api/profiles/{id}` | Delete profile |

### POST /api/recommendations
```json
{
  "spending": { "groceries": 500, "dining": 300, "gas": 100, "travel": 200,
                "entertainment": 100, "subscriptions": 50, "transit": 50, "other": 200,
                "pharmacy": 0, "onlineShopping": 0, "homeImprovement": 0,
                "canadianTirePartners": 0, "foreignPurchases": 0 },
  "filters": {
    "rewardType": "both",
    "feePreference": "include_fee",
    "rogersOwner": false,
    "amazonPrime": false,
    "institutions": [],
    "networks": ["visa", "mastercard", "amex"],
    "benefits": { "noForeignFee": false, "airportLounge": false, "priorityTravel": false, "freeCheckedBag": false }
  },
  "annualIncome": 75000,
  "householdIncome": null,
  "estimatedCreditScore": 724
}
```
Response (sorted best → worst by `netAnnualValue`):
```json
[{
  "card": { "id": 1, "name": "...", "issuer": "...", "annualFee": 155.88,
            "pointsCurrency": "Amex MR", "cardType": "amex", "isPointsBased": true },
  "breakdown": [{ "category": "groceries", "spent": 6000.0, "pointsEarned": 6000.0, "valueCAD": 90.0 }],
  "totalPointsEarned": 42000.0, "totalValueCAD": 420.0, "netAnnualValue": 264.12,
  "eligibilityWarning": null
}]
```

## Package Structure (Backend)
```
com.creditoptimizer
├── Application.kt
├── db/Tables.kt                  # Exposed DSL table objects (CreditCards, CardEarnRates, SpendingProfiles)
├── dto/
│   ├── Dtos.kt                   # RecommendationsRequest, SpendingBreakdown, FormFilters,
│   │                             # BenefitFilters, CardSummary, CategoryBreakdown, RecommendationResult
│   └── ProfileDtos.kt            # CreateProfileRequest, UpdateProfileRequest, ProfileResponse
├── service/
│   ├── PointsService.kt          # Recommendations, eligibility filtering, card filtering
│   ├── ProfileService.kt         # Profile CRUD
│   └── ProfileNotFoundException.kt
└── plugins/
    ├── Database.kt               # HikariCP + Flyway + Exposed setup
    ├── Routing.kt                # Route definitions + CORS
    └── Serialization.kt          # JSON config
```

## Frontend Component Structure
```
web/app/
├── page.tsx                      # Main split-pane layout
├── layout.tsx                    # Root layout with navbar
├── globals.css                   # Tailwind v4 + design tokens + scrollbar styles
└── components/
    ├── SpendingForm.tsx           # Form orchestrator — wires all 6 modules
    ├── SpendingModule.tsx         # 13 spend category inputs (monthly/yearly toggle)
    ├── PreferencesModule.tsx      # Reward type, fee preference, income, credit score
    ├── BonusesModule.tsx          # Rogers / Amazon Prime multiplier toggles
    ├── InstitutionsModule.tsx     # Issuer filter pills
    ├── NetworkModule.tsx          # Card network (Visa/MC/Amex) toggles
    ├── BenefitsModule.tsx         # Benefit perk filters with search
    ├── CardResults.tsx            # Ranked recommendation cards
    ├── NetworkMarks.tsx           # Shared VisaMark/MastercardMark/AmexMark SVGs
    ├── ProfileSwitcher.tsx        # Profile tabs + create
    ├── SaveProfilePrompt.tsx      # Inline save dialog for anonymous results
    └── ThemeToggle.tsx            # Light/dark toggle

web/
├── context/
│   ├── ProfileContext.tsx         # Profile CRUD state + active profile
│   └── ThemeContext.tsx           # Dark mode persistence
├── hooks/
│   └── useRecommendations.ts     # API call wrapper with filter-change caching
└── lib/
    └── api.ts                    # Type definitions + fetch wrappers
```

**Shared types exported from `api.ts`:** `RewardType`, `FeePreference`, `CardNetwork`, `FormFilters`, `SpendingBreakdown`, `SpendingFormSubmission`, `RecommendationResult`, `CardSummary`, `CategoryBreakdown`, `Profile`, `ProfileType`, `CreateProfilePayload`, `UpdateProfilePayload`

**Do not re-declare these types in individual components** — import from `@/lib/api`.

**Network mark SVGs** (`VisaMark`, `MastercardMark`, `AmexMark`) are shared via `NetworkMarks.tsx`. Accept a `className` prop for size overrides (defaults: `h-4`/`h-5`/`h-4`).

## DB Connection
- Host: localhost:5432
- DB: creditoptimizer
- User: postgres / Password: postgres

## Regional Constraints (Crucial)
- Focus ONLY on Canadian credit card issuers: Amex CA, RBC, TD, Scotiabank, BMO, CIBC, National Bank, Desjardins, plus telecom (Rogers, Fido), retailers (PC Financial, Canadian Tire, MBNA/Amazon), and alternative banks (Wealthsimple, EQ Bank, Neo Financial, Home Trust, Manulife, Meridian, ATB).
- Currency is always CAD.
- ~52 cards in the catalog (V1–V9 migrations).
