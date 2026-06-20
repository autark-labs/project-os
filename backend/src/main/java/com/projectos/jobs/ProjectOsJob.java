package com.projectos.jobs;

import java.time.Instant;
import java.util.List;

public record ProjectOsJob(
        String jobId,
        String type,
        String subjectId,
        String status,
        String currentStep,
        List<ProjectOsJobStep> steps,
        Instant createdAt,
        Instant updatedAt,
        ProjectOsJobError error) {
}
