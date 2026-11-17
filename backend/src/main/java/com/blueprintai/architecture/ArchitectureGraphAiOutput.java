package com.blueprintai.architecture;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

public record ArchitectureGraphAiOutput(
    @JsonProperty("nodes") List<GraphNodeItem> nodes,
    @JsonProperty("edges") List<GraphEdgeItem> edges
) {
    public record GraphNodeItem(
        @JsonProperty("id") String id,
        @JsonProperty("label") String label,
        @JsonProperty("layer") String layer,
        @JsonProperty("description") String description,
        @JsonProperty("tech") String tech
    ) {}

    public record GraphEdgeItem(
        @JsonProperty("from") String from,
        @JsonProperty("to") String to,
        @JsonProperty("label") String label,
        @JsonProperty("protocol") String protocol
    ) {}
}
