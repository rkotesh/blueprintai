package com.blueprintai.debug;

import java.util.List;

public record DebugResultContent(
    String layer,
    String title,
    String analogy,
    String plain_cause,
    String technical_cause,
    List<String> fix_steps,
    String preventive_tip
) {}
