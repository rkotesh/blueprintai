package com.blueprintai.architecture;

import java.util.UUID;

public record TraceRequest(
    UUID featureId,
    String action
) {}
