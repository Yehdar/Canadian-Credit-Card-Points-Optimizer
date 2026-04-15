# Canadian Credit Card Points Optimizer

An AI-powered application that maximizes credit card rewards for Canadians based on their financial and lifestyle profiles.

## Recorded Demo

[![Project Showcase](https://github.com/Yehdar/Canadian-Credit-Card-Points-Optimizer/demo/thumbnail.png)](https://drive.google.com/file/d/1c3DM8niyeuoNdS-T3PTqHOcg4y6hMigq/view?usp=sharing)

> *Click the image above to view the full walkthrough of the AI-driven card optimizer.*

## Prerequisites

| Tool | Version | Notes |
|------|---------|-------|
| Node.js | 20+ | |
| JDK | 21+ | |
| PostgreSQL | 16+ | |
| Auth0 account | free tier | SPA application required (see setup below) |

---

## Quick Start

### 1. Set Up the Database

**Install PostgreSQL** (first time only) — run in PowerShell as Administrator:
```powershell
winget install PostgreSQL.PostgreSQL.16
```
During installation, set the password for the `postgres` user to `postgres` to match the default config.

**Create the database** — after install, open a new terminal:
```powershell
createdb -U postgres creditoptimizer
```

PostgreSQL runs as a Windows service and starts automatically on boot.
To start/stop it manually:
```powershell
net start postgresql-x64-16   # start
net stop  postgresql-x64-16   # stop
```

### 2. Configure Auth0

1. Create a free account at [auth0.com](https://auth0.com) and set up a tenant.
2. In the Auth0 Dashboard → **Applications** → **Create Application** → choose **Regular Web Application**.
3. Under **Settings**, add to the allowed URLs:
   - **Allowed Callback URLs:** `http://localhost:3000/auth/callback`
   - **Allowed Logout URLs:** `http://localhost:3000`
   - **Allowed Web Origins:** `http://localhost:3000`
4. Create `frontend/.env.local` (never commit this file):
   ```
   AUTH0_DOMAIN=<your-tenant>.us.auth0.com
   AUTH0_CLIENT_ID=<client-id>
   AUTH0_CLIENT_SECRET=<client-secret>
   AUTH0_SECRET=<random-32+-char-string>
   APP_BASE_URL=http://localhost:3000
   NEXT_PUBLIC_API_URL=http://localhost:8080
   AUTH0_AUDIENCE=https://<your-tenant>.us.auth0.com/api/v2/
   ```

### 3. Start the Backend (Ktor API)

Add your keys to `backend/local.properties` (never commit this file):
```
geminiApiKey=<your_gemini_key>
auth0Domain=<your-tenant>.us.auth0.com
auth0Audience=https://<your-tenant>.us.auth0.com/api/v2/
```
Or set `GEMINI_API_KEY`, `AUTH0_DOMAIN`, and `AUTH0_AUDIENCE` as environment variables.

```bash
cd backend
./gradlew run
```

The API will be available at `http://localhost:8080`.
Health check: `GET http://localhost:8080/health`

> **Windows users:** use `gradlew.bat run` or `./gradlew.bat run`

### 4. Start the Frontend (Next.js)

```bash
cd frontend
npm install   # first time only
npm run dev
```

The web app will be available at `http://localhost:3000`.

---

## Project Structure

```
.
├── frontend/               # Next.js frontend (TypeScript, Tailwind CSS v4)
│   ├── proxy.ts            # Auth0 middleware proxy (Next.js 16 pattern)
│   ├── next.config.ts      # Image remote patterns for avatars
│   ├── app/                # App Router pages, layouts, and components
│   │   └── components/     # AuthProvider, AuthButtons, SplashScreen, ChatPanel, ArsenalModal, ...
│   ├── context/            # ProfileContext (auth-aware), ThemeContext
│   ├── hooks/              # useChat, useRecommendations
│   └── lib/
│       ├── api.ts          # Shared types + fetch wrappers (Bearer token on profile calls)
│       └── auth0.ts        # Auth0Client singleton
├── backend/                # Ktor backend (Kotlin, Gradle)
│   ├── src/
│   │   └── main/
│   │       ├── kotlin/com/creditoptimizer/
│   │       │   ├── Application.kt
│   │       │   ├── dto/            # Dtos.kt, ProfileDtos.kt, ChatDtos.kt
│   │       │   ├── service/        # ProfileService (per-user), GeminiService
│   │       │   └── plugins/        # Auth.kt, Database.kt, Routing.kt, Serialization.kt
│   │       └── resources/
│   │           ├── application.conf
│   │           ├── logback.xml
│   │           └── db/migration/   # V1__init.sql (consolidated schema)
│   └── build.gradle.kts
└── CLAUDE.md
```

---

## Available Commands

### Frontend

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run lint` | Run ESLint |

### Backend

| Command | Description |
|---------|-------------|
| `./gradlew run` | Start the Ktor server |
| `./gradlew test` | Run backend tests |
| `./gradlew build` | Build the project JAR |

### Database

| Command | Description |
|---------|-------------|
| `net start postgresql-x64-16` | Start the PostgreSQL service |
| `net stop postgresql-x64-16` | Stop the PostgreSQL service |

---

## Environment Variables

### Backend (`backend/local.properties` or environment)

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `8080` | API server port |
| `DATABASE_URL` | `jdbc:postgresql://localhost:5432/creditoptimizer` | JDBC connection string |
| `DATABASE_USER` | `postgres` | Database username |
| `DATABASE_PASSWORD` | `postgres` | Database password |
| `GEMINI_API_KEY` | *(required)* | Gemini API key for `/api/chat` |
| `AUTH0_DOMAIN` | *(required)* | Auth0 tenant domain (e.g. `dev-xxx.us.auth0.com`) |
| `AUTH0_AUDIENCE` | *(required)* | Auth0 API audience — must match frontend exactly |

### Frontend (`frontend/.env.local` — never commit)

| Variable | Description |
|----------|-------------|
| `AUTH0_DOMAIN` | Auth0 tenant domain |
| `AUTH0_CLIENT_ID` | Auth0 application client ID |
| `AUTH0_CLIENT_SECRET` | Auth0 application client secret |
| `AUTH0_SECRET` | Random secret used to encrypt the session cookie |
| `APP_BASE_URL` | Frontend base URL (e.g. `http://localhost:3000`) |
| `NEXT_PUBLIC_API_URL` | Backend API URL (defaults to `http://localhost:8080`) |
| `AUTH0_AUDIENCE` | Auth0 API audience — must match backend exactly |

---

## Regional Scope

This application is scoped to **Canadian** credit card issuers only:
- Major banks: Amex CA, RBC, TD, Scotiabank, BMO, CIBC
- Digital banks: Wealthsimple, EQ Bank
- Telecom & retail: Rogers, PC Financial

All amounts are in **CAD**. Address fields support Canadian provinces and postal codes.
