# Project: Canadian Credit Card Points Optimizer

## Project Overview
An AI-powered app to maximize credit card rewards for Canadians based on financial and lifestyle profiles.

## Tech Stack
- **Frontend:** Next.js (App Router), TypeScript, Tailwind CSS
- **Backend:** Kotlin, Ktor, PostgreSQL
- **Database:** Exposed (Kotlin ORM) or SQLDelight
- **Environment:** Node 20+, JDK 17+

## Build & Development Commands
- **Full Stack:** `docker-compose up` (if applicable)
- **Frontend Dev:** `cd web && npm run dev`
- **Backend Dev:** `cd api && ./gradlew run`
- **Database Migrations:** `./gradlew databaseUpdate`
- **Testing:** `npm test` (Frontend), `./gradlew test` (Backend)

## Architecture & Rules
- **Schema First:** Always check `api/src/main/resources/db/migration` before modifying models.
- **Naming Conventions:** - Frontend: PascalCase for Components, camelCase for hooks/utils.
    - Backend: camelCase for variables/functions, PascalCase for Classes.
- **Points Logic:** All heavy point calculation logic must reside in the Ktor backend service layer, not the frontend.
- **API Style:** RESTful JSON. Use `kotlinx.serialization` for DTOs.

## Regional Constraints (Crucial)
- Focus ONLY on Canadian credit card issuers (Amex CA, RBC, TD, Scotiabank, BMO, CIBC). Include credit cards from banks like Wealthsimple and EQ Bank, telecommunication companies like Rogers, and consumers like PC Financial.
- Currency is always CAD.
- Address formats must support Canadian Provinces/Postal Codes.