package com.blueprintai.milestone;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record MilestoneResponse(
    UUID id,
    UUID projectId,
    Integer orderIndex,
    String title,
    String description,
    List<String> concepts,
    MilestoneStatus status,
    Instant createdAt
) {
    public static MilestoneResponse fromEntity(Milestone m) {
        return new MilestoneResponse(
            m.getId(),
            m.getProject().getId(),
            m.getOrderIndex(),
            m.getTitle(),
            m.getDescription(),
            m.getConcepts() != null ? m.getConcepts() : List.of(),
            m.getStatus(),
            m.getCreatedAt()
        );
    }
}
