package com.blueprintai.architecture;

import com.blueprintai.ai.AiClient;
import com.blueprintai.ai.PromptService;
import com.blueprintai.blueprint.Blueprint;
import com.blueprintai.blueprint.BlueprintRepository;
import com.blueprintai.common.BadRequestException;
import com.blueprintai.common.ResourceNotFoundException;
import com.blueprintai.feature.Feature;
import com.blueprintai.feature.FeatureRepository;
import com.blueprintai.project.Project;
import com.blueprintai.project.ProjectRepository;
import com.blueprintai.stack.StackChoice;
import com.blueprintai.stack.StackChoiceRepository;
import com.blueprintai.user.User;
import com.fasterxml.jackson.databind.JsonNode;
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
public class ArchitectureService {

    private final ProjectRepository projectRepository;
    private final BlueprintRepository blueprintRepository;
    private final FeatureRepository featureRepository;
    private final StackChoiceRepository stackChoiceRepository;
    private final ArchitectureGraphRepository graphRepository;
    private final AiClient aiClient;
    private final PromptService promptService;
    private final ObjectMapper objectMapper;

    private static final String ARCHITECTURE_SCHEMA = """
        {
          "type": "object",
          "properties": {
            "nodes": {
              "type": "array",
              "items": {
                "type": "object",
                "properties": {
                  "id": { "type": "string" },
                  "label": { "type": "string" },
                  "layer": { "type": "string", "enum": ["FRONTEND", "BACKEND", "DATABASE", "EXTERNAL", "AUTH"] },
                  "description": { "type": "string" },
                  "tech": { "type": "string" }
                },
                "required": ["id", "label", "layer", "description", "tech"],
                "additionalProperties": false
              }
            },
            "edges": {
              "type": "array",
              "items": {
                "type": "object",
                "properties": {
                  "from": { "type": "string" },
                  "to": { "type": "string" },
                  "label": { "type": "string" },
                  "protocol": { "type": "string" }
                },
                "required": ["from", "to", "label", "protocol"],
                "additionalProperties": false
              }
            }
          },
          "required": ["nodes", "edges"],
          "additionalProperties": false
        }
        """;

    private static final String TRACE_SCHEMA = """
        {
          "type": "object",
          "properties": {
            "steps": {
              "type": "array",
              "items": {
                "type": "object",
                "properties": {
                  "order": { "type": "integer" },
                  "node_id": { "type": "string" },
                  "edge_id": { "type": "string" },
                  "analogy": { "type": "string" },
                  "plain_explanation": { "type": "string" },
                  "technical_detail": { "type": "string" }
                },
                "required": ["order", "node_id", "edge_id", "analogy", "plain_explanation", "technical_detail"],
                "additionalProperties": false
              }
            }
          },
          "required": ["steps"],
          "additionalProperties": false
        }
        """;

