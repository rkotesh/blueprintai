package com.blueprintai.feature;

import com.blueprintai.ai.AiClient;
import com.blueprintai.ai.PromptService;
import com.blueprintai.common.ResourceNotFoundException;
import com.blueprintai.common.UnauthorizedException;
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
public class FeatureService {

    private final FeatureRepository featureRepository;
    private final ProjectRepository projectRepository;
    private final AiClient aiClient;
    private final PromptService promptService;
    private final ObjectMapper objectMapper;

    private static final String FEATURE_ANALYSIS_SCHEMA = """
        {
          "type": "object",
          "properties": {
            "screens": { "type": "array", "items": { "type": "string" } },
            "data_needed": { "type": "array", "items": { "type": "string" } },
            "api_calls": { "type": "array", "items": { "type": "string" } },
            "edge_cases": { "type": "array", "items": { "type": "string" } },
            "security_notes": { "type": "array", "items": { "type": "string" } },
            "steps_to_build": { "type": "array", "items": { "type": "string" } }
          },
          "required": ["screens", "data_needed", "api_calls", "edge_cases", "security_notes", "steps_to_build"],
          "additionalProperties": false
        }
        """;

    @Transactional(readOnly = true)
    public List<FeatureResponse> getProjectFeatures(UUID userId, UUID projectId) {
        validateProjectOwnership(userId, projectId);
        return featureRepository.findAllByProjectIdOrderByCreatedAtAsc(projectId)
            .stream()
            .map(f -> FeatureResponse.fromEntity(f, objectMapper))
            .toList();
    }

    @Transactional
    public FeatureResponse updateFeature(UUID userId, UUID featureId, UpdateFeatureRequest request) {
        Feature feature = featureRepository.findById(featureId)
            .orElseThrow(() -> new ResourceNotFoundException("Feature not found with id: " + featureId));

        if (!feature.getProject().getUser().getId().equals(userId)) {
            throw new UnauthorizedException("You do not have access to this feature");
        }

        if (request.name() != null && !request.name().isBlank()) {
            feature.setName(request.name().trim());
        }
        if (request.description() != null && !request.description().isBlank()) {
            feature.setDescription(request.description().trim());
        }
        if (request.priority() != null) {
            feature.setPriority(request.priority());
        }
        if (request.logicNotes() != null) {
            feature.setLogicNotes(request.logicNotes().trim());
        }
        if (request.status() != null) {
            feature.setStatus(request.status());
        }
        if (request.screens() != null) {
            try {
                feature.setScreens(objectMapper.writeValueAsString(request.screens()));
            } catch (Exception ignored) {}
        }
        if (request.dataEntities() != null) {
            try {
                feature.setDataEntities(objectMapper.writeValueAsString(request.dataEntities()));
            } catch (Exception ignored) {}
        }

        feature = featureRepository.save(feature);
        return FeatureResponse.fromEntity(feature, objectMapper);
    }

    @Transactional(readOnly = true)
    public FeatureAnalysisResponse analyzeFeature(UUID userId, UUID projectId, UUID featureId) {
        Project project = validateProjectOwnership(userId, projectId);
        User user = project.getUser();

        Feature feature = featureRepository.findByIdAndProjectId(featureId, projectId)
            .orElseThrow(() -> new ResourceNotFoundException("Feature not found with id: " + featureId));

        String systemPrompt = promptService.renderGlobalSystem(user.getLevel().name());
        String userPrompt = promptService.render("feature_analyze", Map.of(
            "projectTitle", project.getTitle(),
            "featureName", feature.getName(),
            "featureDescription", feature.getDescription(),
            "priority", feature.getPriority().name(),
            "level", user.getLevel().name()
        ));

        return aiClient.generateStructuredOutput(
            "feature_analyze",
            systemPrompt,
            userPrompt,
            FeatureAnalysisResponse.class,
            userId,
            "feature_analysis_schema",
            FEATURE_ANALYSIS_SCHEMA
        );
    }

    private Project validateProjectOwnership(UUID userId, UUID projectId) {
        return projectRepository.findByIdAndUserId(projectId, userId)
            .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + projectId));
    }
}
