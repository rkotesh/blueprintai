package com.blueprintai.stack;

import com.blueprintai.ai.AiClient;
import com.blueprintai.ai.PromptService;
import com.blueprintai.architecture.ArchitectureService;
import com.blueprintai.blueprint.Blueprint;
import com.blueprintai.blueprint.BlueprintRepository;
import com.blueprintai.common.BadRequestException;
import com.blueprintai.common.ResourceNotFoundException;
import com.blueprintai.common.UnauthorizedException;
import com.blueprintai.project.Project;
import com.blueprintai.project.ProjectRepository;
import com.blueprintai.user.User;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class StackService {

    private final ProjectRepository projectRepository;
    private final BlueprintRepository blueprintRepository;
    private final StackChoiceRepository stackChoiceRepository;
    private final AiClient aiClient;
    private final PromptService promptService;
    private final ObjectMapper objectMapper;

    @Lazy
    private final ArchitectureService architectureService;

    private static final String STACK_SCHEMA = """
        {
          "type": "object",
          "properties": {
            "layers": {
              "type": "array",
              "items": {
                "type": "object",
                "properties": {
                  "layer": { "type": "string" },
                  "recommended": { "type": "string" },
                  "why": { "type": "string" },
                  "tradeoffs": { "type": "string" },
                  "alternatives": {
                    "type": "array",
                    "items": {
                      "type": "object",
                      "properties": {
                        "name": { "type": "string" },
                        "when_better": { "type": "string" }
                      },
                      "required": ["name", "when_better"],
                      "additionalProperties": false
                    }
                  }
                },
                "required": ["layer", "recommended", "why", "tradeoffs", "alternatives"],
                "additionalProperties": false
              }
            }
          },
          "required": ["layers"],
          "additionalProperties": false
        }
        """;

    @Transactional
    public List<StackChoiceResponse> recommendStack(UUID userId, UUID projectId) {
        Project project = getProjectAndValidate(userId, projectId);
        User user = project.getUser();

        Blueprint blueprint = blueprintRepository.findTopByProjectIdOrderByVersionDesc(projectId)
            .orElseThrow(() -> new BadRequestException("Must generate a Project Blueprint before recommending a tech stack"));

        String blueprintSummary = "";
        try {
            JsonNode bpJson = objectMapper.readTree(blueprint.getContent());
            blueprintSummary = bpJson.path("summary").asText();
        } catch (Exception ignored) {}

        String systemPrompt = promptService.renderGlobalSystem(user.getLevel().name());
        String userPrompt = promptService.render("stack_recommend", Map.of(
            "projectTitle", project.getTitle(),
            "targetPlatform", project.getTargetPlatform().name(),
            "mode", project.getMode().name(),
            "level", user.getLevel().name(),
            "blueprintSummary", blueprintSummary
        ));

        StackRecommendAiOutput aiOutput = aiClient.generateStructuredOutput(
            "stack_recommend",
            systemPrompt,
            userPrompt,
            StackRecommendAiOutput.class,
            userId,
            "stack_recommend_schema",
            STACK_SCHEMA
        );

        stackChoiceRepository.deleteAllByProjectId(projectId);

        if (aiOutput.layers() != null) {
            for (StackRecommendAiOutput.StackLayerItem item : aiOutput.layers()) {
                String altsJson;
                try {
                    altsJson = objectMapper.writeValueAsString(item.alternatives() != null ? item.alternatives() : List.of());
                } catch (Exception e) {
                    altsJson = "[]";
                }

                StackChoice choice = StackChoice.builder()
                    .project(project)
                    .layer(item.layer())
                    .recommended(item.recommended())
                    .alternatives(altsJson)
                    .reasoning(item.why() + " | Trade-offs: " + item.tradeoffs())
                    .userChoice(item.recommended())
                    .build();

                stackChoiceRepository.save(choice);
            }
        }

        return getProjectStack(userId, projectId);
    }

    @Transactional
    public List<StackChoiceResponse> getProjectStack(UUID userId, UUID projectId) {
        getProjectAndValidate(userId, projectId);
        List<StackChoice> choices = stackChoiceRepository.findAllByProjectIdOrderByCreatedAtAsc(projectId);
        if (choices.isEmpty()) {
            return recommendStack(userId, projectId);
        }
        return choices.stream().map(c -> StackChoiceResponse.fromEntity(c, objectMapper)).toList();
    }

    @Transactional
    public StackChoiceResponse updateUserChoice(UUID userId, UUID choiceId, String userChoice) {
        StackChoice choice = stackChoiceRepository.findById(choiceId)
            .orElseThrow(() -> new ResourceNotFoundException("Stack choice not found with id: " + choiceId));

        if (!choice.getProject().getUser().getId().equals(userId)) {
            throw new UnauthorizedException("You do not have permission to modify this stack choice");
        }

        choice.setUserChoice(userChoice.trim());
        choice = stackChoiceRepository.save(choice);

        // Flow D: Swap decision regenerates architecture, keeping new version
        try {
            architectureService.generateArchitecture(userId, choice.getProject().getId());
        } catch (Exception e) {
            log.warn("Architecture regeneration after stack swap skipped or failed: {}", e.getMessage());
        }

        return StackChoiceResponse.fromEntity(choice, objectMapper);
    }

    private Project getProjectAndValidate(UUID userId, UUID projectId) {
        return projectRepository.findByIdAndUserId(projectId, userId)
            .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + projectId));
    }
}
