package com.projectos.api;

import java.util.List;
import java.util.Map;
import java.util.Optional;

public final class ProjectOsIssueFactory {

    private ProjectOsIssueFactory() {
    }

    public static ProjectOsIssue systemIssue(String id, String severity, String reasonCode, String title, String summary, ProjectOsAction primaryAction) {
        return issue(id, "system", "", severity, reasonCode, title, summary, primaryAction);
    }

    public static ProjectOsIssue appIssue(String id, String appId, String severity, String reasonCode, String title, String summary, ProjectOsAction primaryAction) {
        return issue(id, "app", appId, severity, reasonCode, title, summary, primaryAction);
    }

    public static ProjectOsIssue backupIssue(String id, String subjectId, String severity, String reasonCode, String title, String summary, ProjectOsAction primaryAction) {
        return issue(id, "backup", subjectId, severity, reasonCode, title, summary, primaryAction);
    }

    public static ProjectOsIssue accessIssue(String id, String subjectId, String severity, String reasonCode, String title, String summary, ProjectOsAction primaryAction) {
        return issue(id, "access", subjectId, severity, reasonCode, title, summary, primaryAction);
    }

    public static ProjectOsIssue setupIssue(String id, String severity, String reasonCode, String title, String summary, ProjectOsAction primaryAction) {
        return issue(id, "setup", "", severity, reasonCode, title, summary, primaryAction);
    }

    public static ProjectOsIssue storageIssue(String id, String severity, String reasonCode, String title, String summary, ProjectOsAction primaryAction) {
        return issue(id, "storage", "", severity, reasonCode, title, summary, primaryAction);
    }

    private static ProjectOsIssue issue(String id, String scope, String subjectId, String severity, String reasonCode, String title, String summary, ProjectOsAction primaryAction) {
        return new ProjectOsIssue(
                id,
                scope,
                subjectId == null ? "" : subjectId,
                severity,
                reasonCode,
                title,
                summary,
                Optional.ofNullable(primaryAction),
                List.of(),
                Map.of());
    }
}
