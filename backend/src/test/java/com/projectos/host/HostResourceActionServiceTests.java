package com.projectos.host;

import static org.assertj.core.api.Assertions.assertThat;

import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import com.projectos.activity.ActivityLogRepository;
import com.projectos.activity.ActivityLogService;
import com.projectos.marketplace.catalog.ManifestValidator;
import com.projectos.marketplace.catalog.ManifestYamlReader;
import com.projectos.marketplace.catalog.MarketplaceCatalogService;
import com.projectos.marketplace.install.DockerOwnershipService;
import com.projectos.marketplace.install.InstalledAppRepository;
import com.projectos.marketplace.runtime.ProjectOsRuntimeProperties;
import com.projectos.marketplace.runtime.RuntimeLayout;
import com.projectos.system.ProjectOsIdentity;

class HostResourceActionServiceTests {

    @TempDir
    Path runtimeRoot;

    @Test
    void cleanupPlanForForeignResourcePreservesDataAndRemovesContainerOnly() {
        HostResourceActionService service = service(List.of(container("projectos_other_homepage", "homepage", "other-instance", "runtime-hash", "")));

        HostResourceCleanupPlan plan = service.cleanupPlan("docker:projectos_other_homepage");

        assertThat(plan.resourceId()).isEqualTo("docker:projectos_other_homepage");
        assertThat(plan.stopContainers()).containsExactly("projectos_other_homepage");
        assertThat(plan.removeContainers()).containsExactly("projectos_other_homepage");
        assertThat(plan.preserveData()).contains("Docker volumes and app data directories are preserved.");
        assertThat(plan.untouched()).contains("Backups", "Unknown host files");
        assertThat(plan.confirmationText()).isEqualTo("REMOVE HOMEPAGE CONTAINER");
    }

    @Test
    void cleanupRunsStopAndRemoveCommandsAfterConfirmation() {
        RecordingHostCommandRunner runner = new RecordingHostCommandRunner();
        HostResourceActionService service = service(List.of(container("projectos_other_homepage", "homepage", "other-instance", "runtime-hash", "")), runner);

        ActionResult result = service.cleanup("docker:projectos_other_homepage", new HostResourceCleanupRequest("REMOVE HOMEPAGE CONTAINER"));

        assertThat(result.ok()).isTrue();
        assertThat(runner.commands).containsExactly(
                List.of("docker", "stop", "projectos_other_homepage"),
                List.of("docker", "rm", "projectos_other_homepage"));
    }

    @Test
    void dataDeletionRequiresExactConfirmationAndDeletesOnlyPlannedPaths() throws Exception {
        Path dataPath = Files.createDirectories(runtimeRoot.resolve("legacy-data"));
        Files.writeString(dataPath.resolve("config.txt"), "old");
        HostResourceActionService service = service(List.of(container("project-os-homepage", "homepage", "", "", dataPath.toString())));

        HostResourceDataDeletionPlan plan = service.dataDeletionPlan("docker:project-os-homepage");
        ActionResult blocked = service.deleteData("docker:project-os-homepage", new HostResourceDataDeletionRequest("DELETE DATA"));
        ActionResult deleted = service.deleteData("docker:project-os-homepage", new HostResourceDataDeletionRequest(plan.confirmationText()));

        assertThat(plan.paths()).containsExactly(dataPath.toString());
        assertThat(plan.confirmationText()).isEqualTo("DELETE HOMEPAGE DATA");
        assertThat(blocked.ok()).isFalse();
        assertThat(deleted.ok()).isTrue();
        assertThat(dataPath).doesNotExist();
    }

    @Test
    void recoveryPlanAndRecoveryForLegacyResourceCreatesManagedAppRecordAndIgnoresFoundResource() {
        HostResourceActionService service = service(List.of(container("project-os-homepage", "homepage", "", "", runtimeRoot.resolve("apps/homepage").toString())));

        HostResourceRecoveryPlan plan = service.recoveryPlan("docker:project-os-homepage");
        ActionResult result = service.recover("docker:project-os-homepage", new HostResourceRecoveryRequest("RECOVER HOMEPAGE"));

        assertThat(plan.recoverable()).isTrue();
        assertThat(plan.steps()).contains("Add Homepage to this Project OS installation without deleting data.");
        assertThat(result.ok()).isTrue();
        assertThat(installedRepository().findById("homepage")).isPresent();
        assertThat(ignoreRepository().ignoredResourceIds()).contains("docker:project-os-homepage");
    }

    private HostResourceActionService service(List<HostDockerContainer> containers) {
        return service(containers, command -> new HostCommandResult(true, String.join(" ", command)));
    }

    private HostResourceActionService service(List<HostDockerContainer> containers, HostCommandRunner commandRunner) {
        RuntimeLayout layout = runtimeLayout();
        DockerOwnershipService ownershipService = new DockerOwnershipService(
                () -> new ProjectOsIdentity("current-instance", "project-os", runtimeRoot.toString(), "runtime-hash", Instant.parse("2026-06-20T12:00:00Z"), 1),
                () -> "0.2.0",
                false);
        HostInventoryService inventoryService = new HostInventoryService(() -> containers, ownershipService, ignoreRepository());
        return new HostResourceActionService(
                inventoryService,
                installedRepository(),
                ignoreRepository(),
                new MarketplaceCatalogService(new ManifestYamlReader(), new ManifestValidator()),
                new ActivityLogService(new ActivityLogRepository(layout)),
                commandRunner);
    }

    private InstalledAppRepository installedRepository() {
        return new InstalledAppRepository(runtimeLayout());
    }

    private HostInventoryIgnoreRepository ignoreRepository() {
        return new HostInventoryIgnoreRepository(runtimeLayout());
    }

    private RuntimeLayout runtimeLayout() {
        ProjectOsRuntimeProperties properties = new ProjectOsRuntimeProperties();
        properties.setRuntimeRoot(runtimeRoot.toString());
        return new RuntimeLayout(properties);
    }

    private HostDockerContainer container(String name, String appId, String instanceId, String runtimeHash, String dataPath) {
        java.util.LinkedHashMap<String, String> labels = new java.util.LinkedHashMap<>();
        labels.put(DockerOwnershipService.MANAGED, "true");
        labels.put(DockerOwnershipService.APP_ID, appId);
        labels.put(DockerOwnershipService.INSTANCE_ID, instanceId);
        labels.put(DockerOwnershipService.RUNTIME_ROOT_HASH, runtimeHash);
        labels.put(DockerOwnershipService.APP_INSTANCE_ID, "appinst_" + appId);
        labels.put(DockerOwnershipService.COMPOSE_PROJECT, name);
        if (!dataPath.isBlank()) {
            labels.put(HostInventoryService.DATA_PATHS_LABEL, dataPath);
        }
        return new HostDockerContainer(name, "project-os/" + appId + ":latest", "Up 2 minutes", Map.copyOf(labels), "0.0.0.0:8080->80/tcp");
    }

    private static class RecordingHostCommandRunner implements HostCommandRunner {
        private final List<List<String>> commands = new ArrayList<>();

        @Override
        public HostCommandResult run(List<String> command) {
            commands.add(command);
            return new HostCommandResult(true, String.join(" ", command));
        }
    }
}
