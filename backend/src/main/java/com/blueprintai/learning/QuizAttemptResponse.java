package com.blueprintai.learning;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record QuizAttemptResponse(
    UUID id,
    UUID quizId,
    int score,
    int totalQuestions,
    List<Integer> answers,
    List<QuizQuestion> questions,
    Instant createdAt
) {}
