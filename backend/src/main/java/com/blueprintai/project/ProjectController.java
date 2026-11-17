package com.blueprintai.project;

import com.blueprintai.security.UserPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/projects")
@RequiredArgsConstructor
@Tag(name = "Projects", description = "Endpoints for project management")
public class ProjectController {

    private final ProjectService projectService;

    @PostMapping
    @Operation(summary = "Create a new project from idea and mode")
    public ResponseEntity<ProjectResponse> createProject(
        @AuthenticationPrincipal UserPrincipal principal,
        @Valid @RequestBody CreateProjectRequest request
    ) {
        ProjectResponse response = projectService.createProject(principal.getId(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    @Operation(summary = "List all projects owned by the authenticated user")
    public ResponseEntity<List<ProjectResponse>> getProjects(
        @AuthenticationPrincipal UserPrincipal principal
    ) {
        List<ProjectResponse> response = projectService.getUserProjects(principal.getId());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get project details by ID")
    public ResponseEntity<ProjectResponse> getProject(
        @AuthenticationPrincipal UserPrincipal principal,
        @PathVariable UUID id
    ) {
        ProjectResponse response = projectService.getProject(principal.getId(), id);
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{id}")
    @Operation(summary = "Update an existing project's title, idea, mode, or status")
    public ResponseEntity<ProjectResponse> updateProject(
        @AuthenticationPrincipal UserPrincipal principal,
        @PathVariable UUID id,
        @RequestBody UpdateProjectRequest request
    ) {
        ProjectResponse response = projectService.updateProject(principal.getId(), id, request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a project and cascade delete all its resources")
    public ResponseEntity<Void> deleteProject(
        @AuthenticationPrincipal UserPrincipal principal,
        @PathVariable UUID id
    ) {
        projectService.deleteProject(principal.getId(), id);
        return ResponseEntity.noContent().build();
    }
}
