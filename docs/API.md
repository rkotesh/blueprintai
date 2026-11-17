# BlueprintAI API Specification

Base path: `/api`  
All non-auth endpoints require standard JWT authorization: `Authorization: Bearer <jwt>`.

### Error Response Format
All controllers return the standardized `ApiError` payload:
```json
{
  "timestamp": "2026-11-18T00:00:00Z",
  "status": 400,
  "error": "Bad Request",
  "message": "Detailed description of error",
  "path": "/api/projects",
  "fieldErrors": [
    { "field": "title", "message": "Title is required" }
  ]
}
```

---

## 1. Authentication (`/api/auth`)
- `POST /api/auth/register`: `{ email, password, displayName, level }` -> `{ token, refreshToken, user }`
- `POST /api/auth/login`: `{ email, password }` -> `{ token, refreshToken, user }`
- `POST /api/auth/refresh`: `{ refreshToken }` -> `{ token, refreshToken }`
- `POST /api/auth/logout`: Revokes token session.
- `GET /api/me`: Returns current user profile and builder level (`ZERO`, `BEGINNER`, `INTERMEDIATE`).
- `PATCH /api/me`: `{ displayName, level }`

## 2. Projects & Requirements Interview (`/api/projects`)
- `POST /api/projects`: `{ title, ideaText, mode, targetPlatform }`
- `GET /api/projects`: List authenticated user's projects.
- `GET /api/projects/{id}`: Get project details.
- `PATCH /api/projects/{id}`: Update title or idea text.
- `DELETE /api/projects/{id}`: Delete project and cascade all data.
- `POST /api/projects/{id}/interview/next`: `{ answer }` -> `{ question, whyAsking, done, turnIndex }`
- `GET /api/projects/{id}/interview`: List all interview conversation turns.

## 3. Blueprint & Features (`/api/projects/{id}`)
- `POST /api/projects/{id}/blueprint/generate`: Synthesize structured Blueprint and normalized features from interview.
- `GET /api/projects/{id}/blueprint`: Get latest versioned project blueprint.
- `GET /api/projects/{id}/features`: List normalized features (with priority MVP vs LATER).
- `PATCH /api/features/{featureId}`: `{ priority, status, logicNotes }`
- `POST /api/projects/{id}/features/{featureId}/analyze`: Deep breakdown of a feature (screens, data entities, edge cases).

## 4. Architecture & Stack Advisor
- `POST /api/projects/{id}/architecture/generate`: Generates architecture nodes & edges with layer tags.
- `GET /api/projects/{id}/architecture`: Returns latest topological graph for React Flow.
- `POST /api/projects/{id}/architecture/trace`: `{ featureId }` or `{ action }` -> ordered trace steps with 3-tier explanation.
- `POST /api/projects/{id}/stack/recommend`: Generates layer recommendations and alternatives.
- `GET /api/projects/{id}/stack`: Get current stack choices.
- `PATCH /api/stack/{choiceId}`: `{ userChoice }` -> saves user choice and triggers architecture regeneration.

## 5. Guided Build Milestones (`/api/projects/{id}/milestones`)
- `POST /api/projects/{id}/milestones/generate`: Generates ordered, bite-sized milestones with learning concepts.
- `GET /api/projects/{id}/milestones`: List milestones and progress.
- `PATCH /api/milestones/{milestoneId}`: `{ status: "TODO" | "IN_PROGRESS" | "DONE" }`

## 6. Code Explainer (`/api/projects/{id}/explain`)
- `POST /api/projects/{id}/explain`: `{ filename, language, codeText, milestoneId }` -> 3-tier explanation (analogy, plain, technical).
- `GET /api/projects/{id}/explain`: List past code explanations.
- `GET /api/projects/{id}/explain/stream`: Server-Sent Events (SSE) streaming endpoint for live real-time token delivery.

## 7. Architectural Debug Guide (`/api/projects/{id}/debug`)
- `POST /api/projects/{id}/debug`: `{ errorText, contextText }` -> diagnosis with isolated layer, analogy, cause, fix steps, and preventive tips.
- `GET /api/projects/{id}/debug`: List previous debugging sessions.

## 8. Learning Layer (`/api/projects/{id}/learning`)
- `GET /api/projects/{id}/learning/glossary`: Searchable engineering glossary with definitions and analogies.
- `GET /api/projects/{id}/learning/concepts`: Core concepts filterable by layer (AUTH, DATABASE, BACKEND, FRONTEND, ARCHITECTURE) with user status (`UNSEEN`, `UNDERSTOOD`).
- `PUT /api/projects/{id}/learning/concepts/{slug}`: Update concept status (`{ status: "UNDERSTOOD" }`).
- `POST /api/projects/{id}/learning/quizzes/generate`: Generate interactive 3-question quiz tailored to project blueprint.
- `POST /api/projects/{id}/learning/quizzes/{quizId}/attempt`: Submit answers `{ answers: [0, 1, 2] }` -> returns instant score and explanations.
- `GET /api/projects/{id}/learning/quizzes/{quizId}/attempts`: List previous quiz attempts.

## 9. Understanding Check (`/api/projects/{id}/understanding`)
- `POST /api/projects/{id}/understanding/evaluate`: `{ summary }` -> Grok AI evaluation out of 100 with 4 dimensions (Architecture, Stack Reasons, User Flows, Edge Cases), strengths, gaps, and recommendations.
- `GET /api/projects/{id}/understanding/history`: List previous understanding checks and progress over time.

## 10. Export & Offline Handbook (`/api/projects/{id}/export`)
- `GET /api/projects/{id}/export/handbook.md`: Downloads complete offline Markdown handbook with Mermaid flowchart diagrams, stack choices, milestones, and glossary.
- `GET /api/projects/{id}/export/handbook/preview`: Returns `{ markdown: string }` for in-browser inspection.
