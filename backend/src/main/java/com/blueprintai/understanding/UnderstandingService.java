package com.blueprintai.understanding;

import com.blueprintai.ai.AiClient;
import com.blueprintai.ai.PromptService;
import com.blueprintai.architecture.ArchitectureGraph;
import com.blueprintai.architecture.ArchitectureGraphRepository;
import com.blueprintai.common.ResourceNotFoundException;
import com.blueprintai.project.Project;
import com.blueprintai.project.ProjectRepository;
import com.blueprintai.stack.StackChoice;
import com.blueprintai.stack.StackChoiceRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class UnderstandingService {

    private final ProjectRepository projectRepository;
    private final UnderstandingCheckRepository checkRepository;
    private final ArchitectureGraphRepository architectureGraphRepository;
    private final StackChoiceRepository stackChoiceRepository;
    private final AiClient aiClient;
    private final PromptService promptService;
    private final ObjectMapper objectMapper;

    private static final String UNDERSTANDING_SCHEMA = """
        {
          "type": "object",
          "properties": {
            "total_score": { "type": "integer" },
            "dimensions": {
              "type": "object",
              "properties": {
                "architecture": {
                  "type": "object",
                  "properties": { "score": { "type": "integer" }, "comment": { "type": "string" } },
                  "required": ["score", "comment"]
                },
                "stack_reasons": {
                  "type": "object",
                  "properties": { "score": { "type": "integer" }, "comment": { "type": "string" } },
                  "required": ["score", "comment"]
                },
                "user_flows": {
                  "type": "object",
                  "properties": { "score": { "type": "integer" }, "comment": { "type": "string" } },
                  "required": ["score", "comment"]
                },
                "edge_cases": {
                  "type": "object",
                  "properties": { "score": { "type": "integer" }, "comment": { "type": "string" } },
                  "required": ["score", "comment"]
                }
              },
              "required": ["architecture", "stack_reasons", "user_flows", "edge_cases"]
            },
            "strengths": { "type": "array", "items": { "type": "string" } },
            "gaps": { "type": "array", "items": { "type": "string" } },
            "constructive_feedback": { "type": "string" },
            "recommended_concepts": { "type": "array", "items": { "type": "string" } }
          },
          "required": ["total_score", "dimensions", "strengths", "gaps", "constructive_feedback", "recommended_concepts"],
          "additionalProperties": false
        }
        """;

    @Transactional(readOnly = true)
    public List<UnderstandingCheckResponse> getHistory(UUID projectId, UUID userId) {
        getProjectForUser(projectId, userId);
        return checkRepository.findByProjectIdOrderByCreatedAtDesc(projectId).stream()
            .map(UnderstandingCheckResponse::fromEntity)
            .toList();
    }

    @Transactional
    public UnderstandingCheckResponse evaluateUnderstanding(UUID projectId, UUID userId, String userSummary) {
        Project project = getProjectForUser(projectId, userId);

        String archContext = "Standard full-stack web application.";
        Optional<ArchitectureGraph> archOpt = architectureGraphRepository.findTopByProjectIdOrderByVersionDesc(projectId);
        if (archOpt.isPresent()) {
            try {
                archContext = "Nodes: " + objectMapper.writeValueAsString(archOpt.get().getNodes());
            } catch (Exception ignored) {}
        }

        String stackContext = "Default web stack.";
        List<StackChoice> choices = stackChoiceRepository.findByProjectIdOrderByCreatedAtAsc(projectId);
        if (!choices.isEmpty()) {
            StringBuilder sb = new StringBuilder();
            for (StackChoice c : choices) {
                sb.append(c.getLayer()).append(": ").append(c.getUserChoice() != null ? c.getUserChoice() : c.getRecommended()).append(". ");
            }
            stackContext = sb.toString();
        }

        Map<String, String> variables = Map.of(
            "title", project.getTitle(),
            "idea", project.getIdeaText(),
            "architecture", archContext,
            "stack", stackContext,
            "user_summary", userSummary
        );

        String userPrompt = promptService.render("understanding_check.txt", variables);
        String systemPrompt = "You are a software architect assessing a developer's conceptual grasp of their system across architecture, stack rationale, user flows, and edge cases.";

        UnderstandingFeedback feedback = aiClient.generateStructuredOutput(
            "understanding_check",
            systemPrompt,
            userPrompt,
            UnderstandingFeedback.class,
            userId,
            "understanding_check_response",
            UNDERSTANDING_SCHEMA
        );

        UnderstandingCheck check = UnderstandingCheck.builder()
            .project(project)
            .userSummary(userSummary)
            .feedback(feedback)
            .score(feedback.total_score())
            .build();

        return UnderstandingCheckResponse.fromEntity(checkRepository.save(check));
    }

    private Project getProjectForUser(UUID projectId, UUID userId) {
        Project project = projectRepository.findById(projectId)
            .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + projectId));
        if (!project.getUser().getId().equals(userId)) {
            throw new ResourceNotFoundException("Project not found with id: " + projectId);
        }
        return project;
    }
}
