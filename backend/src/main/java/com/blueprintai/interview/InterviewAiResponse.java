package com.blueprintai.interview;

import com.fasterxml.jackson.annotation.JsonProperty;

public record InterviewAiResponse(
    @JsonProperty("question") String question,
    @JsonProperty("why_asking") String whyAsking,
    @JsonProperty("done") boolean done
) {}
