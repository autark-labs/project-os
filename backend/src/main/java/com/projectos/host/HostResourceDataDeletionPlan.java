package com.projectos.host;

import java.util.List;

public record HostResourceDataDeletionPlan(
        String resourceId,
        String displayName,
        List<String> paths,
        List<String> blockedReasons,
        String confirmationText,
        String warning) {
}
