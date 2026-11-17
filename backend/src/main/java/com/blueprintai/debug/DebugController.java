package com.blueprintai.debug;

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
@Tag(name = "Debug Guide", description = "Endpoints for diagnosing errors, identifying affected layer, and providing fix steps")
public class DebugController {

    private final DebugService debugService;

    @PostMapping("/projects/{projectId}/debug")
    @Operation(summary = "Diagnose an error or stack trace to identify the affected layer and fix checklist")
    public ResponseEntity<DebugSessionResponse> diagnoseError(
        @PathVariable UUID projectId,
        @AuthenticationPrincipal UserPrincipal currentUser,
        @Valid @RequestBody DebugRequest request
    ) {
        return ResponseEntity.ok(debugService.diagnoseError(projectId, currentUser.getId(), request));
    }

    @GetMapping("/projects/{projectId}/debug")
    @Operation(summary = "Get historical debug sessions for a project")
    public ResponseEntity<List<DebugSessionResponse>> getDebugHistory(
        @PathVariable UUID projectId,
        @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        return ResponseEntity.ok(debugService.getDebugHistory(projectId, currentUser.getId()));
    }
}
