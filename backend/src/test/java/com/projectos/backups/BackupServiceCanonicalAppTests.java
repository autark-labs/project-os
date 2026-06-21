package com.projectos.backups;

import static org.assertj.core.api.Assertions.assertThat;

import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import com.projectos.activity.ActivityLogRepository;
import com.projectos.activity.ActivityLogService;
import com.projectos.marketplace.catalog.ManifestValidator;
import com.projectos.marketplace.catalog.ManifestYamlReader;
import com.projectos.marketplace.catalog.MarketplaceCatalogService;
import com.projectos.marketplace.install.AppInstanceView;
import com.projectos.marketplace.install.AppLifecycleService;
import com.projectos.marketplace.install.BackupPolicy;
import com.projectos.marketplace.install.DockerComposeExecutor;
import com.projectos.marketplace.install.DockerComposeResult;
import com.projectos.marketplace.install.DockerContainerStatus;
import com.projectos.marketplace.install.InstallSettings;
import com.projectos.marketplace.install.InstalledApp;
import com.projectos.marketplace.install.InstalledAppRepository;
import com.projectos.marketplace.install.PostInstallGuideBuilder;
import com.projectos.marketplace.install.ContainerTelemetry;
import com.projectos.marketplace.runtime.ProjectOsRuntimeProperties;
import com.projectos.marketplace.runtime.RuntimeLayout;
import com.projectos.network.tailscale.TailscaleService;
import com.projectos.system.ProjectSettingsRepository;
import com.projectos.system.ProjectSettingsService;
import com.projectos.system.RuntimeFileOperations;

class BackupServiceCanonicalAppTests {

    @TempDir
    Path runtimeRoot;

    @Test
    void reportOnlyIncludesCanonicalManagedApps() throws Exception {
        RuntimeLayout runtimeLayout = runtimeLayout();
        InstalledAppRepository installedRepository = new InstalledAppRepository(runtimeLayout);
        BackupRepository backupRepository = new BackupRepository(runtimeLayout);
        MarketplaceCatalogService catalogService = new MarketplaceCatalogService(new ManifestYamlReader(), new ManifestValidator());
        InstalledApp homepage = installed("homepage", "Homepage", runtimeLayout);
        InstalledApp staleVaultwarden = installed("vaultwarden", "Vaultwarden", runtimeLayout);
        installedRepository.save(homepage);
        installedRepository.save(staleVaultwarden);
        installedRepository.saveSettings("homepage", new InstallSettings(homepage.accessUrl(), null, false, java.util.Map.of(), new BackupPolicy(true, "daily", 7)));
        installedRepository.saveSettings("vaultwarden", new InstallSettings(staleVaultwarden.accessUrl(), null, false, java.util.Map.of(), new BackupPolicy(true, "daily", 7)));

        BackupService service = new BackupService(
                runtimeLayout,
                installedRepository,
                backupRepository,
                new ActivityLogService(new ActivityLogRepository(runtimeLayout)),
                new ProjectSettingsRepository(runtimeLayout),
                new ProjectSettingsService(new ProjectSettingsRepository(runtimeLayout), new ActivityLogService(new ActivityLogRepository(runtimeLayout))),
                appLifecycleService(runtimeLayout, installedRepository, catalogService, backupRepository),
                catalogService,
                () -> List.of(appInstance("homepage", "Homepage")),
                new RuntimeFileOperations());

        BackupReport report = service.report();

        assertThat(report.totalApps()).isEqualTo(1);
        assertThat(report.apps()).extracting(AppBackupStatus::appId).containsExactly("homepage");
    }

    private AppLifecycleService appLifecycleService(RuntimeLayout runtimeLayout, InstalledAppRepository repository, MarketplaceCatalogService catalogService, BackupRepository backupRepository) {
        return new AppLifecycleService(
                repository,
                new NoopDockerComposeExecutor(),
                catalogService,
                List::of,
                runtimeLayout,
                new PostInstallGuideBuilder(),
                new TailscaleService(),
                false,
                null,
                backupRepository);
    }

    private AppInstanceView appInstance(String appId, String name) {
        return new AppInstanceView(
                "appinst_" + appId,
                appId,
                name,
                "General",
                "",
                "Ready",
                "ready",
                "running",
                "owned",
                "local_ready",
                "backup_enabled_no_restore_point",
                "http://localhost:8090",
                null,
                List.of(),
                List.of(),
                Instant.parse("2026-06-20T12:00:00Z"));
    }

    private InstalledApp installed(String appId, String name, RuntimeLayout runtimeLayout) throws Exception {
        Path appRoot = runtimeLayout.appRoot(appId);
        Files.createDirectories(appRoot);
        return new InstalledApp(appId, name, "Ready", appRoot.toString(), "project-os-" + appId, "http://localhost:8090", Instant.parse("2026-06-20T12:00:00Z"));
    }

    private RuntimeLayout runtimeLayout() {
        ProjectOsRuntimeProperties properties = new ProjectOsRuntimeProperties();
        properties.setRuntimeRoot(runtimeRoot.toString());
        return new RuntimeLayout(properties);
    }

    private static class NoopDockerComposeExecutor implements DockerComposeExecutor {
        @Override
        public DockerComposeResult up(Path composeFile, String projectName) {
            return new DockerComposeResult(0, List.of());
        }

        @Override
        public DockerComposeResult stop(Path composeFile, String projectName) {
            return new DockerComposeResult(0, List.of());
        }

        @Override
        public DockerComposeResult restart(Path composeFile, String projectName) {
            return new DockerComposeResult(0, List.of());
        }

        @Override
        public DockerComposeResult down(Path composeFile, String projectName) {
            return new DockerComposeResult(0, List.of());
        }

        @Override
        public DockerComposeResult ps(Path composeFile, String projectName) {
            return new DockerComposeResult(0, List.of());
        }

        @Override
        public List<DockerContainerStatus> containers(Path composeFile, String projectName) {
            return List.of();
        }

        @Override
        public List<ContainerTelemetry> stats(List<String> containerNames) {
            return List.of();
        }
    }
}
