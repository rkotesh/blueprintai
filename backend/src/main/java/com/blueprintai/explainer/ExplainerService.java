package com.blueprintai.explainer;

import com.blueprintai.ai.AiClient;
import com.blueprintai.ai.PromptService;
import com.blueprintai.architecture.ArchitectureGraph;
import com.blueprintai.architecture.ArchitectureGraphRepository;
import com.blueprintai.common.ResourceNotFoundException;
import com.blueprintai.milestone.Milestone;
import com.blueprintai.milestone.MilestoneRepository;
import com.blueprintai.project.Project;
import com.blueprintai.project.ProjectRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.*;
import java.util.concurrent.Executors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ExplainerService {

    private final ProjectRepository projectRepository;
    private final CodeExplanationRepository explanationRepository;
    private final MilestoneRepository milestoneRepository;
    private final ArchitectureGraphRepository architectureGraphRepository;
    private final AiClient aiClient;
    private final PromptService promptService;
    private final ObjectMapper objectMapper;

    private static final String EXPLAIN_SCHEMA = """
        {
          "type": "object",
          "properties": {
            "layer": { "type": "string" },
            "summary": { "type": "string" },
            "analogy": { "type": "string" },
            "plain_explanation": { "type": "string" },
            "technical_detail": { "type": "string" },
            "key_takeaways": { "type": "array", "items": { "type": "string" } }
          },
          "required": ["layer", "summary", "analogy", "plain_explanation", "technical_detail", "key_takeaways"],
          "additionalProperties": false
        }
        """;

    @Transactional(readOnly = true)
    public List<CodeExplanationResponse> getExplanations(UUID projectId, UUID userId) {
        getProjectForUser(projectId, userId);
        return explanationRepository.findByProjectIdOrderByCreatedAtDesc(projectId).stream()
            .map(CodeExplanationResponse::fromEntity)
            .toList();
    }

    @Transactional
    public CodeExplanationResponse explainCode(UUID projectId, UUID userId, ExplainCodeRequest request) {
        Project project = getProjectForUser(projectId, userId);

        Milestone milestone = null;
        String milestoneTitle = "General Project Code";
        if (request.milestoneId() != null) {
            milestone = milestoneRepository.findById(request.milestoneId()).orElse(null);
            if (milestone != null) {
                milestoneTitle = milestone.getTitle() + " - " + milestone.getDescription();
            }
        }

        String archContext = "Standard full-stack web application.";
        Optional<ArchitectureGraph> archOpt = architectureGraphRepository.findTopByProjectIdOrderByVersionDesc(projectId);
        if (archOpt.isPresent()) {
            try {
                archContext = "System Nodes: " + objectMapper.writeValueAsString(archOpt.get().getNodes());
            } catch (Exception ignored) {}
        }

        String filename = (request.filename() != null && !request.filename().isBlank()) ? request.filename() : "Snippet";
        String language = (request.language() != null && !request.language().isBlank()) ? request.language() : "typescript";

        Map<String, String> variables = Map.of(
            "title", project.getTitle(),
            "architecture", archContext,
            "milestone", milestoneTitle,
            "filename", filename,
            "language", language,
            "code", request.codeText()
        );

        String userPrompt = promptService.render("code_explain.txt", variables);
        String systemPrompt = "You are a software architect that breaks code down into 3 explanation tiers: Analogy, Plain English, and Technical Detail.";

        CodeExplanationContent content = aiClient.generateStructuredOutput(
            "code_explain",
            systemPrompt,
            userPrompt,
            CodeExplanationContent.class,
            userId,
            "code_explain_response",
            EXPLAIN_SCHEMA
        );

        CodeExplanation entity = CodeExplanation.builder()
            .project(project)
            .milestone(milestone)
            .filename(filename)
            .language(language)
            .codeText(request.codeText())
            .layer(content.layer() != null ? content.layer() : "backend")
            .explanation(content)
            .build();

        CodeExplanation saved = explanationRepository.save(entity);
        return CodeExplanationResponse.fromEntity(saved);
    }

    public SseEmitter streamExplanation(UUID projectId, UUID userId, ExplainCodeRequest request) {
        SseEmitter emitter = new SseEmitter(120_000L); // 2 minute timeout

        Executors.newVirtualThreadPerTaskExecutor().execute(() -> {
            try {
                emitter.send(SseEmitter.event().name("status").data("Analyzing code structure and detecting layer..."));

                CodeExplanationResponse response = explainCode(projectId, userId, request);

                emitter.send(SseEmitter.event().name("layer").data(response.layer()));
                emitter.send(SseEmitter.event().name("analogy").data(response.explanation().analogy()));
                emitter.send(SseEmitter.event().name("plain").data(response.explanation().plain_explanation()));
                emitter.send(SseEmitter.event().name("technical").data(response.explanation().technical_detail()));
                emitter.send(SseEmitter.event().name("complete").data(response));

                emitter.complete();
            } catch (Exception e) {
                log.error("Error streaming code explanation", e);
                try {
                    emitter.send(SseEmitter.event().name("error").data(e.getMessage()));
                } catch (Exception ignored) {}
                emitter.completeWithError(e);
            }
        });

        return emitter;
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
