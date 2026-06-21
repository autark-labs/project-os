package com.projectos.host;

import java.time.Instant;

public record ExternalService(
        String id,
        String name,
        String url,
        String category,
        String accessScope,
        boolean healthCheckEnabled,
        String managementMode,
        String catalogAppId,
        Instant createdAt) {
}
