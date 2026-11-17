# BlueprintAI Architecture Documentation

## 1. System Overview
BlueprintAI is an *understand-while-you-build* companion that bridges the gap between high-level application ideas and software architecture mental models for builders, vibe coders, and students.

```
+-------------------------------------------------------------------------+
|                              Next.js 14+                                |
|   (App Router, React Flow Canvas, Monaco Editor, Tailwind CSS, TanStack) |
+-------------------------------------------------------------------------+
                                    │
                                    │ HTTPS + Bearer JWT
                                    ▼
+-------------------------------------------------------------------------+
|                       Spring Boot 3.3.x Monolith                        |
|                                                                         |
|  [Security / JWT Filter] ──► [Controllers (REST / SSE)]                 |
|                                    │                                    |
|                              [Service Layer]                            |
|                                    │                                    |
|          ┌─────────────────────────┴────────────────────────┐           |
|          ▼                                                  ▼           |
|  [Spring Data JPA Repositories]                    [OpenAiClient]       |
|          │                                                  │           |
+──────────┼──────────────────────────────────────────────────┼───────────+
           ▼                                                  ▼
+-----------------------+                         +-----------------------+
|  PostgreSQL 16 (JSONB)|                         |      OpenAI API       |
+-----------------------+                         +-----------------------+
```

## 2. Key Modules
- **`auth` & `security`**: JWT authentication, refresh token rotation, user profile and skill level tracking (`ZERO`, `BEGINNER`, `INTERMEDIATE`).
- **`project`**: Core entity ownership, project modes (`BUILD`, `LEARN`), target platforms.
- **`blueprint`**: AI-driven multi-turn requirements interview, blueprint JSON schema generation, and relational normalization into features.
- **`architecture`**: Node & edge graph generation, topological layer classification (Frontend, Backend, Database, Auth, External), and interactive step-by-step trace animations.
- **`stack`**: Tech stack advisor with layer-by-layer trade-offs and swap-and-regenerate versioning.
- **`milestone`**: Step-by-step build roadmap, deliverable checks, and mastery quizzes.
- **`explainer`**: 3-layer progressive code explanations (Analogy -> Plain English -> Technical) streamed via Server-Sent Events (SSE).
- **`debug`**: Stack trace and error analysis mapped directly onto system architecture layers.
- **`learning`**: Project-specific glossary, concepts library, and retention quizzes.
- **`understanding`**: Active-recall validation engine evaluating user comprehension.

## 3. Data Integrity & Tenant Isolation
All tables in the database are bound directly to `user_id` or transitively via `project_id`. All repository queries are scoped by the authenticated user's ID to prevent cross-tenant data leakage. Cascade deletion (`ON DELETE CASCADE`) ensures clean lifecycle management.
