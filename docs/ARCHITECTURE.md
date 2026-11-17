# BlueprintAI Architecture Documentation

## 1. System Overview
BlueprintAI is an *understand-while-you-build* companion that bridges the gap between high-level application ideas and software architecture mental models for founders, vibe coders, and student developers.

```
+------------------------------------------------------------------------------------+
|                                Next.js 14+ Frontend                                |
|   (App Router, React Flow Canvas, Monaco Editor, Tailwind CSS, TanStack Query)     |
+------------------------------------------------------------------------------------+
                                           │
                                           │ HTTPS + Bearer JWT
                                           ▼
+------------------------------------------------------------------------------------+
|                             Spring Boot 3.3.x Monolith                             |
|                                                                                    |
|  [Security / JwtFilter] ──► [Controllers (REST / SSE Stream)]                      |
|                                         │                                          |
|                                  [Service Layer]                                   |
|                                         │                                          |
|            ┌────────────────────────────┴───────────────────────────┐              |
|            ▼                                                        ▼              |
|  [Spring Data JPA Repositories]                               [GrokAiClient]       |
|            │                                                        │              |
+────────────┼────────────────────────────────────────────────────────┼──────────────+
             ▼                                                        ▼
+--------------------------+                               +-------------------------+
|   PostgreSQL 16 (JSONB)  |                               |       xAI Grok API      |
|   (Flyway Schema Migr.)  |                               |    (grok-2-latest)      |
+--------------------------+                               +-------------------------+
```

## 2. Key Modules
- **`auth` & `security`**: Stateless JWT authentication, refresh token rotation, user profile and skill level tracking (`ZERO`, `BEGINNER`, `INTERMEDIATE`). Passwords hashed using BCrypt.
- **`project`**: Core project ownership, project modes (`BUILD`, `LEARN`), target platforms (`WEB`, `MOBILE`, `CLI`, `API`).
- **`interview`**: Guided multi-turn requirements interview dynamically adapting follow-up questions with architectural rationale notes.
- **`blueprint` & `feature`**: Synthesizes validated JSON Project Blueprint and normalized relational features split into `MVP` and `LATER` scopes.
- **`architecture`**: Topological graph generation (`@xyflow/react`), layer tags (Client, API, Database, Auth, External), and interactive step-by-step action tracing with 3-tier mental model animations.
- **`stack`**: Tech stack advisor detailing recommendations, architectural reasoning, and alternatives with pros, cons, and swap-and-regenerate capability.
- **`milestone`**: Step-by-step guided build milestones with order, status tracking, and key concepts.
- **`explainer`**: 3-tier progressive code explainer (Analogy -> Plain English -> Technical Detail) with Monaco code studio and Server-Sent Events (SSE) streaming.
- **`debug`**: Architectural error debugger isolating the faulty layer, providing real-world analogies, root causes, and step-by-step remediation checklists.
- **`learning`**: Auto-seeded engineering glossary and core concepts library with status tracking (`UNSEEN`, `UNDERSTOOD`) and project-tailored multi-choice quizzes.
- **`understanding`**: Active recall evaluation engine evaluating user summaries across 4 dimensions (Architecture, Stack Reasons, User Flows, Edge Cases) with Web Speech API voice input.
- **`export`**: Offline Markdown handbook generation (`/api/projects/{id}/export/handbook.md`) with live Mermaid diagrams, complete feature lists, and cheatsheets.

## 3. xAI Grok API Integration
- **Client:** `GrokAiClient` using Spring 6 `RestClient`.
- **Base URL:** `https://api.x.ai/v1` (configurable via `GROK_BASE_URL`).
- **Default Model:** `grok-2-latest` (configurable via `GROK_MODEL`).
- **Structured Outputs:** Requests pass `response_format: { "type": "json_object" }` with the target JSON schema embedded in the system prompt.
- **Robustness:** Output parser strips markdown fences (````json ... ````) and performs regex extraction of matching braces.
- **Testing:** Zero-cost `MockOpenAiClient` activates under profile `test` for instant, deterministic, and offline integration test execution.

## 4. Database Schema & Multi-Tenancy
- Relational entities (`users`, `projects`, `features`, `milestones`, `glossary_terms`, `concepts`, `quizzes`, `understanding_checks`) enforce foreign-key cascading and tenant isolation.
- Evolving schemas (architectural nodes/edges, blueprint summaries, stack alternatives, and quiz answer options) leverage PostgreSQL `JSONB` with Hibernate 6 `@JdbcTypeCode(SqlTypes.JSON)`.
- All repository queries filter by authenticated `user_id` or `project_id` to guarantee tenant isolation.
