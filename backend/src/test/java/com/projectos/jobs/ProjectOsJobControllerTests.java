package com.projectos.jobs;

import static org.assertj.core.api.Assertions.assertThat;

import java.nio.file.Path;
import java.time.Instant;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import com.projectos.marketplace.runtime.ProjectOsRuntimeProperties;
import com.projectos.marketplace.runtime.RuntimeLayout;

class ProjectOsJobControllerTests {

    @TempDir
    Path runtimeRoot;

    @Test
    void exposesListReadAndCancelOperations() {
        ProjectOsJobService service = service();
        ProjectOsJob job = service.start("backup", "vaultwarden", List.of(ProjectOsJobStep.pending("backup", "Creating restore point")), () -> ProjectOsJobOutcome.succeeded("Backup complete."));
        ProjectOsJobController controller = new ProjectOsJobController(service);

        assertThat(controller.jobs()).extracting(ProjectOsJob::jobId).containsExactly(job.jobId());
        assertThat(controller.job(job.jobId()).getBody()).isEqualTo(job);
        assertThat(controller.cancel(job.jobId()).getBody().status()).isEqualTo("cancelled");
        assertThat(controller.job("missing").getStatusCode().value()).isEqualTo(404);
    }

    private ProjectOsJobService service() {
        ProjectOsRuntimeProperties properties = new ProjectOsRuntimeProperties();
        properties.setRuntimeRoot(runtimeRoot.toString());
        ProjectOsJobRepository repository = new ProjectOsJobRepository(new RuntimeLayout(properties), () -> Instant.parse("2026-06-20T12:00:00Z"));
        return new ProjectOsJobService(repository, Runnable::run, false);
    }
}