    @Transactional
    public ArchitectureGraphResponse generateArchitecture(UUID userId, UUID projectId) {
        Project project = getProjectAndValidate(userId, projectId);
        User user = project.getUser();

        Blueprint blueprint = blueprintRepository.findTopByProjectIdOrderByVersionDesc(projectId)
            .orElseThrow(() -> new BadRequestException("Must generate a Project Blueprint before generating architecture"));

        List<Feature> features = featureRepository.findAllByProjectIdOrderByCreatedAtAsc(projectId);
        List<StackChoice> stackChoices = stackChoiceRepository.findAllByProjectIdOrderByCreatedAtAsc(projectId);

        StringBuilder featuresBuilder = new StringBuilder();
        for (Feature f : features) {
            featuresBuilder.append("- ").append(f.getName()).append(" (").append(f.getPriority()).append("): ")
                .append(f.getDescription()).append("\n");
        }

        StringBuilder stackBuilder = new StringBuilder();
        for (StackChoice s : stackChoices) {
            String choice = s.getUserChoice() != null ? s.getUserChoice() : s.getRecommended();
            stackBuilder.append("- ").append(s.getLayer()).append(": ").append(choice).append("\n");
        }

        String blueprintSummary = "";
        try {
            JsonNode bpJson = objectMapper.readTree(blueprint.getContent());
            blueprintSummary = bpJson.path("summary").asText();
        } catch (Exception ignored) {}

        String systemPrompt = promptService.renderGlobalSystem(user.getLevel().name());
        String userPrompt = promptService.render("architecture_generate", Map.of(
            "projectTitle", project.getTitle(),
            "targetPlatform", project.getTargetPlatform().name(),
            "mode", project.getMode().name(),
            "level", user.getLevel().name(),
            "blueprintSummary", blueprintSummary,
            "featuresList", featuresBuilder.length() > 0 ? featuresBuilder.toString() : "Core MVP features",
            "stackChoices", stackBuilder.length() > 0 ? stackBuilder.toString() : "Standard full-stack defaults"
        ));

        ArchitectureGraphAiOutput aiOutput = aiClient.generateStructuredOutput(
            "architecture_generate",
            systemPrompt,
            userPrompt,
            ArchitectureGraphAiOutput.class,
            userId,
            "architecture_schema",
            ARCHITECTURE_SCHEMA
        );

        int nextVersion = graphRepository.findTopByProjectIdOrderByVersionDesc(projectId)
            .map(g -> g.getVersion() + 1)
            .orElse(1);

        String nodesJson;
        String edgesJson;
        try {
            nodesJson = objectMapper.writeValueAsString(aiOutput.nodes());
            edgesJson = objectMapper.writeValueAsString(aiOutput.edges());
        } catch (Exception e) {
            throw new RuntimeException("Failed to serialize architecture graph", e);
        }

        ArchitectureGraph graph = ArchitectureGraph.builder()
            .project(project)
            .version(nextVersion)
            .nodes(nodesJson)
            .edges(edgesJson)
            .build();
        graph = graphRepository.save(graph);

        return ArchitectureGraphResponse.fromEntity(graph, objectMapper);
    }

    @Transactional
    public ArchitectureGraphResponse getLatestGraph(UUID userId, UUID projectId) {
        getProjectAndValidate(userId, projectId);
        return graphRepository.findTopByProjectIdOrderByVersionDesc(projectId)
            .map(g -> ArchitectureGraphResponse.fromEntity(g, objectMapper))
            .orElseGet(() -> generateArchitecture(userId, projectId));
    }

    @Transactional(readOnly = true)
    public TraceResponse traceAction(UUID userId, UUID projectId, TraceRequest request) {
        Project project = getProjectAndValidate(userId, projectId);
        User user = project.getUser();

        ArchitectureGraph graph = graphRepository.findTopByProjectIdOrderByVersionDesc(projectId)
            .orElseThrow(() -> new BadRequestException("Architecture graph must be generated before tracing actions"));

        String actionDescription;
        if (request.action() != null && !request.action().isBlank()) {
            actionDescription = request.action().trim();
        } else if (request.featureId() != null) {
            Feature feature = featureRepository.findByIdAndProjectId(request.featureId(), projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Feature not found"));
            actionDescription = "Feature: " + feature.getName() + " - " + feature.getDescription();
        } else {
            actionDescription = "User executes core application workflow";
        }

        String systemPrompt = promptService.renderGlobalSystem(user.getLevel().name());
        String userPrompt = promptService.render("architecture_trace", Map.of(
            "projectTitle", project.getTitle(),
            "actionToTrace", actionDescription,
            "nodes", graph.getNodes(),
            "edges", graph.getEdges()
        ));

        return aiClient.generateStructuredOutput(
            "architecture_trace",
            systemPrompt,
            userPrompt,
            TraceResponse.class,
            userId,
            "trace_schema",
            TRACE_SCHEMA
        );
    }

    private Project getProjectAndValidate(UUID userId, UUID projectId) {
        return projectRepository.findByIdAndUserId(projectId, userId)
            .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + projectId));
    }
}
