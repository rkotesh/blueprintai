package com.blueprintai.blueprint;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.time.Instant;
import java.util.UUID;

public record BlueprintResponse(
    UUID id,
    UUID projectId,
    int version,
    JsonNode content,
    Instant createdAt
) {
    public static BlueprintResponse fromEntity(Blueprint blueprint, ObjectMapper objectMapper) {
        JsonNode jsonNode;
        try {
            jsonNode = objectMapper.readTree(blueprint.getContent());
        } catch (Exception e) {
            jsonNode = objectMapper.createObjectNode();
        }

        return new BlueprintResponse(
            blueprint.getId(),
            blueprint.getProject().getId(),
            blueprint.getVersion(),
            jsonNode,
            blueprint.getCreatedAt()
        );
    }
}
