package com.projectos.host;

public record ObservedServiceAction(
        String id,
        String label,
        String kind,
        String href,
        String method,
        boolean disabled,
        String reason) {
}
