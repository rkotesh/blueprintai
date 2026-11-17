package com.blueprintai.learning;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface QuizRepository extends JpaRepository<Quiz, UUID> {
    List<Quiz> findByProjectIdOrderByCreatedAtDesc(UUID projectId);
    Optional<Quiz> findTopByProjectIdOrderByCreatedAtDesc(UUID projectId);
}
