package com.blueprintai.debug;

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
public class DebugService {

    private final ProjectRepository projectRepository;
    private final DebugSessionRepository debugSessionRepository;
    private final ArchitectureGraphRepository architectureGraphRepository;
    private final StackChoiceRepository stackChoiceRepository;
    private final AiClient aiClient;
    private final PromptService promptService;
    private final ObjectMapper objectMapper;

    private static final String DEBUG_SCHEMA = """
        {
          "type": "object",
          "properties": {
            "layer": { "type": "string" },
            "title": { "type": "string" },
            "analogy": { "type": "string" },
            "plain_cause": { "type": "string" },
            "technical_cause": { "type": "string" },
            "fix_steps": { "type": "array", "items": { "type": "string" } },
            "preventive_tip": { "type": "string" }
          },
          "required": ["layer", "title", "analogy", "plain_cause", "technical_cause", "fix_steps", "preventive_tip"],
          "additionalProperties": false
        }
        """;

    @Transactional(readOnly = true)
    public List<DebugSessionResponse> getDebugHistory(UUID projectId, UUID userId) {
        getProjectForUser(projectId, userId);
        return debugSessionRepository.findByProjectIdOrderByCreatedAtDesc(projectId).stream()
            .map(DebugSessionResponse::fromEntity)
            .toList();
    }

    @Transactional
    public DebugSessionResponse diagnoseError(UUID projectId, UUID userId, DebugRequest request) {
        Project project = getProjectForUser(projectId, userId);

        String archContext = "Standard full-stack web application.";
        Optional<ArchitectureGraph> archOpt = architectureGraphRepository.findTopByProjectIdOrderByVersionDesc(projectId);
        if (archOpt.isPresent()) {
            try {
                archContext = "Nodes: " + objectMapper.writeValueAsString(archOpt.get().getNodes())
                    + ", Edges: " + objectMapper.writeValueAsString(archOpt.get().getEdges());
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
            "architecture", archContext,
            "stack", stackContext,
            "error_text", request.errorText(),
            "context_text", request.contextText() != null ? request.contextText() : "None provided."
        );

        String userPrompt = promptService.render("debug_guide.txt", variables);
        String systemPrompt = "You are a software debugger that pinpoints the broken architectural layer and explains root cause in plain English with actionable fix steps.";

        DebugResultContent result = aiClient.generateStructuredOutput(
            "debug_guide",
            systemPrompt,
            userPrompt,
            DebugResultContent.class,
            userId,
            "debug_guide_response",
            DEBUG_SCHEMA
        );

        DebugSession session = DebugSession.builder()
            .project(project)
            .errorText(request.errorText())
            .contextText(request.contextText())
            .result(result)
            .build();

        return DebugSessionResponse.fromEntity(debugSessionRepository.save(session));
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
