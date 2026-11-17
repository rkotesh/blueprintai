package com.blueprintai.understanding;

import jakarta.validation.constraints.NotBlank;

public record UnderstandingCheckRequest(
    @NotBlank(message = "userSummary is required")
    String userSummary
) {}
