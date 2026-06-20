package com.projectos.system.api;

import java.time.Instant;
import java.util.List;

import com.projectos.api.ProjectOsIssue;
import com.projectos.system.ProjectVersionInfo;

public record SupportSummary(
        String status,
        String headline,
        String summary,
        boolean redacted,
        String backendHealth,
        String dockerStatus,
        String tailscaleStatus,
        String serviceStatus,
        ProjectVersionInfo version,
        int recentFailures,
        List<SupportFinding> findings,
        List<ProjectOsIssue> unifiedIssues,
        List<SupportRedactionRule> redactionRules,
        List<SupportCommand> commands,
        Instant checkedAt) {
}
