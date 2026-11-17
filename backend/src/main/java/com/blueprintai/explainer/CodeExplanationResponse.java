package com.blueprintai.explainer;

import java.time.Instant;
import java.util.UUID;

public record CodeExplanationResponse(
    UUID id,
    UUID projectId,
    UUID milestoneId,
    String filename,
    String language,
    String codeText,
    String layer,
    CodeExplanationContent explanation,
    Instant createdAt
) {
    public static CodeExplanationResponse fromEntity(CodeExplanation e) {
        return new CodeExplanationResponse(
            e.getId(),
            e.getProject().getId(),
            e.getMilestone() != null ? e.getMilestone().getId() : null,
            e.getFilename(),
            e.getLanguage(),
            e.getCodeText(),
            e.getLayer(),
            e.getExplanation(),
            e.getCreatedAt()
        );
    }
}
