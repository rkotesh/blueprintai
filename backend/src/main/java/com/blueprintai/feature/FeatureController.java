package com.blueprintai.feature;

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
@RequiredArgsConstructor
@Tag(name = "Features", description = "Endpoints for project feature management and deep analysis")
public class FeatureController {

    private final FeatureService featureService;

    @GetMapping("/api/projects/{projectId}/features")
    @Operation(summary = "Get all normalized features for a project")
    public ResponseEntity<List<FeatureResponse>> getFeatures(
        @AuthenticationPrincipal UserPrincipal principal,
        @PathVariable UUID projectId
    ) {
        List<FeatureResponse> features = featureService.getProjectFeatures(principal.getId(), projectId);
        return ResponseEntity.ok(features);
    }

    @PatchMapping("/api/features/{featureId}")
    @Operation(summary = "Update feature priority (MVP/LATER), status, or notes")
    public ResponseEntity<FeatureResponse> updateFeature(
        @AuthenticationPrincipal UserPrincipal principal,
        @PathVariable UUID featureId,
        @RequestBody UpdateFeatureRequest request
    ) {
        FeatureResponse response = featureService.updateFeature(principal.getId(), featureId, request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/api/projects/{projectId}/features/{featureId}/analyze")
    @Operation(summary = "Run deep architectural breakdown of a feature (screens, data, edge cases, security)")
    public ResponseEntity<FeatureAnalysisResponse> analyzeFeature(
        @AuthenticationPrincipal UserPrincipal principal,
        @PathVariable UUID projectId,
        @PathVariable UUID featureId
    ) {
        FeatureAnalysisResponse response = featureService.analyzeFeature(principal.getId(), projectId, featureId);
        return ResponseEntity.ok(response);
    }
}
