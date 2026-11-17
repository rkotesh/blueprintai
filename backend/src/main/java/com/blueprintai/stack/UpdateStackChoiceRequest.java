package com.blueprintai.stack;

import jakarta.validation.constraints.NotBlank;

public record UpdateStackChoiceRequest(
    @NotBlank(message = "User choice is required")
    String userChoice
) {}
