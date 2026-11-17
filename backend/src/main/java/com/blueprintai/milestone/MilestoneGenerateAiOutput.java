package com.blueprintai.milestone;

import java.util.List;

public record MilestoneGenerateAiOutput(
    List<MilestoneItemAiOutput> milestones
) {
    public record MilestoneItemAiOutput(
        int order_index,
        String title,
        String description,
        List<String> concepts,
        List<String> validation_checklist
    ) {}
}
