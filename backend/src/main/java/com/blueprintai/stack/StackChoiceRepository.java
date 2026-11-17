package com.blueprintai.stack;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface StackChoiceRepository extends JpaRepository<StackChoice, UUID> {
    List<StackChoice> findAllByProjectIdOrderByCreatedAtAsc(UUID projectId);
    void deleteAllByProjectId(UUID projectId);
}
