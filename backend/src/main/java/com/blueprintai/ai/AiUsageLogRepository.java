package com.blueprintai.ai;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AiUsageLogRepository extends JpaRepository<AiUsageLog, UUID> {
    List<AiUsageLog> findAllByUserIdOrderByCreatedAtDesc(UUID userId);
}
