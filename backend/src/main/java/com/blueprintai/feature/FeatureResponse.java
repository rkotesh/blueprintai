package com.blueprintai.feature;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record FeatureResponse(
    UUID id,
    UUID projectId,
    String name,
    String description,
    FeaturePriority priority,
    List<String> screens,
    List<String> dataEntities,
    String logicNotes,
    FeatureStatus status,
    Instant createdAt
) {
    public static FeatureResponse fromEntity(Feature feature, ObjectMapper objectMapper) {
        List<String> screensList;
        List<String> dataEntitiesList;
        try {
            screensList = objectMapper.readValue(feature.getScreens(), new TypeReference<List<String>>() {});
        } catch (Exception e) {
            screensList = List.of();
        }
        try {
            dataEntitiesList = objectMapper.readValue(feature.getDataEntities(), new TypeReference<List<String>>() {});
        } catch (Exception e) {
            dataEntitiesList = List.of();
        }

        return new FeatureResponse(
            feature.getId(),
            feature.getProject().getId(),
            feature.getName(),
            feature.getDescription(),
            feature.getPriority(),
            screensList,
            dataEntitiesList,
            feature.getLogicNotes(),
            feature.getStatus(),
            feature.getCreatedAt()
        );
    }
}
