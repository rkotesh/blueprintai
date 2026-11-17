package com.blueprintai.ai;

import com.blueprintai.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AiUsageLogger {

    private final AiUsageLogRepository repository;
    private final UserRepository userRepository;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logCall(UUID userId, String task, String model, int promptTokens, int completionTokens, long latencyMs, boolean success) {
        try {
            AiUsageLog logEntry = AiUsageLog.builder()
                .user(userId != null ? userRepository.findById(userId).orElse(null) : null)
                .task(task)
                .model(model)
                .promptTokens(promptTokens)
                .completionTokens(completionTokens)
                .latencyMs(latencyMs)
                .success(success)
                .build();

            repository.save(logEntry);
            log.info("AI Usage Logged: task={}, model={}, tokens={}+{}, latency={}ms, success={}",
                task, model, promptTokens, completionTokens, latencyMs, success);
        } catch (Exception e) {
            log.warn("Failed to record AI usage log", e);
        }
    }
}
