package com.blueprintai.ai;

import com.blueprintai.common.BadRequestException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Primary;
import org.springframework.context.annotation.Profile;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.time.Duration;
import java.util.*;

@Component
@Primary
@Profile("!test & !dev")
@Slf4j
public class OpenAiClient implements AiClient {

    private final RestClient restClient;
    private final ObjectMapper objectMapper;
    private final AiUsageLogger usageLogger;
    private final RateLimiterService rateLimiterService;
    private final String model;
    private final int maxRetries;
    private final String apiKey;

    public OpenAiClient(
        @Value("${app.openai.api-key:}") String apiKey,
        @Value("${app.openai.model:gpt-4o-mini}") String model,
        @Value("${app.openai.timeout-seconds:60}") int timeoutSeconds,
        @Value("${app.openai.max-retries:2}") int maxRetries,
        ObjectMapper objectMapper,
        AiUsageLogger usageLogger,
        RateLimiterService rateLimiterService
    ) {
        this.apiKey = apiKey;
        this.model = model;
        this.maxRetries = maxRetries;
        this.objectMapper = objectMapper;
        this.usageLogger = usageLogger;
        this.rateLimiterService = rateLimiterService;

        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(Duration.ofSeconds(timeoutSeconds));
        requestFactory.setReadTimeout(Duration.ofSeconds(timeoutSeconds));

        this.restClient = RestClient.builder()
            .baseUrl("https://api.openai.com/v1")
            .requestFactory(requestFactory)
            .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
            .build();
    }

    @Override
    public <T> T generateStructuredOutput(
        String task,
        String systemPrompt,
        String userPrompt,
        Class<T> responseType,
        UUID userId,
        String schemaName,
        String schemaJson
    ) {
        rateLimiterService.checkRateLimit(userId);
        rateLimiterService.validateInputSize(userPrompt, "userPrompt");

        if (apiKey == null || apiKey.isBlank()) {
            throw new BadRequestException("OpenAI API key is not configured in backend environment variables.");
        }

        long startTime = System.currentTimeMillis();
        int attempt = 0;
        Exception lastException = null;

        while (attempt <= maxRetries) {
            attempt++;
            try {
                Map<String, Object> requestBody = buildRequestBody(systemPrompt, userPrompt, schemaName, schemaJson);

                String responseBody = restClient.post()
                    .uri("/chat/completions")
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + apiKey)
                    .body(requestBody)
                    .retrieve()
                    .onStatus(HttpStatusCode::is4xxClientError, (req, resp) -> {
                        String err = new String(resp.getBody().readAllBytes());
                        throw new RuntimeException("OpenAI client error: " + resp.getStatusCode() + " - " + err);
                    })
                    .onStatus(HttpStatusCode::is5xxServerError, (req, resp) -> {
                        String err = new String(resp.getBody().readAllBytes());
                        throw new RuntimeException("OpenAI server error: " + resp.getStatusCode() + " - " + err);
                    })
                    .body(String.class);

                JsonNode root = objectMapper.readTree(responseBody);
                JsonNode choice = root.path("choices").get(0);
                String content = choice.path("message").path("content").asText();

                int promptTokens = root.path("usage").path("prompt_tokens").asInt(0);
                int completionTokens = root.path("usage").path("completion_tokens").asInt(0);
                long latency = System.currentTimeMillis() - startTime;

                usageLogger.logCall(userId, task, model, promptTokens, completionTokens, latency, true);

                try {
                    return objectMapper.readValue(content, responseType);
                } catch (Exception parseException) {
                    log.warn("Structured JSON parse failed for task {}. Attempting repair prompt. Error: {}", task, parseException.getMessage());
                    return repairAndParse(task, content, responseType, userId, schemaJson);
                }

            } catch (Exception e) {
                lastException = e;
                log.warn("OpenAI call failed on attempt {}/{} for task {}: {}", attempt, maxRetries + 1, task, e.getMessage());
                if (attempt <= maxRetries) {
                    try {
                        Thread.sleep((long) Math.pow(2, attempt) * 1000);
                    } catch (InterruptedException ie) {
                        Thread.currentThread().interrupt();
                        break;
                    }
                }
            }
        }

        long latency = System.currentTimeMillis() - startTime;
        usageLogger.logCall(userId, task, model, 0, 0, latency, false);
        throw new BadRequestException("AI service failed after " + attempt + " attempts: " + (lastException != null ? lastException.getMessage() : "Unknown error"));
    }

    private <T> T repairAndParse(String task, String rawJson, Class<T> responseType, UUID userId, String schemaJson) {
        String repairPrompt = "The following JSON does not match the required schema. Fix any syntax errors or missing fields and return strictly valid JSON matching the schema:\n"
            + "Schema: " + schemaJson + "\n"
            + "Malformed JSON:\n" + rawJson;

        Map<String, Object> requestBody = Map.of(
            "model", model,
            "messages", List.of(
                Map.of("role", "system", "content", "You are a JSON repair tool. Output only valid JSON."),
                Map.of("role", "user", "content", repairPrompt)
            ),
            "response_format", Map.of("type", "json_object")
        );

        try {
            String fixedBody = restClient.post()
                .uri("/chat/completions")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + apiKey)
                .body(requestBody)
                .retrieve()
                .body(String.class);

            JsonNode root = objectMapper.readTree(fixedBody);
            String content = root.path("choices").get(0).path("message").path("content").asText();
            return objectMapper.readValue(content, responseType);
        } catch (Exception e) {
            log.error("Failed to repair JSON output for task {}", task, e);
            throw new BadRequestException("AI generated output could not be parsed into expected schema: " + e.getMessage());
        }
    }

    private Map<String, Object> buildRequestBody(String systemPrompt, String userPrompt, String schemaName, String schemaJson) throws Exception {
        Map<String, Object> body = new HashMap<>();
        body.put("model", model);
        body.put("messages", List.of(
            Map.of("role", "system", "content", systemPrompt),
            Map.of("role", "user", "content", userPrompt)
        ));

        if (schemaJson != null && !schemaJson.isBlank()) {
            JsonNode schemaNode = objectMapper.readTree(schemaJson);
            body.put("response_format", Map.of(
                "type", "json_schema",
                "json_schema", Map.of(
                    "name", schemaName != null ? schemaName : "response_schema",
                    "strict", true,
                    "schema", schemaNode
                )
            ));
        }

        return body;
    }
}
