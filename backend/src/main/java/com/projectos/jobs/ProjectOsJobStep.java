package com.projectos.jobs;

import java.time.Instant;

public record ProjectOsJobStep(
        String id,
        String label,
        String status,
        String message,
        Instant startedAt,
        Instant finishedAt) {

    public static ProjectOsJobStep pending(String id, String label) {
        return new ProjectOsJobStep(id, label, "pending", "", null, null);
    }

    public static ProjectOsJobStep running(String id, String label, String message) {
        return new ProjectOsJobStep(id, label, "running", message == null ? "" : message, Instant.now(), null);
    }

    public static ProjectOsJobStep succeeded(String id, String label, String message) {
        return new ProjectOsJobStep(id, label, "succeeded", message == null ? "" : message, null, Instant.now());
    }

    public static ProjectOsJobStep failed(String id, String label, String message) {
        return new ProjectOsJobStep(id, label, "failed", message == null ? "" : message, null, Instant.now());
    }

    ProjectOsJobStep withStatus(String nextStatus, String nextMessage, Instant startedAt, Instant finishedAt) {
        return new ProjectOsJobStep(
                id,
                label,
                nextStatus,
                nextMessage == null || nextMessage.isBlank() ? message : nextMessage,
                startedAt == null ? this.startedAt : startedAt,
                finishedAt == null ? this.finishedAt : finishedAt);
    }
}
