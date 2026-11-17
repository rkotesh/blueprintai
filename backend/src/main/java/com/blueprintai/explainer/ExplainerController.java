package com.blueprintai.explainer;

import com.blueprintai.security.UserPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@Tag(name = "Code Explainer", description = "Endpoints for layer-by-layer code explanations and SSE streaming")
public class ExplainerController {

    private final ExplainerService explainerService;

    @PostMapping("/projects/{projectId}/explain")
    @Operation(summary = "Explain a code snippet across 3 tiers (Analogy, Plain English, Technical)")
    public ResponseEntity<CodeExplanationResponse> explainCode(
        @PathVariable UUID projectId,
        @AuthenticationPrincipal UserPrincipal currentUser,
        @Valid @RequestBody ExplainCodeRequest request
    ) {
        return ResponseEntity.ok(explainerService.explainCode(projectId, currentUser.getId(), request));
    }

    @GetMapping("/projects/{projectId}/explain")
    @Operation(summary = "Get historical code explanations for a project")
    public ResponseEntity<List<CodeExplanationResponse>> getExplanations(
        @PathVariable UUID projectId,
        @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        return ResponseEntity.ok(explainerService.getExplanations(projectId, currentUser.getId()));
    }

    @PostMapping(value = "/projects/{projectId}/explain/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    @Operation(summary = "Stream a code explanation token-by-token using Server-Sent Events (SSE)")
    public SseEmitter streamExplanation(
        @PathVariable UUID projectId,
        @AuthenticationPrincipal UserPrincipal currentUser,
        @Valid @RequestBody ExplainCodeRequest request
    ) {
        return explainerService.streamExplanation(projectId, currentUser.getId(), request);
    }
}
