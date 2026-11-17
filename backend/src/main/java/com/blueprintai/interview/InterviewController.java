package com.blueprintai.interview;

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
@RequestMapping("/api/projects/{projectId}/interview")
@RequiredArgsConstructor
@Tag(name = "Requirements Interview", description = "Endpoints for the guided AI requirements interview")
public class InterviewController {

    private final InterviewService interviewService;

    @GetMapping
    @Operation(summary = "Get all interview turns for a project (initializes opening question if empty)")
    public ResponseEntity<List<InterviewTurnResponse>> getInterviewTurns(
        @AuthenticationPrincipal UserPrincipal principal,
        @PathVariable UUID projectId
    ) {
        List<InterviewTurnResponse> turns = interviewService.getTurns(principal.getId(), projectId);
        return ResponseEntity.ok(turns);
    }

    @PostMapping("/next")
    @Operation(summary = "Submit an answer to the current interview question and receive the next question")
    public ResponseEntity<InterviewNextResponse> submitAnswer(
        @AuthenticationPrincipal UserPrincipal principal,
        @PathVariable UUID projectId,
        @RequestBody(required = false) InterviewNextRequest request
    ) {
        String answer = request != null ? request.answer() : null;
        InterviewNextResponse response = interviewService.nextTurn(principal.getId(), projectId, answer);
        return ResponseEntity.ok(response);
    }
}
