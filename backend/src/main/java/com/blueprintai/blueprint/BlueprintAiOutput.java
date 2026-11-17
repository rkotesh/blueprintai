package com.blueprintai.blueprint;

import com.blueprintai.feature.FeaturePriority;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

public record BlueprintAiOutput(
    @JsonProperty("summary") String summary,
    @JsonProperty("users") List<String> users,
    @JsonProperty("features") List<BlueprintFeatureItem> features,
    @JsonProperty("user_flows") List<String> userFlows,
    @JsonProperty("data_model") List<BlueprintDataModelItem> dataModel
) {
    public record BlueprintFeatureItem(
        @JsonProperty("name") String name,
        @JsonProperty("description") String description,
        @JsonProperty("priority") FeaturePriority priority,
        @JsonProperty("screens") List<String> screens,
        @JsonProperty("data_entities") List<String> dataEntities,
        @JsonProperty("logic_notes") String logicNotes
    ) {}

    public record BlueprintDataModelItem(
        @JsonProperty("entity") String entity,
        @JsonProperty("fields") List<String> fields,
        @JsonProperty("relations") List<String> relations
    ) {}
}
