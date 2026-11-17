# BlueprintAI API Specification

Base path: `/api`  
All non-auth endpoints require `Authorization: Bearer <jwt>`.

### Error Response Format
All errors return the standardized `ApiError` payload:
```json
{
  "timestamp": "2026-11-17T18:00:00Z",
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
- `POST /api/auth/logout`: Revokes refresh token.
- `GET /api/me`: Returns current user profile and level.
- `PATCH /api/me`: `{ displayName, level }`

## 2. Projects & Interview (`/api/projects`)
- `POST /api/projects`: `{ title, ideaText, mode, targetPlatform }`
- `GET /api/projects`: List user's projects.
- `GET /api/projects/{id}`: Get project details.
- `PATCH /api/projects/{id}`: Update project metadata.
- `DELETE /api/projects/{id}`: Delete project and cascade data.
- `POST /api/projects/{id}/interview/next`: `{ answer }` -> `{ question, whyAsking, done, turnIndex }`
- `GET /api/projects/{id}/interview`: List all interview turns.

## 3. Blueprint & Features (`/api/projects/{id}`)
- `POST /api/projects/{id}/blueprint/generate`: Generate blueprint from interview.
- `GET /api/projects/{id}/blueprint`: Get latest blueprint.
- `GET /api/projects/{id}/features`: List normalized features.
- `PATCH /api/features/{featureId}`: `{ priority, status, logicNotes }`
- `POST /api/projects/{id}/features/{featureId}/analyze`: Deep breakdown of a feature.

## 4. Architecture & Stack
- `POST /api/projects/{id}/architecture/generate`: Generates architecture nodes & edges.
- `GET /api/projects/{id}/architecture`: Returns latest graph.
- `POST /api/projects/{id}/architecture/trace`: `{ featureId }` or `{ action }` -> ordered trace steps.
- `POST /api/projects/{id}/stack/recommend`: Generates layer recommendations.
- `GET /api/projects/{id}/stack`: Get current stack choices.
- `PATCH /api/stack/{id}`: `{ userChoice }` -> prompts graph regeneration.

## 5. Milestones & Learning
- `POST /api/projects/{id}/milestones/generate`: Generates build roadmap.
- `GET /api/projects/{id}/milestones`: List milestones.
- `PATCH /api/milestones/{id}`: `{ status }`
- `GET /api/projects/{id}/glossary`: Glossary terms for project.
- `GET /api/concepts`: List all platform concepts.
- `POST /api/concepts/{id}/progress`: Update user progress (`SEEN`, `UNDERSTOOD`).
- `POST /api/milestones/{id}/quiz/generate`: Generate milestone quiz.
- `POST /api/quizzes/{id}/attempt`: `{ answers }` -> score & explanation.
- `GET /api/me/progress`: Overall learning statistics.

## 6. Code Explainer & Debug
- `POST /api/projects/{id}/explain`: `{ filename, language, code }` -> 3-layer explanation.
- `POST /api/projects/{id}/explain/stream`: Same as above, streamed over Server-Sent Events (SSE).
- `POST /api/projects/{id}/debug`: `{ errorText, context }` -> root cause, architecture layer, fix steps.

## 7. Understanding Check
- `POST /api/projects/{id}/check`: `{ userSummary }` -> score (0-100), correct points, gaps, misconceptions, next steps.
