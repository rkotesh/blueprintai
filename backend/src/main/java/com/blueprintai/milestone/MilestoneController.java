package com.blueprintai.milestone;

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
@Tag(name = "Milestones", description = "Endpoints for guided milestones and learning roadmaps")
public class MilestoneController {

    private final MilestoneService milestoneService;

    @GetMapping("/projects/{projectId}/milestones")
    @Operation(summary = "Get all milestones for a project")
    public ResponseEntity<List<MilestoneResponse>> getMilestones(
        @PathVariable UUID projectId,
        @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        return ResponseEntity.ok(milestoneService.getMilestones(projectId, currentUser.getId()));
    }

    @PostMapping("/projects/{projectId}/milestones/generate")
    @Operation(summary = "Generate guided build milestones from project blueprint")
    public ResponseEntity<List<MilestoneResponse>> generateMilestones(
        @PathVariable UUID projectId,
        @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        return ResponseEntity.ok(milestoneService.generateMilestones(projectId, currentUser.getId()));
    }

    @PatchMapping("/milestones/{milestoneId}")
    @Operation(summary = "Update milestone status (TODO, IN_PROGRESS, DONE)")
    public ResponseEntity<MilestoneResponse> updateMilestone(
        @PathVariable UUID milestoneId,
        @AuthenticationPrincipal UserPrincipal currentUser,
        @RequestBody UpdateMilestoneRequest request
    ) {
        return ResponseEntity.ok(milestoneService.updateMilestone(milestoneId, currentUser.getId(), request));
    }
}
