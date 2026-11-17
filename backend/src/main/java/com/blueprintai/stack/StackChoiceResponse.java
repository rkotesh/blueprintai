package com.blueprintai.stack;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record StackChoiceResponse(
    UUID id,
    UUID projectId,
    String layer,
    String recommended,
    List<StackRecommendAiOutput.StackAlternativeItem> alternatives,
    String reasoning,
    String userChoice,
    Instant createdAt
) {
    public static StackChoiceResponse fromEntity(StackChoice choice, ObjectMapper objectMapper) {
        List<StackRecommendAiOutput.StackAlternativeItem> altList;
        try {
            altList = objectMapper.readValue(choice.getAlternatives(), new TypeReference<List<StackRecommendAiOutput.StackAlternativeItem>>() {});
        } catch (Exception e) {
            altList = List.of();
        }

        return new StackChoiceResponse(
            choice.getId(),
            choice.getProject().getId(),
            choice.getLayer(),
            choice.getRecommended(),
            altList,
            choice.getReasoning(),
            choice.getUserChoice() != null ? choice.getUserChoice() : choice.getRecommended(),
            choice.getCreatedAt()
        );
    }
}
