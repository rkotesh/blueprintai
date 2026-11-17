package com.blueprintai.ai;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
@Profile("test")
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
            default -> "{}";
        };

        try {
            return objectMapper.readValue(mockJson, responseType);
        } catch (Exception e) {
            throw new RuntimeException("Mock JSON could not be parsed into " + responseType.getSimpleName(), e);
        }
    }
}
