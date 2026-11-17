package com.blueprintai.milestone;

import com.blueprintai.ai.AiClient;
import com.blueprintai.ai.PromptService;
import com.blueprintai.architecture.ArchitectureGraph;
import com.blueprintai.architecture.ArchitectureGraphRepository;
import com.blueprintai.blueprint.Blueprint;
import com.blueprintai.blueprint.BlueprintRepository;
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
public class MilestoneService {

    private final ProjectRepository projectRepository;
    private final MilestoneRepository milestoneRepository;
    private final BlueprintRepository blueprintRepository;
    private final ArchitectureGraphRepository architectureGraphRepository;
    private final StackChoiceRepository stackChoiceRepository;
    private final AiClient aiClient;
    private final PromptService promptService;
    private final ObjectMapper objectMapper;

    private static final String MILESTONE_SCHEMA = """
        {
          "type": "object",
          "properties": {
            "milestones": {
              "type": "array",
              "items": {
                "type": "object",
                "properties": {
                  "order_index": { "type": "integer" },
                  "title": { "type": "string" },
                  "description": { "type": "string" },
                  "concepts": { "type": "array", "items": { "type": "string" } },
                  "validation_checklist": { "type": "array", "items": { "type": "string" } }
                },
                "required": ["order_index", "title", "description", "concepts", "validation_checklist"],
                "additionalProperties": false
              }
            }
          },
          "required": ["milestones"],
          "additionalProperties": false
        }
        """;

    @Transactional(readOnly = true)
    public List<MilestoneResponse> getMilestones(UUID projectId, UUID userId) {
        getProjectForUser(projectId, userId);
        return milestoneRepository.findByProjectIdOrderByOrderIndexAsc(projectId).stream()
            .map(MilestoneResponse::fromEntity)
            .toList();
    }

    @Transactional
    public List<MilestoneResponse> generateMilestones(UUID projectId, UUID userId) {
        Project project = getProjectForUser(projectId, userId);

        String blueprintContext = "No blueprint generated yet.";
        Optional<Blueprint> bpOpt = blueprintRepository.findTopByProjectIdOrderByVersionDesc(projectId);
        if (bpOpt.isPresent()) {
            try {
                blueprintContext = objectMapper.writeValueAsString(bpOpt.get().getContent());
            } catch (Exception ignored) {}
        }

        String archContext = "Standard full-stack web architecture.";
        Optional<ArchitectureGraph> archOpt = architectureGraphRepository.findTopByProjectIdOrderByVersionDesc(projectId);
        if (archOpt.isPresent()) {
            try {
                archContext = "Nodes: " + objectMapper.writeValueAsString(archOpt.get().getNodes())
                    + ", Edges: " + objectMapper.writeValueAsString(archOpt.get().getEdges());
            } catch (Exception ignored) {}
        }

        String stackContext = "Default tech stack.";
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
            "platform", project.getTargetPlatform().name(),
            "blueprint", blueprintContext,
            "architecture", archContext,
            "stack", stackContext
        );

        String userPrompt = promptService.render("milestones_generate.txt", variables);
        String systemPrompt = "You are a software architect that creates clear, achievable milestones for app builders.";

        MilestoneGenerateAiOutput aiOutput = aiClient.generateStructuredOutput(
            "milestones_generate",
            systemPrompt,
            userPrompt,
            MilestoneGenerateAiOutput.class,
            userId,
            "milestones_generate_response",
            MILESTONE_SCHEMA
        );

        // Replace existing milestones with freshly generated
        milestoneRepository.deleteByProjectId(projectId);

        List<Milestone> savedList = new ArrayList<>();
        int index = 1;
        for (MilestoneGenerateAiOutput.MilestoneItemAiOutput item : aiOutput.milestones()) {
            Milestone milestone = Milestone.builder()
                .project(project)
                .orderIndex(item.order_index() > 0 ? item.order_index() : index)
                .title(item.title())
                .description(item.description())
                .concepts(item.concepts() != null ? item.concepts() : List.of())
                .status(index == 1 ? MilestoneStatus.IN_PROGRESS : MilestoneStatus.TODO)
                .build();
            savedList.add(milestoneRepository.save(milestone));
            index++;
        }

        return savedList.stream().map(MilestoneResponse::fromEntity).toList();
    }

    @Transactional
    public MilestoneResponse updateMilestone(UUID milestoneId, UUID userId, UpdateMilestoneRequest request) {
        Milestone milestone = milestoneRepository.findById(milestoneId)
            .orElseThrow(() -> new ResourceNotFoundException("Milestone not found with id: " + milestoneId));

        getProjectForUser(milestone.getProject().getId(), userId);

        if (request.status() != null) {
            milestone.setStatus(request.status());
        }
        if (request.title() != null && !request.title().isBlank()) {
            milestone.setTitle(request.title());
        }
        if (request.description() != null && !request.description().isBlank()) {
            milestone.setDescription(request.description());
        }

        return MilestoneResponse.fromEntity(milestoneRepository.save(milestone));
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
