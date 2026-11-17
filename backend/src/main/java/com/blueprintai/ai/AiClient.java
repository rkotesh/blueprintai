package com.blueprintai.ai;

import java.util.UUID;

public interface AiClient {
    <T> T generateStructuredOutput(
        String task,
        String systemPrompt,
        String userPrompt,
        Class<T> responseType,
        UUID userId,
        String schemaName,
        String schemaJson
    );
}
