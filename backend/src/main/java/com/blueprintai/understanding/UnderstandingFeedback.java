package com.blueprintai.understanding;

import java.util.List;
import java.util.Map;

public record UnderstandingFeedback(
    int total_score,
    Map<String, DimensionScore> dimensions,
    List<String> strengths,
    List<String> gaps,
    String constructive_feedback,
    List<String> recommended_concepts
) {
    public record DimensionScore(
        int score,
        String comment
    ) {}
}
