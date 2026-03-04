# Project: Canadian Credit Card Points Optimizer

## Project Overview
An AI-powered app to maximize credit card rewards for Canadians based on financial and lifestyle profiles.

## Tech Stack
- **Frontend:** Next.js (App Router), TypeScript, Tailwind CSS
- **Backend:** Kotlin, Ktor, PostgreSQL
- **Database:** Exposed (Kotlin ORM), Flyway (migrations)
- **Environment:** Node 20+, JDK 17+

## Build & Development Commands
- **Frontend Dev:** `cd web && npm run dev`
- **Backend Dev:** `cd api && ./gradlew run` *(Flyway migrations run automatically on startup)*
- **Testing:** `npm test` (Frontend), `./gradlew test` (Backend)

## Architecture & Rules
- **Schema First:** Always check `api/src/main/resources/db/migration` before modifying models.
- **Naming Conventions:**
    - Frontend: PascalCase for Components, camelCase for hooks/utils.
    - Backend: camelCase for variables/functions, PascalCase for Classes.
- **Points Logic:** All heavy point calculation logic must reside in the Ktor backend service layer (`service/PointsService.kt`), not the frontend.
- **API Style:** RESTful JSON. Use `kotlinx.serialization` for DTOs.

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

### `card_earn_rates`
| Column | Type | Notes |
|--------|------|-------|
| id | SERIAL PK | |
| card_id | INTEGER FK | References credit_cards |
| category | VARCHAR(30) | One of: groceries, dining, gas, travel, entertainment, subscriptions, transit, other |
| earn_rate | NUMERIC(6,2) | Points per CAD spent |

### Reward Value Formula
`annual_value_CAD = monthly_spend × 12 × earn_rate × cpp / 100`

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| GET | `/api/cards` | All cards (summary) |
| POST | `/api/recommendations` | Ranked cards for given monthly spending |

### POST /api/recommendations
Request (monthly CAD — backend annualizes to annual):
```json
{ "spending": { "groceries": 500, "dining": 300, "gas": 100, "travel": 200,
                "entertainment": 100, "subscriptions": 50, "transit": 50, "other": 200 } }
```
Response (sorted best → worst by netAnnualValue):
```json
[{ "card": { "id": 1, "name": "...", "annualFee": 155.88, "pointsCurrency": "Amex MR", "cardType": "amex" },
   "breakdown": [{ "category": "groceries", "spent": 6000.0, "pointsEarned": 6000.0, "valueCAD": 90.0 }],
   "totalPointsEarned": 42000.0, "totalValueCAD": 420.0, "netAnnualValue": 264.12 }]
```

## Package Structure (Backend)
```
com.creditoptimizer
├── Application.kt
├── db/Tables.kt              # Exposed DSL table objects
├── dto/Dtos.kt               # @Serializable request/response classes
├── service/PointsService.kt  # All points calculation logic
└── plugins/
    ├── Database.kt           # HikariCP + Flyway + Exposed setup
    ├── Routing.kt            # Route definitions + CORS
    └── Serialization.kt      # JSON config
```

## Regional Constraints (Crucial)
- Focus ONLY on Canadian credit card issuers (Amex CA, RBC, TD, Scotiabank, BMO, CIBC). Include credit cards from banks like Wealthsimple and EQ Bank, telecommunication companies like Rogers, and consumers like PC Financial.
- Currency is always CAD.
- Address formats must support Canadian Provinces/Postal Codes.