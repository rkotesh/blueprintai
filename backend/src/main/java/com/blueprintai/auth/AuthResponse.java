package com.blueprintai.auth;

public record AuthResponse(
    String token,
    String refreshToken,
    UserResponse user
) {}
