package com.blueprintai.learning;

import java.util.UUID;

public record GlossaryTermResponse(
    UUID id,
    String term,
    String definition,
    String analogy
) {
    public static GlossaryTermResponse fromEntity(GlossaryTerm t) {
        return new GlossaryTermResponse(
            t.getId(),
            t.getTerm(),
            t.getDefinition(),
            t.getAnalogy()
        );
    }
}
