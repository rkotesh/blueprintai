package com.blueprintai.blueprint;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface BlueprintRepository extends JpaRepository<Blueprint, UUID> {
    Optional<Blueprint> findTopByProjectIdOrderByVersionDesc(UUID projectId);
}
