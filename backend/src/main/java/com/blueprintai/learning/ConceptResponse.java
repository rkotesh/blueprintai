package com.blueprintai.learning;

import java.util.UUID;

public record ConceptResponse(
    UUID id,
    String slug,
    String title,
    String summary,
    String layer,
    String userStatus // "UNSEEN", "SEEN", "UNDERSTOOD"
) {
    public static ConceptResponse of(Concept c, String userStatus) {
        return new ConceptResponse(
            c.getId(),
            c.getSlug(),
            c.getTitle(),
            c.getSummary(),
            c.getLayer(),
            userStatus != null ? userStatus : "UNSEEN"
        );
    }
}
