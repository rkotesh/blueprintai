package com.blueprintai.understanding;

import com.blueprintai.project.Project;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "understanding_checks")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UnderstandingCheck {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @Column(name = "user_summary", nullable = false, columnDefinition = "TEXT")
    private String userSummary;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "feedback", nullable = false, columnDefinition = "jsonb")
    private UnderstandingFeedback feedback;

    @Column(name = "score", nullable = false)
    private Integer score;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
}
