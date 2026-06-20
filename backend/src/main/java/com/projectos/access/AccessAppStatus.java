package com.projectos.access;

public record AccessAppStatus(
        String appInstanceId,
        String name,
        String localUrl,
        String privateUrl,
        boolean serverCanReach,
        Boolean browserCanReach) {
}
