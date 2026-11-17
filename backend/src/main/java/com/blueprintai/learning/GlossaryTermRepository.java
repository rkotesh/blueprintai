package com.blueprintai.learning;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface GlossaryTermRepository extends JpaRepository<GlossaryTerm, UUID> {
    List<GlossaryTerm> findByProjectIdOrProjectIsNull(UUID projectId);
}
