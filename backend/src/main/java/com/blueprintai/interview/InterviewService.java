package com.blueprintai.interview;

import com.blueprintai.ai.AiClient;
import com.blueprintai.ai.PromptService;
import com.blueprintai.common.ResourceNotFoundException;
import com.blueprintai.project.Project;
import com.blueprintai.project.ProjectRepository;
import com.blueprintai.user.User;
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
public class InterviewService {

    private final ProjectRepository projectRepository;
    private final InterviewTurnRepository turnRepository;
    private final AiClient aiClient;
    private final PromptService promptService;

    private static final String INTERVIEW_SCHEMA = """
        {
          "type": "object",
          "properties": {
            "question": { "type": "string" },
            "why_asking": { "type": "string" },
            "done": { "type": "boolean" }
          },
          "required": ["question", "why_asking", "done"],
          "additionalProperties": false
        }
        """;

    @Transactional
    public List<InterviewTurnResponse> getTurns(UUID userId, UUID projectId) {
        Project project = getProjectAndValidate(userId, projectId);
        List<InterviewTurn> turns = turnRepository.findAllByProjectIdOrderByTurnIndexAsc(projectId);

        if (turns.isEmpty()) {
            // Generate initial opening question
            InterviewNextResponse initial = nextTurn(userId, projectId, null);
            turns = turnRepository.findAllByProjectIdOrderByTurnIndexAsc(projectId);
        }

        return turns.stream().map(InterviewTurnResponse::fromEntity).toList();
    }

    @Transactional
    public InterviewNextResponse nextTurn(UUID userId, UUID projectId, String answer) {
        Project project = getProjectAndValidate(userId, projectId);
        User user = project.getUser();
        List<InterviewTurn> existingTurns = turnRepository.findAllByProjectIdOrderByTurnIndexAsc(projectId);

        int nextIndex = existingTurns.size();

        // 1. If user supplied an answer, save it as a turn
        if (answer != null && !answer.trim().isBlank()) {
            InterviewTurn userTurn = InterviewTurn.builder()
                .project(project)
                .role(InterviewRole.USER)
                .content(answer.trim())
                .turnIndex(nextIndex++)
                .build();
            turnRepository.save(userTurn);
            existingTurns.add(userTurn);
        }

        // 2. Build history text
        StringBuilder historyBuilder = new StringBuilder();
        int userTurnCount = 0;
        for (InterviewTurn turn : existingTurns) {
            historyBuilder.append(turn.getRole().name()).append(": ").append(turn.getContent()).append("\n");
            if (turn.getRole() == InterviewRole.USER) {
                userTurnCount++;
            }
        }

        // 3. Render prompt
        String systemPrompt = promptService.renderGlobalSystem(user.getLevel().name());
        String userPrompt = promptService.render("interview_next", Map.of(
            "projectTitle", project.getTitle(),
            "targetPlatform", project.getTargetPlatform().name(),
            "mode", project.getMode().name(),
            "level", user.getLevel().name(),
            "ideaText", project.getIdeaText(),
            "turnCount", String.valueOf(userTurnCount),
            "history", historyBuilder.length() > 0 ? historyBuilder.toString() : "(No turns yet - opening question)"
        ));

        // 4. Call AI Client
        InterviewAiResponse aiResponse = aiClient.generateStructuredOutput(
            "interview_next",
            systemPrompt,
            userPrompt,
            InterviewAiResponse.class,
            userId,
            "interview_next",
            INTERVIEW_SCHEMA
        );

        // 5. Save AI's response turn
        String aiContent = aiResponse.question();
        if (aiResponse.whyAsking() != null && !aiResponse.whyAsking().isBlank()) {
            aiContent += " [Why: " + aiResponse.whyAsking() + "]";
        }

        InterviewTurn aiTurn = InterviewTurn.builder()
            .project(project)
            .role(InterviewRole.AI)
            .content(aiContent)
            .turnIndex(nextIndex)
            .build();
        turnRepository.save(aiTurn);

        return new InterviewNextResponse(
            aiResponse.question(),
            aiResponse.whyAsking(),
            aiResponse.done(),
            nextIndex
        );
    }

    private Project getProjectAndValidate(UUID userId, UUID projectId) {
        return projectRepository.findByIdAndUserId(projectId, userId)
            .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + projectId));
    }
}
