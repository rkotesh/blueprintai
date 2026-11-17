package com.blueprintai.ai;

import com.blueprintai.common.BadRequestException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentLinkedDeque;

@Service
public class RateLimiterService {

    private final int maxCallsPerHour;
    private final int maxCodeChars;
    private final Map<UUID, ConcurrentLinkedDeque<Instant>> userCallHistory = new ConcurrentHashMap<>();

    public RateLimiterService(
        @Value("${app.openai.rate-limit-per-hour:30}") int maxCallsPerHour,
        @Value("${app.openai.max-code-chars:20000}") int maxCodeChars
    ) {
        this.maxCallsPerHour = maxCallsPerHour;
        this.maxCodeChars = maxCodeChars;
    }

    public void checkRateLimit(UUID userId) {
        if (userId == null) return;

        Instant now = Instant.now();
        Instant oneHourAgo = now.minusSeconds(3600);

        ConcurrentLinkedDeque<Instant> timestamps = userCallHistory.computeIfAbsent(userId, k -> new ConcurrentLinkedDeque<>());

        // Evict entries older than 1 hour
        while (!timestamps.isEmpty() && timestamps.peekFirst().isBefore(oneHourAgo)) {
            timestamps.pollFirst();
        }

        if (timestamps.size() >= maxCallsPerHour) {
            throw new BadRequestException("Rate limit exceeded: You have reached the limit of " + maxCallsPerHour + " AI calls per hour. Please wait before making more requests.");
        }

        timestamps.addLast(now);
    }

    public void validateInputSize(String input, String fieldName) {
        if (input != null && input.length() > maxCodeChars) {
            throw new BadRequestException("Input " + fieldName + " exceeds the maximum allowed size of " + maxCodeChars + " characters (received " + input.length() + ").");
        }
    }
}
