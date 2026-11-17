package com.blueprintai.debug;

import jakarta.validation.constraints.NotBlank;

public record DebugRequest(
    @NotBlank(message = "errorText is required")
    String errorText,
    String contextText
) {}
