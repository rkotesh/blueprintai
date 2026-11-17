package com.blueprintai.understanding;

import java.time.Instant;
import java.util.UUID;

public record UnderstandingCheckResponse(
    UUID id,
    UUID projectId,
    String userSummary,
    int score,
    UnderstandingFeedback feedback,
    Instant createdAt
) {
    public static UnderstandingCheckResponse fromEntity(UnderstandingCheck c) {
        return new UnderstandingCheckResponse(
            c.getId(),
            c.getProject().getId(),
            c.getUserSummary(),
            c.getScore(),
            c.getFeedback(),
            c.getCreatedAt()
        );
    }
}
