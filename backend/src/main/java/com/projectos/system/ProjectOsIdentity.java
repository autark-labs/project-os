package com.projectos.system;

import java.time.Instant;

public record ProjectOsIdentity(
        String instanceId,
        String instanceSlug,
        String runtimeRoot,
        String runtimeRootHash,
        Instant createdAt,
        int schemaVersion) {
}
