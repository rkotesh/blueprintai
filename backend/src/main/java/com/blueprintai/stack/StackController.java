package com.blueprintai.stack;

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
@RequiredArgsConstructor
@Tag(name = "Tech Stack Advisor", description = "Endpoints for stack recommendations, trade-offs, and choices")
public class StackController {

    private final StackService stackService;

    @PostMapping("/api/projects/{projectId}/stack/recommend")
    @Operation(summary = "Generate tech stack recommendations with reasons, trade-offs, and alternatives")
    public ResponseEntity<List<StackChoiceResponse>> recommendStack(
        @AuthenticationPrincipal UserPrincipal principal,
        @PathVariable UUID projectId
    ) {
        List<StackChoiceResponse> response = stackService.recommendStack(principal.getId(), projectId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/api/projects/{projectId}/stack")
    @Operation(summary = "Get current stack choices (auto-generates recommendations if empty)")
    public ResponseEntity<List<StackChoiceResponse>> getStack(
        @AuthenticationPrincipal UserPrincipal principal,
        @PathVariable UUID projectId
    ) {
        List<StackChoiceResponse> response = stackService.getProjectStack(principal.getId(), projectId);
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/api/stack/{choiceId}")
    @Operation(summary = "Update user choice for a layer (triggers architecture regeneration with version increment)")
    public ResponseEntity<StackChoiceResponse> updateChoice(
        @AuthenticationPrincipal UserPrincipal principal,
        @PathVariable UUID choiceId,
        @Valid @RequestBody UpdateStackChoiceRequest request
    ) {
        StackChoiceResponse response = stackService.updateUserChoice(principal.getId(), choiceId, request.userChoice());
        return ResponseEntity.ok(response);
    }
}
