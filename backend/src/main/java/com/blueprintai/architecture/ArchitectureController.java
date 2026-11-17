package com.blueprintai.architecture;

import com.blueprintai.security.UserPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/projects/{projectId}/architecture")
@RequiredArgsConstructor
@Tag(name = "Architecture & Trace", description = "Endpoints for architecture graph topology and animated action tracing")
public class ArchitectureController {

    private final ArchitectureService architectureService;

    @PostMapping("/generate")
    @Operation(summary = "Generate or regenerate architecture graph from blueprint and stack")
    public ResponseEntity<ArchitectureGraphResponse> generateArchitecture(
        @AuthenticationPrincipal UserPrincipal principal,
        @PathVariable UUID projectId
    ) {
        ArchitectureGraphResponse response = architectureService.generateArchitecture(principal.getId(), projectId);
        return ResponseEntity.ok(response);
    }

    @GetMapping
    @Operation(summary = "Get latest architecture graph (auto-generates if not yet created)")
    public ResponseEntity<ArchitectureGraphResponse> getArchitecture(
        @AuthenticationPrincipal UserPrincipal principal,
        @PathVariable UUID projectId
    ) {
        ArchitectureGraphResponse response = architectureService.getLatestGraph(principal.getId(), projectId);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/trace")
    @Operation(summary = "Trace an action or feature end-to-end across architecture nodes")
    public ResponseEntity<TraceResponse> traceAction(
        @AuthenticationPrincipal UserPrincipal principal,
        @PathVariable UUID projectId,
        @RequestBody TraceRequest request
    ) {
        TraceResponse response = architectureService.traceAction(principal.getId(), projectId, request);
        return ResponseEntity.ok(response);
    }
}
