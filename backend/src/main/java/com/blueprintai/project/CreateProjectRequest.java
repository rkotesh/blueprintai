package com.blueprintai.project;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateProjectRequest(
    @NotBlank(message = "Title is required")
    @Size(min = 2, max = 255, message = "Title must be between 2 and 255 characters")
    String title,

    @NotBlank(message = "Idea description is required")
    String ideaText,

    ProjectMode mode,

    TargetPlatform targetPlatform
) {}
