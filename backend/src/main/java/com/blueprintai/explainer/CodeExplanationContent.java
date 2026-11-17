package com.blueprintai.explainer;

import java.util.List;

public record CodeExplanationContent(
    String layer,
    String summary,
    String analogy,
    String plain_explanation,
    String technical_detail,
    List<String> key_takeaways
) {}
