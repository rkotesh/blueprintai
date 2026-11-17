package com.blueprintai.architecture;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

public record TraceResponse(
    @JsonProperty("steps") List<TraceStepItem> steps
) {
    public record TraceStepItem(
        @JsonProperty("order") int order,
        @JsonProperty("node_id") String nodeId,
        @JsonProperty("edge_id") String edgeId,
        @JsonProperty("analogy") String analogy,
        @JsonProperty("plain_explanation") String plainExplanation,
        @JsonProperty("technical_detail") String technicalDetail
    ) {}
}
