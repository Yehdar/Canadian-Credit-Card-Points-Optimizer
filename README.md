# Canadian Credit Card Points Optimizer

An AI-powered application that maximizes credit card rewards for Canadians based on their financial and lifestyle profiles.

## Prerequisites

| Tool | Version |
|------|---------|
| Node.js | 20+ |
| JDK | 21+ |
| PostgreSQL | 16+ |

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

### 2. Start the Backend (Ktor API)

Add your Gemini API key to `backend/local.properties`:
```
geminiApiKey=<your_key>
```
Or set the `GEMINI_API_KEY` environment variable before running.

```bash
cd backend
./gradlew run
```

The API will be available at `http://localhost:8080`.
Health check: `GET http://localhost:8080/health`

> **Windows users:** use `gradlew.bat run` or `./gradlew.bat run`

### 3. Start the Frontend (Next.js)

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
│   ├── app/                # App Router pages, layouts, and components
│   ├── context/            # ProfileContext, ThemeContext
│   ├── hooks/              # useChat, useRecommendations
│   └── lib/api.ts          # Shared types + fetch wrappers
├── backend/                # Ktor backend (Kotlin, Gradle)
│   ├── src/
│   │   └── main/
│   │       ├── kotlin/com/creditoptimizer/
│   │       │   ├── Application.kt
│   │       │   ├── dto/            # Dtos.kt, ProfileDtos.kt, ChatDtos.kt
│   │       │   ├── service/        # PointsService, ProfileService, GeminiService
│   │       │   └── plugins/        # Database.kt, Routing.kt, Serialization.kt
│   │       └── resources/
│   │           ├── application.conf
│   │           ├── logback.xml
│   │           └── db/migration/   # Flyway migrations (V1–V8)
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

The API reads configuration from `backend/src/main/resources/application.conf`.
Override with environment variables at runtime:

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `8080` | API server port |
| `DATABASE_URL` | `jdbc:postgresql://localhost:5432/creditoptimizer` | JDBC connection string |
| `DATABASE_USER` | `postgres` | Database username |
| `DATABASE_PASSWORD` | `postgres` | Database password |
| `GEMINI_API_KEY` | *(required)* | Gemini API key for the `/api/chat` endpoint |

---

## Regional Scope

This application is scoped to **Canadian** credit card issuers only:
- Major banks: Amex CA, RBC, TD, Scotiabank, BMO, CIBC
- Digital banks: Wealthsimple, EQ Bank
- Telecom & retail: Rogers, PC Financial

All amounts are in **CAD**. Address fields support Canadian provinces and postal codes.
