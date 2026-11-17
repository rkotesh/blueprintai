package com.blueprintai.stack;

import com.blueprintai.project.Project;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "stack_choices")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StackChoice {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @Column(nullable = false, length = 64)
    private String layer;

    @Column(nullable = false, length = 128)
    private String recommended;

    @Column(name = "alternatives", columnDefinition = "jsonb", nullable = false)
    @JdbcTypeCode(SqlTypes.JSON)
    @Builder.Default
    private String alternatives = "[]";

    @Column(nullable = false, columnDefinition = "TEXT")
    private String reasoning;

    @Column(name = "user_choice", length = 128)
    private String userChoice;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
}
