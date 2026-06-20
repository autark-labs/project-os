package com.projectos.jobs;

import static org.assertj.core.api.Assertions.assertThat;

import java.nio.file.Path;
import java.time.Instant;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import com.projectos.marketplace.runtime.ProjectOsRuntimeProperties;
import com.projectos.marketplace.runtime.RuntimeLayout;

class ProjectOsJobRepositoryTests {

    @TempDir
    Path runtimeRoot;

    @Test
    void persistsJobAndStepTransitionsAcrossRepositoryInstances() {
        ProjectOsJobRepository first = repository();
        ProjectOsJob created = first.create("install_app", "vaultwarden", List.of(
                ProjectOsJobStep.pending("validate_host", "Checking this device"),
                ProjectOsJobStep.pending("start_app", "Starting app")));

        first.markRunning(created.jobId(), "validate_host");
        first.completeStep(created.jobId(), "validate_host", "This device is ready.");
        first.fail(created.jobId(), "install_failed", "Docker could not start the app.", java.util.Map.of("exitCode", "1"));

        ProjectOsJobRepository second = repository();
        ProjectOsJob loaded = second.findById(created.jobId()).orElseThrow();

        assertThat(loaded.type()).isEqualTo("install_app");
        assertThat(loaded.subjectId()).isEqualTo("vaultwarden");
        assertThat(loaded.status()).isEqualTo("failed");
        assertThat(loaded.currentStep()).isEqualTo("validate_host");
        assertThat(loaded.error()).isNotNull();
        assertThat(loaded.error().code()).isEqualTo("install_failed");
        assertThat(loaded.error().advancedDetails()).containsEntry("exitCode", "1");
        assertThat(loaded.steps()).extracting(ProjectOsJobStep::status).containsExactly("succeeded", "pending");
    }

    @Test
    void findsActiveJobForSameTypeAndSubject() {
        ProjectOsJobRepository repository = repository();
        repository.create("install_app", "vaultwarden", List.of(ProjectOsJobStep.pending("validate_host", "Checking this device")));
        repository.create("install_app", "jellyfin", List.of(ProjectOsJobStep.pending("validate_host", "Checking this device")));

        assertThat(repository.activeFor("install_app", "vaultwarden")).isPresent();
        assertThat(repository.activeFor("install_app", "missing")).isEmpty();
    }

    private ProjectOsJobRepository repository() {
        ProjectOsRuntimeProperties properties = new ProjectOsRuntimeProperties();
        properties.setRuntimeRoot(runtimeRoot.toString());
        return new ProjectOsJobRepository(new RuntimeLayout(properties), () -> Instant.parse("2026-06-20T12:00:00Z"));
    }
}
