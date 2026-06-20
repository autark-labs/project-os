package com.projectos.api;

import java.util.List;
import java.util.Map;
import java.util.Optional;

public record ProjectOsIssue(
        String id,
        String scope,
        String subjectId,
        String severity,
        String reasonCode,
        String title,
        String summary,
        Optional<ProjectOsAction> primaryAction,
        List<ProjectOsAction> secondaryActions,
        Map<String, Object> advancedDetails) {
}
