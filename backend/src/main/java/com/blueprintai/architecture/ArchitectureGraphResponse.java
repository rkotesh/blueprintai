package com.blueprintai.architecture;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.time.Instant;
import java.util.UUID;

public record ArchitectureGraphResponse(
    UUID id,
    UUID projectId,
    int version,
    JsonNode nodes,
    JsonNode edges,
    Instant createdAt
) {
    public static ArchitectureGraphResponse fromEntity(ArchitectureGraph graph, ObjectMapper objectMapper) {
        JsonNode nodesNode;
        JsonNode edgesNode;
        try {
            nodesNode = objectMapper.readTree(graph.getNodes());
        } catch (Exception e) {
            nodesNode = objectMapper.createArrayNode();
        }
        try {
            edgesNode = objectMapper.readTree(graph.getEdges());
        } catch (Exception e) {
            edgesNode = objectMapper.createArrayNode();
        }

        return new ArchitectureGraphResponse(
            graph.getId(),
            graph.getProject().getId(),
            graph.getVersion(),
            nodesNode,
            edgesNode,
            graph.getCreatedAt()
        );
    }
}
