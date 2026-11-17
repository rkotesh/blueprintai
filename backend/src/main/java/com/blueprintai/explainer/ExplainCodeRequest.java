package com.blueprintai.explainer;

import jakarta.validation.constraints.NotBlank;

import java.util.UUID;

public record ExplainCodeRequest(
    String filename,
    String language,
    @NotBlank(message = "codeText is required")
    String codeText,
    UUID milestoneId
) {}
