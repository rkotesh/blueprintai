package com.blueprintai.interview;

public record InterviewNextResponse(
    String question,
    String whyAsking,
    boolean done,
    int turnIndex
) {}
