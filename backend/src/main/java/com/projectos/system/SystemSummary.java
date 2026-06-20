package com.projectos.system;

import java.time.Instant;
import java.util.List;

import com.projectos.api.ProjectOsIssue;

public record SystemSummary(
        String deviceName,
        String instanceId,
        String lanUrl,
        SetupProgressSummary setup,
        DockerSummary docker,
        AccessSummary access,
        AppsSummary apps,
        BackupSummary backups,
        StorageSummary storage,
        List<ProjectOsIssue> issues,
        Instant updatedAt) {
}
