package com.blueprintai.blueprint;

import com.blueprintai.security.UserPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/projects/{projectId}/blueprint")
@RequiredArgsConstructor
@Tag(name = "Project Blueprint", description = "Endpoints for blueprint generation and retrieval")
public class BlueprintController {

    private final BlueprintService blueprintService;

    @PostMapping("/generate")
    @Operation(summary = "Generate a full project blueprint from the requirements interview")
    public ResponseEntity<BlueprintResponse> generateBlueprint(
        @AuthenticationPrincipal UserPrincipal principal,
        @PathVariable UUID projectId
    ) {
        BlueprintResponse response = blueprintService.generateBlueprint(principal.getId(), projectId);
        return ResponseEntity.ok(response);
    }

    @GetMapping
    @Operation(summary = "Get the latest blueprint for a project")
    public ResponseEntity<BlueprintResponse> getLatestBlueprint(
        @AuthenticationPrincipal UserPrincipal principal,
        @PathVariable UUID projectId
    ) {
        BlueprintResponse response = blueprintService.getLatestBlueprint(principal.getId(), projectId);
        return ResponseEntity.ok(response);
    }
}
