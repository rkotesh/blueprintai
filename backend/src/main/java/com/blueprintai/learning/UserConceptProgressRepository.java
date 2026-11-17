package com.blueprintai.learning;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserConceptProgressRepository extends JpaRepository<UserConceptProgress, UUID> {
    List<UserConceptProgress> findByUserId(UUID userId);
    Optional<UserConceptProgress> findByUserIdAndConceptId(UUID userId, UUID conceptId);
}
