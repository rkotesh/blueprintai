package com.blueprintai.learning;

import java.util.List;

public record SubmitQuizAttemptRequest(
    List<Integer> answers
) {}
