package com.blueprintai.auth;

import com.blueprintai.user.User;
import com.blueprintai.user.UserLevel;

import java.time.Instant;
import java.util.UUID;

public record UserResponse(
    UUID id,
    String email,
    String displayName,
    UserLevel level,
    Instant createdAt
) {
    public static UserResponse fromEntity(User user) {
        return new UserResponse(
            user.getId(),
            user.getEmail(),
            user.getDisplayName(),
            user.getLevel(),
            user.getCreatedAt()
        );
    }
}
