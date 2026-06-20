package com.projectos.system;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Instant;
import java.util.List;
import java.util.function.Supplier;

import org.junit.jupiter.api.Test;

import com.projectos.api.ProjectOsAction;
import com.projectos.api.ProjectOsIssue;
import com.projectos.api.ProjectOsIssueFactory;

class RecommendedActionServiceTests {

    @Test
    void setupIncompleteTakesPriorityOverOtherNonCriticalIssues() {
        RecommendedActionService service = service(summary(
                setup(false),
                docker(true),
                List.of(ProjectOsIssueFactory.backupIssue("first-backup", "vaultwarden", "warning", "backup_enabled_no_restore_point", "Create your first restore point", "Vaultwarden has backups enabled but no restore point yet.", ProjectOsAction.route("open-backups", "Open backups", "/backups")))));

        RecommendedAction action = service.current();

        assertThat(action.id()).isEqualTo("complete-setup");
        assertThat(action.severity()).isEqualTo("warning");
        assertThat(action.dismissible()).isFalse();
    }

    @Test
    void dockerUnavailableIsCriticalAndCannotBeDismissed() {
        ProjectOsIssue dockerIssue = ProjectOsIssueFactory.systemIssue("docker-unavailable", "critical", "docker_unavailable", "Docker is not ready", "Project OS needs Docker before it can install apps.", ProjectOsAction.route("open-diagnostics", "View diagnostics", "/diagnostics"));
        InMemoryRecommendedActionDismissals dismissals = new InMemoryRecommendedActionDismissals();
        RecommendedActionService service = service(summary(setup(true), docker(false), List.of(dockerIssue)), dismissals);

        service.dismiss("docker-unavailable");
        RecommendedAction action = service.current();

        assertThat(action.id()).isEqualTo("docker-unavailable");
        assertThat(action.severity()).isEqualTo("critical");
        assertThat(action.dismissible()).isFalse();
    }

    @Test
    void dismissedBackupNudgeFallsThroughToNoActionNeeded() {
        ProjectOsIssue backupIssue = ProjectOsIssueFactory.backupIssue("first-backup", "vaultwarden", "warning", "backup_enabled_no_restore_point", "Create your first restore point", "Vaultwarden has backups enabled but no restore point yet.", ProjectOsAction.route("open-backups", "Open backups", "/backups"));
        InMemoryRecommendedActionDismissals dismissals = new InMemoryRecommendedActionDismissals();
        RecommendedActionService service = service(summary(setup(true), docker(true), List.of(backupIssue)), dismissals);

        service.dismiss("first-backup");

        assertThat(service.current().id()).isEqualTo("no-action-needed");
        assertThat(service.current().severity()).isEqualTo("success");
    }

    private RecommendedActionService service(SystemSummary summary) {
        return service(summary, new InMemoryRecommendedActionDismissals());
    }

    private RecommendedActionService service(SystemSummary summary, RecommendedActionDismissals dismissals) {
        return new RecommendedActionService((Supplier<SystemSummary>) () -> summary, dismissals);
    }

    private SystemSummary summary(SetupProgressSummary setup, DockerSummary docker, List<ProjectOsIssue> issues) {
        return new SystemSummary(
                "project-os-test",
                "pos_test",
                "http://localhost:8082",
                setup,
                docker,
                new AccessSummary("local_only", "Local access is ready."),
                new AppsSummary(1, 1, 0, List.of()),
                new BackupSummary("not_configured", "No restore point is required yet."),
                new StorageSummary("unknown", "Storage details are available from the Storage page."),
                issues,
                Instant.parse("2026-06-20T12:00:00Z"));
    }

    private SetupProgressSummary setup(boolean complete) {
        return new SetupProgressSummary(complete, complete ? "ready" : "needs_admin_setup", complete ? "done" : "host_check", complete ? "Setup complete." : "Setup is not complete.");
    }

    private DockerSummary docker(boolean ready) {
        return new DockerSummary(ready, ready ? "Docker is ready." : "Docker is not ready.");
    }
}
