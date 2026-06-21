package com.projectos.host;

import java.util.List;

public record HostResourceCleanupPlan(
        String resourceId,
        String displayName,
        List<String> stopContainers,
        List<String> removeContainers,
        List<String> freePorts,
        List<String> preserveData,
        List<String> untouched,
        String confirmationText,
        String warning) {
}
