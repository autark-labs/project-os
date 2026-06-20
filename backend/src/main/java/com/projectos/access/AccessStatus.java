package com.projectos.access;

import java.time.Instant;
import java.util.List;

import com.projectos.api.ProjectOsAction;
import com.projectos.api.ProjectOsIssue;

public record AccessStatus(
        String mode,
        String serverLanUrl,
        AccessTailscaleStatus tailscale,
        List<AccessAppStatus> apps,
        List<ProjectOsIssue> issues,
        List<ProjectOsAction> actions,
        Instant updatedAt) {
}
