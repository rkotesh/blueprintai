package com.blueprintai.feature;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

public record FeatureAnalysisResponse(
    @JsonProperty("screens") List<String> screens,
    @JsonProperty("data_needed") List<String> dataNeeded,
    @JsonProperty("api_calls") List<String> apiCalls,
    @JsonProperty("edge_cases") List<String> edgeCases,
    @JsonProperty("security_notes") List<String> securityNotes,
    @JsonProperty("steps_to_build") List<String> stepsToBuild
) {}
