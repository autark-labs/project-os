package com.projectos.system;

import java.util.List;
import java.util.Optional;

import com.projectos.api.ProjectOsAction;

public record RecommendedAction(
        String id,
        String severity,
        String title,
        String body,
        Optional<ProjectOsAction> primaryAction,
        Optional<ProjectOsAction> secondaryAction,
        List<String> sourceIssueIds,
        boolean dismissible) {
}
