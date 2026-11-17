package com.blueprintai.project;

import java.time.Instant;
import java.util.UUID;

public record ProjectResponse(
    UUID id,
    UUID userId,
    String title,
    String ideaText,
    ProjectMode mode,
    TargetPlatform targetPlatform,
    ProjectStatus status,
    Instant createdAt,
    Instant updatedAt
) {
    public static ProjectResponse fromEntity(Project project) {
        return new ProjectResponse(
            project.getId(),
            project.getUser().getId(),
            project.getTitle(),
            project.getIdeaText(),
            project.getMode(),
            project.getTargetPlatform(),
            project.getStatus(),
            project.getCreatedAt(),
            project.getUpdatedAt()
        );
    }
}
