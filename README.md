# BlueprintAI (Understand-While-You-Build)

> **Understand-While-You-Build Companion** for solo founders, vibe coders, and students building software with AI.

BlueprintAI sits between your idea and your code. It translates complex software architecture into plain language, interactive diagrams, progressive code explanations, guided build roadmaps, and active-recall comprehension checks.

GitHub Repository: [https://github.com/rkotesh/blueprintai.git](https://github.com/rkotesh/blueprintai.git)

---

## 1. Core Capabilities & Feature Flows

| Flow | Capability | What You Get |
|---|---|---|
| **Flow A** | **Project & Requirements** | Multi-turn interview turning vague ideas into structured MVP vs. Later specifications. |
| **Flow B** | **Project Blueprint** | Unified architectural record with normalized features, screens, data entities, and edge cases. |
| **Flow C** | **Architecture Map & Trace** | Interactive React Flow canvas showing Frontend, Backend, Database, and Services, plus animated packet traces. |
| **Flow D** | **Tech Stack Advisor** | Plain-English recommendations, trade-offs, and alternatives with one-click technology swap-and-regenerate. |
| **Flow E** | **Guided Build Roadmap** | Bite-sized sequential build milestones paired with concepts to master. |
| **Flow F** | **Code Explainer & Debugger** | Dual-pane Monaco studio for 3-tier progressive explanations (Analogy -> Plain -> Technical) and architectural error debugging. |
| **Flow G** | **Learning Layer & Understanding Check** | Searchable glossary, concept cards, project quizzes, and speech-to-text active recall mental model scoring (0-100). |
| **Export** | **Offline Handbook** | Comprehensive offline Markdown handbook export (`blueprint-handbook.md`) with live Mermaid diagrams. |

---

## 2. Tech Stack

- **Frontend:** Next.js 14+ (App Router), TypeScript, Tailwind CSS, `@xyflow/react` (React Flow 12), `@monaco-editor/react`, TanStack Query, Lucide icons.
- **Backend:** Java 21 LTS, Spring Boot 3.3.5, Spring Security (Stateless JWT), Spring Data JPA, Flyway migrations, Hibernate 6 (`JSONB` column mapping).
- **Database:** PostgreSQL 16 with UUID keys and indexed JSONB columns (or in-memory H2 with PostgreSQL compatibility in dev mode).
- **AI Engine:** **xAI Grok API** (`grok-2-latest` / `grok-beta`) via OpenAI-compatible `/chat/completions` endpoint with structured schema extraction.

---

## 3. Configuration Guide (Grok API & Secrets)

All secrets live **strictly in the backend environment**. The browser never contacts xAI directly.

### Environment Variables

#### Backend (`backend/.env` or system environment):
```env
# Server Port
PORT=8080

# Database Configuration (PostgreSQL)
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/blueprintai
SPRING_DATASOURCE_USERNAME=postgres
SPRING_DATASOURCE_PASSWORD=postgres

# JWT Security
JWT_SECRET=super_secret_blueprintai_jwt_signing_key_at_least_32_characters_long_for_security!
JWT_ACCESS_EXPIRATION_MS=900000        # 15 minutes
JWT_REFRESH_EXPIRATION_MS=604800000    # 7 days

# xAI Grok API Configuration
GROK_API_KEY=xai-your-api-key-here
GROK_BASE_URL=https://api.x.ai/v1
GROK_MODEL=grok-2-latest
```

> **How to get your Grok API Key:**  
> 1. Sign up at [xAI Console](https://console.x.ai/).  
> 2. Create an API Key in the API Keys section.  
> 3. Paste the key into `backend/.env` under `GROK_API_KEY`.

#### Frontend (`frontend/.env.local`):
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080/api
```

---

## 4. How to Run

### Option A: Zero-Dependency Local Dev Mode (No PostgreSQL or Docker required)
The backend includes a zero-config `dev` profile with in-memory H2 (PostgreSQL compatibility mode) and a mock AI client:

```bash
# 1. Start Backend in Dev Mode
cd backend
mvn spring-boot:run "-Dspring-boot.run.profiles=dev"

# 2. In a second terminal, start Frontend
cd frontend
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

### Option B: Full Production Stack with Docker Compose
To run PostgreSQL 16, Spring Boot, and Next.js in synchronized Docker containers:

```bash
# 1. Provide your Grok API key in backend/.env
cp backend/.env.example backend/.env
# (Edit backend/.env and paste your GROK_API_KEY)

# 2. Launch the multi-container stack
docker compose up --build
```

- **Frontend App:** [http://localhost:3000](http://localhost:3000)
- **Backend API:** [http://localhost:8080/api](http://localhost:8080/api)
- **Swagger UI / OpenAPI Documentation:** [http://localhost:8080/swagger-ui.html](http://localhost:8080/swagger-ui.html)
- **Actuator Health Check:** [http://localhost:8080/actuator/health](http://localhost:8080/actuator/health)

---

## 5. Testing & Verification

### Running Backend Integration Tests
All 8 integration test suites run against the in-memory `test` profile with zero external dependencies:
```bash
cd backend
mvn test "-Dspring.profiles.active=test"
```

### Running Frontend Tests & Production Build
All 12 test files run under Vitest with React Testing Library:
```bash
cd frontend
npm test
npm run build
```

---

## 6. Project Documentation Index
- **[Architecture & Design](docs/ARCHITECTURE.md):** Monolith design, Grok AI integration, database schema, multi-tenancy.
- **[REST API Specification](docs/API.md):** Complete catalog of endpoints, request/response bodies, and status codes.
- **[Prompt Catalog & Schemas](docs/PROMPTS.md):** All 10 prompt templates with JSON schemas and personas.
- **[Architecture Decision Records](docs/DECISIONS.md):** Complete record of architectural decisions and rationale.
