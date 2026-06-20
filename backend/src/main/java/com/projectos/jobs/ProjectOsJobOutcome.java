package com.projectos.jobs;

import java.util.List;

public record ProjectOsJobOutcome(
        String status,
        String message,
        List<ProjectOsJobStep> steps) {

    public static ProjectOsJobOutcome succeeded(String message) {
        return succeeded(message, List.of());
    }

    public static ProjectOsJobOutcome succeeded(String message, List<ProjectOsJobStep> steps) {
        return new ProjectOsJobOutcome("succeeded", message, steps == null ? List.of() : steps);
    }

    public static ProjectOsJobOutcome failed(String message, List<ProjectOsJobStep> steps) {
        return new ProjectOsJobOutcome("failed", message, steps == null ? List.of() : steps);
    }
}
