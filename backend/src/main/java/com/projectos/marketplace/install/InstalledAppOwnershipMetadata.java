package com.projectos.marketplace.install;

import java.time.Instant;

public record InstalledAppOwnershipMetadata(
        String appId,
        String appInstanceId,
        String catalogAppId,
        String projectOsInstanceId,
        String runtimePathOrHash,
        String installState,
        String ownershipStatus,
        Instant createdAt,
        Instant updatedAt) {
}
