package com.blueprintai.debug;

import java.time.Instant;
import java.util.UUID;

public record DebugSessionResponse(
    UUID id,
    UUID projectId,
    String errorText,
    String contextText,
    DebugResultContent result,
    Instant createdAt
) {
    public static DebugSessionResponse fromEntity(DebugSession s) {
        return new DebugSessionResponse(
            s.getId(),
            s.getProject().getId(),
            s.getErrorText(),
            s.getContextText(),
            s.getResult(),
            s.getCreatedAt()
        );
    }
}
