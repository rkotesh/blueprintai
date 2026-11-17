package com.blueprintai.ai;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
@Profile({"test", "dev"})
@RequiredArgsConstructor
@Slf4j
public class MockOpenAiClient implements AiClient {

    private final ObjectMapper objectMapper;
    private final AiUsageLogger usageLogger;
    private final RateLimiterService rateLimiterService;

    @Override
    public <T> T generateStructuredOutput(
        String task,
        String systemPrompt,
        String userPrompt,
        Class<T> responseType,
        UUID userId,
        String schemaName,
        String schemaJson
    ) {
        rateLimiterService.checkRateLimit(userId);
        rateLimiterService.validateInputSize(userPrompt, "userPrompt");

        log.info("MockOpenAiClient invoked for task: {}", task);
        usageLogger.logCall(userId, task, "mock-gpt-4o-mini", 120, 85, 25, true);

        String mockJson = switch (task) {
            case "interview_next" -> {
                boolean isDone = userPrompt.contains("Turn Count: 3") || userPrompt.contains("Turn Count: 4");
                yield """
                {
                  "question": "What is the primary action a registered user should take on their home dashboard?",
                  "why_asking": "Clarifying the primary action defines the central user journey and initial database schema.",
                  "done": %b
                }
                """.formatted(isDone);
            }
            case "blueprint_generate" -> """
                {
                  "summary": "An intelligent application platform bridging builders and scalable architecture.",
                  "users": ["Solo Builder", "Student Developer", "Architect"],
                  "features": [
                    {
                      "name": "User Authentication & Onboarding",
                      "description": "Email-based JWT authentication with skill level customization.",
                      "priority": "MVP",
                      "screens": ["LoginScreen", "RegisterScreen", "ProfileScreen"],
                      "data_entities": ["User", "RefreshToken"],
                      "logic_notes": "Enforce BCrypt hashing and 15-minute access token expiry."
                    },
                    {
                      "name": "Interactive Dashboard",
                      "description": "Visual tracking of ongoing builds and architectural graphs.",
                      "priority": "MVP",
                      "screens": ["DashboardScreen"],
                      "data_entities": ["Project", "Milestone"],
                      "logic_notes": "Filter all projects strictly by authenticated user ID."
                    },
                    {
                      "name": "Social Team Collaboration",
                      "description": "Invite co-founders and team members to review blueprints.",
                      "priority": "LATER",
                      "screens": ["TeamSettingsScreen", "InviteModal"],
                      "data_entities": ["TeamMember", "Invitation"],
                      "logic_notes": "Implement role-based access control (RBAC)."
                    }
                  ],
                  "user_flows": [
                    "User signs up -> selects skill level -> initiates requirements discovery interview -> receives blueprint."
                  ],
                  "data_model": [
                    {
                      "entity": "User",
                      "fields": ["id: UUID", "email: String", "displayName: String", "level: String"],
                      "relations": ["User 1:N Project"]
                    },
                    {
                      "entity": "Project",
                      "fields": ["id: UUID", "title: String", "ideaText: String", "status: String"],
                      "relations": ["Project N:1 User", "Project 1:N Feature"]
                    }
                  ]
                }
                """;
            case "feature_analyze" -> """
                {
                  "screens": ["AuthModal", "ProfileSettings", "SessionListView"],
                  "data_needed": ["users.email", "users.password_hash", "refresh_tokens.token_hash"],
                  "api_calls": [
                    "POST /api/auth/login - Authenticate credentials and return tokens",
                    "POST /api/auth/refresh - Rotate expired access tokens",
                    "POST /api/auth/logout - Revoke active sessions"
                  ],
                  "edge_cases": [
                    "User inputs unverified email format",
                    "Token expired during active form submission",
                    "Multiple concurrent sign-in attempts"
                  ],
                  "security_notes": [
                    "Passwords hashed using BCrypt with minimum work factor 10",
                    "Access tokens expire in 15 minutes",
                    "Refresh tokens revoked upon logout"
                  ],
                  "steps_to_build": [
                    "1. Define User entity with unique email constraint and password hash",
                    "2. Implement JwtFilter intercepting Authorization Bearer tokens",
                    "3. Build responsive React login and registration forms with validation",
                    "4. Implement refresh token rotation interceptor on HTTP 401"
                  ]
                }
                """;
            case "architecture_generate" -> """
                {
                  "nodes": [
                    {
                      "id": "frontend-app",
                      "label": "Next.js Web Client",
                      "layer": "FRONTEND",
                      "description": "Interactive browser UI with React Flow and TanStack Query",
                      "tech": "Next.js 14, TypeScript, Tailwind"
                    },
                    {
                      "id": "auth-service",
                      "layer": "AUTH",
                      "label": "JWT Security Gateway",
                      "description": "Stateless authentication and token rotation guard",
                      "tech": "Spring Security, BCrypt, JJWT"
                    },
                    {
                      "id": "backend-api",
                      "layer": "BACKEND",
                      "label": "Spring Boot Monolith",
                      "description": "Core domain services and business logic orchestration",
                      "tech": "Java 21, Spring Boot 3"
                    },
                    {
                      "id": "postgres-db",
                      "layer": "DATABASE",
                      "label": "PostgreSQL Database",
                      "description": "Relational entities and JSONB blueprint documents",
                      "tech": "PostgreSQL 16, Flyway"
                    },
                    {
                      "id": "external-services",
                      "layer": "EXTERNAL",
                      "label": "External Cloud APIs",
                      "description": "Third-party payment gateways and notification relays",
                      "tech": "Stripe, SendGrid"
                    }
                  ],
                  "edges": [
                    {
                      "from": "frontend-app",
                      "to": "auth-service",
                      "label": "POST /auth/login credentials",
                      "protocol": "HTTPS"
                    },
                    {
                      "from": "auth-service",
                      "to": "backend-api",
                      "label": "Validates claims & injects UserPrincipal",
                      "protocol": "Internal"
                    },
                    {
                      "from": "backend-api",
                      "to": "postgres-db",
                      "label": "Executes parameterized SQL queries",
                      "protocol": "SQL"
                    },
                    {
                      "from": "backend-api",
                      "to": "external-services",
                      "label": "Webhooks & REST calls",
                      "protocol": "HTTPS"
                    }
                  ]
                }
                """;
            case "architecture_trace" -> """
                {
                  "steps": [
                    {
                      "order": 1,
                      "node_id": "frontend-app",
                      "edge_id": "frontend-app-to-auth",
                      "analogy": "Like handing your ticket to the usher at the theater entrance.",
                      "plain_explanation": "The user clicks the button on their screen, sending an encrypted request over the internet.",
                      "technical_detail": "Browser sends HTTPS POST request with Bearer JWT in the Authorization header."
                    },
                    {
                      "order": 2,
                      "node_id": "auth-service",
                      "edge_id": "auth-to-backend",
                      "analogy": "Like checking a passport barcode against the digital security list.",
                      "plain_explanation": "The security layer verifies who you are and ensures you have permission to make this change.",
                      "technical_detail": "JwtFilter validates signature, parses claims, and loads UserPrincipal into SecurityContext."
                    },
                    {
                      "order": 3,
                      "node_id": "backend-api",
                      "edge_id": "backend-to-db",
                      "analogy": "Like an accountant writing an entry into the official ledger book.",
                      "plain_explanation": "The backend server processes the business rules and instructs the database to save the record.",
                      "technical_detail": "Service layer triggers transactional JPA entity persistence and flushes to the database connection pool."
                    },
                    {
                      "order": 4,
                      "node_id": "postgres-db",
                      "edge_id": "db-commit",
                      "analogy": "Like locking the safe after placing the document inside.",
                      "plain_explanation": "The database writes the record to permanent storage and confirms the save.",
                      "technical_detail": "PostgreSQL executes INSERT/UPDATE on indexed table, commits transaction, and returns row UUID."
                    }
                  ]
                }
                """;
            case "stack_recommend" -> """
                {
                  "layers": [
                    {
                      "layer": "Frontend",
                      "recommended": "Next.js 14 (App Router)",
                      "why": "Modern React framework combining fast server rendering with rich client interactivity.",
                      "tradeoffs": "Moderate learning curve with server vs client component mental models.",
                      "alternatives": [
                        { "name": "Vite + React SPA", "when_better": "Simpler mental model when SEO is not critical." },
                        { "name": "Remix / React Router 7", "when_better": "Better nested loading patterns for web apps." }
                      ]
                    },
                    {
                      "layer": "Backend",
                      "recommended": "Spring Boot 3.3 (Java 21)",
                      "why": "Enterprise-grade type safety, high performance, and bulletproof relational data integrity.",
                      "tradeoffs": "More verbose boilerplate compared to Node.js or Python.",
                      "alternatives": [
                        { "name": "Node.js (NestJS / Express)", "when_better": "Single-language JavaScript stack across frontend and backend." },
                        { "name": "Python (FastAPI)", "when_better": "Heavily data science or AI-agent centric workflows." }
                      ]
                    },
                    {
                      "layer": "Database",
                      "recommended": "PostgreSQL 16",
                      "why": "The industry gold standard relational database, supporting native JSONB for flexible documents.",
                      "tradeoffs": "Requires schema migrations and connection pool tuning.",
                      "alternatives": [
                        { "name": "MySQL", "when_better": "Standard web hosting with existing shared infrastructure." },
                        { "name": "MongoDB", "when_better": "Schemaless documents where relational integrity is not needed." }
                      ]
                    },
                    {
                      "layer": "Authentication",
                      "recommended": "Stateless JWT with Refresh Rotation",
                      "why": "Scales without session servers, allows fast decoupled API access.",
                      "tradeoffs": "Requires client-side interceptor for token refresh handling.",
                      "alternatives": [
                        { "name": "Session Cookies", "when_better": "Monolithic web apps serving server-rendered HTML." },
                        { "name": "Auth0 / Clerk", "when_better": "Fully managed third-party auth service with pre-built UI." }
                      ]
                    }
                  ]
                }
                """;
            default -> "{}";
        };

        try {
            return objectMapper.readValue(mockJson, responseType);
        } catch (Exception e) {
            throw new RuntimeException("Mock JSON could not be parsed into " + responseType.getSimpleName(), e);
        }
    }
}
