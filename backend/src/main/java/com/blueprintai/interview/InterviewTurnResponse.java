package com.blueprintai.interview;

import java.time.Instant;
import java.util.UUID;

public record InterviewTurnResponse(
    UUID id,
    InterviewRole role,
    String content,
    int turnIndex,
    Instant createdAt
) {
    public static InterviewTurnResponse fromEntity(InterviewTurn turn) {
        return new InterviewTurnResponse(
            turn.getId(),
            turn.getRole(),
            turn.getContent(),
            turn.getTurnIndex(),
            turn.getCreatedAt()
        );
    }
}
