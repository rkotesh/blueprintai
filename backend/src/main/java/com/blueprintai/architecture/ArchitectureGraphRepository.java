package com.blueprintai.architecture;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface ArchitectureGraphRepository extends JpaRepository<ArchitectureGraph, UUID> {
    Optional<ArchitectureGraph> findTopByProjectIdOrderByVersionDesc(UUID projectId);
}
