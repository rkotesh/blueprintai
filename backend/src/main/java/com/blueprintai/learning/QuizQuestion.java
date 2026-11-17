package com.blueprintai.learning;

import java.util.List;

public record QuizQuestion(
    String question,
    List<String> options,
    int correct_index,
    String explanation
) {}
