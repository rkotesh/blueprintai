package com.blueprintai.ai;

import com.blueprintai.user.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "ai_usage_logs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AiUsageLog {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(nullable = false, length = 64)
    private String task;

    @Column(nullable = false, length = 64)
    private String model;

    @Column(name = "prompt_tokens")
    @Builder.Default
    private int promptTokens = 0;

    @Column(name = "completion_tokens")
    @Builder.Default
    private int completionTokens = 0;

    @Column(name = "latency_ms")
    @Builder.Default
    private long latencyMs = 0;

    @Column(nullable = false)
    @Builder.Default
    private boolean success = true;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
}
