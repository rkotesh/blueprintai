package com.blueprintai.learning;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record QuizResponse(
    UUID id,
    UUID projectId,
    UUID milestoneId,
    List<QuizQuestion> questions,
    Instant createdAt
) {
    public static QuizResponse fromEntity(Quiz q) {
        return new QuizResponse(
            q.getId(),
            q.getProject().getId(),
            q.getMilestone() != null ? q.getMilestone().getId() : null,
            q.getQuestions(),
            q.getCreatedAt()
        );
    }
}
