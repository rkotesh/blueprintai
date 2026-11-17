package com.blueprintai.auth;

import com.blueprintai.user.UserLevel;

public record UpdateUserRequest(
    String displayName,
    UserLevel level
) {}
