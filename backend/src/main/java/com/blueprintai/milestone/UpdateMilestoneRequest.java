package com.blueprintai.milestone;

public record UpdateMilestoneRequest(
    MilestoneStatus status,
    String title,
    String description
) {}
