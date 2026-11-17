# BlueprintAI (Understand-While-You-Build)

> **Understand-While-You-Build Companion** for solo makers, vibe coders, and students building modern applications with AI.

BlueprintAI sits between your idea and your code. It translates complex software architecture into plain language, interactive diagrams, progressive code explanations, and active-recall comprehension checks.

---

## 1. Quick Start

### Prerequisites
- **Java 21 LTS**
- **Node.js 20+**
- **Docker & Docker Compose** (or local PostgreSQL 16)
- **Maven 3.9+**

### Running with Docker Compose (Recommended)
```bash
# 1. Clone the repository
git clone https://github.com/your-org/blueprintai.git
cd blueprintai

# 2. Configure environment
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# 3. Start PostgreSQL, Spring Boot Backend, and Next.js Frontend
docker compose up --build
```
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:8080/api`
- Swagger UI / OpenAPI Docs: `http://localhost:8080/swagger-ui.html`
- Actuator Health: `http://localhost:8080/actuator/health`

### Running Locally (Without Docker)
1. **Database:** Ensure PostgreSQL is running on `localhost:5432` with database `blueprintai`.
2. **Backend:**
   ```bash
   cd backend
   mvn spring-boot:run
   ```
3. **Frontend:**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

---

## 2. Project Structure
```
blueprintai/
├─ docker-compose.yml
├─ .github/workflows/ci.yml
├─ docs/                  # Architecture, API specs, Prompt templates, Decisions
├─ backend/               # Spring Boot 3.3.x, Java 21, Flyway, OpenAI Client
└─ frontend/              # Next.js 14+ App Router, React Flow, Monaco Editor
```

## 3. Documentation
- [Architecture & Modular Monolith Design](docs/ARCHITECTURE.md)
- [REST API Specification](docs/API.md)
- [Prompts & AI Schema Definitions](docs/PROMPTS.md)
- [Architecture Decision Records (ADR)](docs/DECISIONS.md)
