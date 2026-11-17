package com.blueprintai.learning;

import com.blueprintai.security.UserPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@Tag(name = "Learning Layer", description = "Endpoints for glossary terms, concept mastery, and interactive quizzes")
public class LearningController {

    private final LearningService learningService;

    @GetMapping("/projects/{projectId}/learning/glossary")
    @Operation(summary = "Get glossary terms for a project with analogies")
    public ResponseEntity<List<GlossaryTermResponse>> getGlossary(
        @PathVariable UUID projectId
    ) {
        return ResponseEntity.ok(learningService.getGlossary(projectId));
    }

    @GetMapping("/learning/concepts")
    @Operation(summary = "Get all core computer science concepts with user mastery progress")
    public ResponseEntity<List<ConceptResponse>> getConcepts(
        @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        return ResponseEntity.ok(learningService.getConcepts(currentUser.getId()));
    }

    @PostMapping("/learning/concepts/{slug}/progress")
    @Operation(summary = "Update mastery status of a concept (SEEN, UNDERSTOOD)")
    public ResponseEntity<ConceptResponse> updateConceptProgress(
        @PathVariable String slug,
        @RequestParam(defaultValue = "UNDERSTOOD") String status,
        @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        return ResponseEntity.ok(learningService.updateConceptProgress(currentUser.getId(), slug, status));
    }

    @PostMapping("/projects/{projectId}/learning/quiz")
    @Operation(summary = "Generate an interactive multiple-choice quiz for a project or milestone")
    public ResponseEntity<QuizResponse> generateQuiz(
        @PathVariable UUID projectId,
        @RequestParam(required = false) UUID milestoneId,
        @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        return ResponseEntity.ok(learningService.generateQuiz(projectId, currentUser.getId(), milestoneId));
    }

    @PostMapping("/quizzes/{quizId}/attempt")
    @Operation(summary = "Submit answers for a quiz attempt and receive immediate scored feedback")
    public ResponseEntity<QuizAttemptResponse> submitQuizAttempt(
        @PathVariable UUID quizId,
        @RequestBody SubmitQuizAttemptRequest request,
        @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        return ResponseEntity.ok(learningService.submitQuizAttempt(quizId, currentUser.getId(), request.answers()));
    }
}
