package com.projectos.host;

import java.util.List;

public record HostResourceRecoveryPlan(
        String resourceId,
        String displayName,
        boolean recoverable,
        List<String> steps,
        List<String> blockedReasons,
        String confirmationText) {
}
