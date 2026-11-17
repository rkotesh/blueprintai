package com.blueprintai.understanding;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface UnderstandingCheckRepository extends JpaRepository<UnderstandingCheck, UUID> {
    List<UnderstandingCheck> findByProjectIdOrderByCreatedAtDesc(UUID projectId);
}
