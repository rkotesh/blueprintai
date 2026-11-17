package com.blueprintai.stack;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

public record StackRecommendAiOutput(
    @JsonProperty("layers") List<StackLayerItem> layers
) {
    public record StackLayerItem(
        @JsonProperty("layer") String layer,
        @JsonProperty("recommended") String recommended,
        @JsonProperty("why") String why,
        @JsonProperty("tradeoffs") String tradeoffs,
        @JsonProperty("alternatives") List<StackAlternativeItem> alternatives
    ) {}

    public record StackAlternativeItem(
        @JsonProperty("name") String name,
        @JsonProperty("when_better") String whenBetter
    ) {}
}
