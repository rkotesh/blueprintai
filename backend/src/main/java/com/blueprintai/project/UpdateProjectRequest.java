package com.blueprintai.project;

public record UpdateProjectRequest(
    String title,
    String ideaText,
    ProjectMode mode,
    TargetPlatform targetPlatform,
    ProjectStatus status
) {}
