# Architecture & Technical Decisions (DECISIONS.md)

This log records all architectural, library, and technical decisions made during the development of BlueprintAI, in accordance with the project rules.

---

## 1. Monorepo and Packaging Architecture
- **Date:** 2026-11-17
- **Decision:** Split the repository into a frontend (`Next.js 14+ App Router`) and backend (`Spring Boot 3.3.x / Java 21`) monorepo.
- **Reason:** Clean separation of concerns between client UI/visualizations and secure server-side orchestration (preventing OpenAI keys or sensitive prompts from reaching client bundles).

## 2. Java 21 and Spring Boot 3.3.x Framework Selection
- **Date:** 2026-11-17
- **Decision:** Use Java 21 LTS with Spring Boot 3.3.x, standardizing on Java `record`s for immutable DTOs and Flyway for version-controlled database schema migrations.
- **Reason:** Modern Java records provide concise, immutable, and typesafe DTOs with seamless Jackson serialization. Spring Boot 3.3 provides native support for `RestClient`, OpenTelemetry/Micrometer tracing, and PostgreSQL `JSONB` integration through Hibernate 6.

## 3. Database & JSONB Storage Strategy
- **Date:** 2026-11-17
- **Decision:** Use PostgreSQL 16 with UUID primary keys and `JSONB` columns for AI-generated blueprint representations, architecture graphs, and evaluation reports.
- **Reason:** Core project metadata (users, projects, features, milestones) requires strict relational integrity and foreign-key cascading, while AI-generated blueprints and topological graphs evolve with prompt schemas and are best served by indexed `JSONB`.

## 4. Frontend Component & Graphing Library Selection
- **Date:** 2026-11-17
- **Decision:** Use `@xyflow/react` (React Flow 12) for architecture graph rendering and animation, `@monaco-editor/react` for the dual-pane code explainer, and Tailwind CSS + `lucide-react` for UI styling.
- **Reason:** Explicitly stipulated in Section 4 of the specification.

## 5. Offline & Test Strategy for AI Client
- **Date:** 2026-11-17
- **Decision:** Implement `MockOpenAiClient` as a drop-in bean under the `test` profile alongside the production `OpenAiClient`.
- **Reason:** Guarantees deterministic, fast, zero-cost, and network-independent test runs across CI and local environments.
