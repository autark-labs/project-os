package com.projectos.marketplace.install;

import java.time.Instant;
import java.util.List;

import com.projectos.api.ProjectOsAction;
import com.projectos.api.ProjectOsIssue;

public record AppInstanceView(
        String appInstanceId,
        String catalogAppId,
        String name,
        String category,
        String icon,
        String userStatus,
        String installState,
        String runtimeState,
        String ownershipState,
        String accessState,
        String backupState,
        String localUrl,
        String privateUrl,
        List<ProjectOsIssue> issues,
        List<ProjectOsAction> actions,
        AppRemediationView remediation,
        Instant updatedAt) {

    public AppInstanceView(
            String appInstanceId,
            String catalogAppId,
            String name,
            String category,
            String icon,
            String userStatus,
            String installState,
            String runtimeState,
            String ownershipState,
            String accessState,
            String backupState,
            String localUrl,
            String privateUrl,
            List<ProjectOsIssue> issues,
            List<ProjectOsAction> actions,
            Instant updatedAt) {
        this(
                appInstanceId,
                catalogAppId,
                name,
                category,
                icon,
                userStatus,
                installState,
                runtimeState,
                ownershipState,
                accessState,
                backupState,
                localUrl,
                privateUrl,
                issues,
                actions,
                new AppRemediationView("healthy", "Ready", name + " is ready to use.", "No action needed", "success"),
                updatedAt);
    }
}
