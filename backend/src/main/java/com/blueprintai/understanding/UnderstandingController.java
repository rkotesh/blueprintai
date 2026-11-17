package com.blueprintai.understanding;

import com.blueprintai.security.UserPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@Tag(name = "Understanding Check", description = "Endpoints for scoring the user's plain-English mental model of their application")
public class UnderstandingController {

    private final UnderstandingService understandingService;

    @PostMapping("/projects/{projectId}/check")
    @Operation(summary = "Submit user's own explanation of their app and receive scored multi-dimensional feedback")
    public ResponseEntity<UnderstandingCheckResponse> evaluateUnderstanding(
        @PathVariable UUID projectId,
        @AuthenticationPrincipal UserPrincipal currentUser,
        @Valid @RequestBody UnderstandingCheckRequest request
    ) {
        return ResponseEntity.ok(understandingService.evaluateUnderstanding(projectId, currentUser.getId(), request.userSummary()));
    }

    @GetMapping("/projects/{projectId}/check")
    @Operation(summary = "Get historical understanding check evaluations for a project")
    public ResponseEntity<List<UnderstandingCheckResponse>> getHistory(
        @PathVariable UUID projectId,
        @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        return ResponseEntity.ok(understandingService.getHistory(projectId, currentUser.getId()));
    }
}
