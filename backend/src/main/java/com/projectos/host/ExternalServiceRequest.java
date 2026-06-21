package com.projectos.host;

public record ExternalServiceRequest(
        String name,
        String url,
        String category,
        String accessScope,
        boolean healthCheckEnabled,
        String catalogAppId) {
}
