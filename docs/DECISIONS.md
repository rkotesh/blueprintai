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

## 6. Maven Surefire Dynamic Agent Loading Configuration
- **Date:** 2026-11-17
- **Decision:** Configure Maven Surefire plugin with `-XX:+EnableDynamicAgentLoading -Dnet.bytebuddy.experimental=true`.
- **Reason:** In Java 21 on Windows, dynamic ByteBuddy agent attachment triggers warnings and named-pipe attach operations that can disrupt Surefire's stream handling unless dynamic agent loading is explicitly enabled.

## 7. Migration from OpenAI to xAI / Grok API
- **Date:** 2026-11-18
- **Decision:** Transition primary AI provider from OpenAI to xAI Grok API (`https://api.x.ai/v1`) using `GrokAiClient`, standardizing on model `grok-2-latest` (or `grok-beta`) with `response_format: { "type": "json_object" }` and schema extraction.
- **Reason:** User request to integrate xAI Grok for high-speed reasoning and structured JSON output. Environment variables `GROK_API_KEY`, `GROK_BASE_URL`, and `GROK_MODEL` are configured with backward compatibility.

## 8. Learning Layer Auto-Seeding & Concept Mastery Persistence
- **Date:** 2026-11-18
- **Decision:** Provide auto-seeded foundational engineering concepts and glossary terms on startup via `LearningService` while tracking per-user, per-concept status (`UNSEEN`, `UNDERSTOOD`) in `user_concept_progress`.
- **Reason:** Ensures non-coders and beginners immediately have rich educational analogies, definitions, and layer groupings upon creating their first project.

## 9. Understanding Check Web Speech API Integration
- **Date:** 2026-11-18
- **Decision:** Support speech-to-text dictation in the Understanding Check submission interface using the standard Web Speech API (`SpeechRecognition`/`webkitSpeechRecognition`) with client-side capability detection and graceful degradation to manual typing.
- **Reason:** Allows builders to naturally speak their thoughts and architectural mental models aloud, mimicking an interactive engineering interview.

## 10. Offline Markdown Handbook Export with Mermaid Diagrams
- **Date:** 2026-11-18
- **Decision:** Generate self-contained, offline Markdown handbooks (`/api/projects/{id}/export/handbook.md`) containing live Mermaid flowcharts, tech stack trade-offs, feature specifications, build milestones, and the complete glossary.
- **Reason:** Gives solo founders and builders a portable, vendor-independent architectural blueprint they can keep in their repositories or share with external reviewers.
