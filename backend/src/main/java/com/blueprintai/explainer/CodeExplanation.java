package com.blueprintai.explainer;

import com.blueprintai.milestone.Milestone;
import com.blueprintai.project.Project;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "code_explanations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CodeExplanation {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "milestone_id")
    private Milestone milestone;

    @Column(name = "filename", nullable = false)
    private String filename;

    @Column(name = "language", nullable = false)
    private String language;

    @Column(name = "code_text", nullable = false, columnDefinition = "TEXT")
    private String codeText;

    @Column(name = "layer", nullable = false)
    private String layer;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "explanation", nullable = false, columnDefinition = "jsonb")
    private CodeExplanationContent explanation;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
}
