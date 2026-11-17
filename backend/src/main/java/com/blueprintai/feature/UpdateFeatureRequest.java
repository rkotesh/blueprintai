package com.blueprintai.feature;

import java.util.List;

public record UpdateFeatureRequest(
    String name,
    String description,
    FeaturePriority priority,
    List<String> screens,
    List<String> dataEntities,
    String logicNotes,
    FeatureStatus status
) {}
