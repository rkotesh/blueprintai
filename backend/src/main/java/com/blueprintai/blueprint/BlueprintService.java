package com.blueprintai.blueprint;

import com.blueprintai.ai.AiClient;
import com.blueprintai.ai.PromptService;
import com.blueprintai.common.BadRequestException;
import com.blueprintai.common.ResourceNotFoundException;
import com.blueprintai.feature.Feature;
import com.blueprintai.feature.FeaturePriority;
import com.blueprintai.feature.FeatureRepository;
import com.blueprintai.feature.FeatureStatus;
import com.blueprintai.interview.InterviewTurn;
import com.blueprintai.interview.InterviewTurnRepository;
import com.blueprintai.project.Project;
import com.blueprintai.project.ProjectRepository;
import com.blueprintai.user.User;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class BlueprintService {

    private final ProjectRepository projectRepository;
    private final InterviewTurnRepository turnRepository;
    private final BlueprintRepository blueprintRepository;
    private final FeatureRepository featureRepository;
    private final AiClient aiClient;
    private final PromptService promptService;
    private final ObjectMapper objectMapper;

    private static final String BLUEPRINT_SCHEMA = """
        {
          "type": "object",
          "properties": {
            "summary": { "type": "string" },
            "users": {
              "type": "array",
              "items": { "type": "string" }
            },
            "features": {
              "type": "array",
              "items": {
                "type": "object",
                "properties": {
                  "name": { "type": "string" },
                  "description": { "type": "string" },
                  "priority": { "type": "string", "enum": ["MVP", "LATER"] },
                  "screens": { "type": "array", "items": { "type": "string" } },
                  "data_entities": { "type": "array", "items": { "type": "string" } },
                  "logic_notes": { "type": "string" }
                },
                "required": ["name", "description", "priority", "screens", "data_entities", "logic_notes"],
                "additionalProperties": false
              }
            },
            "user_flows": {
              "type": "array",
              "items": { "type": "string" }
            },
            "data_model": {
              "type": "array",
              "items": {
                "type": "object",
                "properties": {
                  "entity": { "type": "string" },
                  "fields": { "type": "array", "items": { "type": "string" } },
                  "relations": { "type": "array", "items": { "type": "string" } }
                },
                "required": ["entity", "fields", "relations"],
                "additionalProperties": false
              }
            }
          },
          "required": ["summary", "users", "features", "user_flows", "data_model"],
          "additionalProperties": false
        }
        """;

    @Transactional
    public BlueprintResponse generateBlueprint(UUID userId, UUID projectId) {
        Project project = getProjectAndValidate(userId, projectId);
        User user = project.getUser();

        List<InterviewTurn> turns = turnRepository.findAllByProjectIdOrderByTurnIndexAsc(projectId);
        if (turns.isEmpty()) {
            throw new BadRequestException("Cannot generate blueprint before conducting requirements interview");
        }

        StringBuilder turnsText = new StringBuilder();
        for (InterviewTurn turn : turns) {
            turnsText.append(turn.getRole().name()).append(": ").append(turn.getContent()).append("\n");
        }

        String systemPrompt = promptService.renderGlobalSystem(user.getLevel().name());
        String userPrompt = promptService.render("blueprint_generate", Map.of(
            "projectTitle", project.getTitle(),
            "targetPlatform", project.getTargetPlatform().name(),
            "mode", project.getMode().name(),
            "level", user.getLevel().name(),
            "ideaText", project.getIdeaText(),
            "interviewTurns", turnsText.toString()
        ));

        BlueprintAiOutput aiOutput = aiClient.generateStructuredOutput(
            "blueprint_generate",
            systemPrompt,
            userPrompt,
            BlueprintAiOutput.class,
            userId,
            "blueprint_schema",
            BLUEPRINT_SCHEMA
        );

        int nextVersion = blueprintRepository.findTopByProjectIdOrderByVersionDesc(projectId)
            .map(b -> b.getVersion() + 1)
            .orElse(1);

        String rawJson;
        try {
            rawJson = objectMapper.writeValueAsString(aiOutput);
        } catch (Exception e) {
            throw new RuntimeException("Failed to serialize blueprint output to JSON", e);
        }

        Blueprint blueprint = Blueprint.builder()
            .project(project)
            .version(nextVersion)
            .content(rawJson)
            .build();
        blueprint = blueprintRepository.save(blueprint);

        // Normalize features into relational table
        featureRepository.deleteAllByProjectId(projectId);
        if (aiOutput.features() != null) {
            for (BlueprintAiOutput.BlueprintFeatureItem item : aiOutput.features()) {
                String screensJson;
                String dataEntitiesJson;
                try {
                    screensJson = objectMapper.writeValueAsString(item.screens() != null ? item.screens() : List.of());
                    dataEntitiesJson = objectMapper.writeValueAsString(item.dataEntities() != null ? item.dataEntities() : List.of());
                } catch (Exception e) {
                    screensJson = "[]";
                    dataEntitiesJson = "[]";
                }

                Feature feature = Feature.builder()
                    .project(project)
                    .name(item.name())
                    .description(item.description())
                    .priority(item.priority() != null ? item.priority() : FeaturePriority.MVP)
                    .screens(screensJson)
                    .dataEntities(dataEntitiesJson)
                    .logicNotes(item.logicNotes())
                    .status(FeatureStatus.TODO)
                    .build();

                featureRepository.save(feature);
            }
        }

        return BlueprintResponse.fromEntity(blueprint, objectMapper);
    }

    @Transactional(readOnly = true)
    public BlueprintResponse getLatestBlueprint(UUID userId, UUID projectId) {
        getProjectAndValidate(userId, projectId);
        Blueprint blueprint = blueprintRepository.findTopByProjectIdOrderByVersionDesc(projectId)
            .orElseThrow(() -> new ResourceNotFoundException("No blueprint generated yet for project: " + projectId));
        return BlueprintResponse.fromEntity(blueprint, objectMapper);
    }

    private Project getProjectAndValidate(UUID userId, UUID projectId) {
        return projectRepository.findByIdAndUserId(projectId, userId)
            .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + projectId));
    }
}
