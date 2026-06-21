package com.projectos.system;

import static org.assertj.core.api.Assertions.assertThat;

import java.nio.file.Files;
import java.nio.file.Path;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import com.projectos.activity.ActivityLogRepository;
import com.projectos.activity.ActivityLogService;
import com.projectos.marketplace.install.AppInstanceView;
import com.projectos.marketplace.install.InstalledApp;
import com.projectos.marketplace.install.InstalledAppRepository;
import com.projectos.marketplace.runtime.ProjectOsRuntimeProperties;
import com.projectos.marketplace.runtime.RuntimeLayout;
import com.projectos.system.api.RuntimeMigrationPlan;

import java.time.Instant;
import java.util.List;

class StorageServiceTests {

    @TempDir
    Path tempDir;

    @Test
    void plansExecutableRuntimeMigrationForSeparateAbsoluteTarget() throws Exception {
        RuntimeLayout layout = runtimeLayout(tempDir.resolve("runtime"));
        Files.createDirectories(layout.runtimeRoot().resolve("apps"));
        StorageService service = storageService(layout);

        RuntimeMigrationPlan plan = service.migrationPlan(tempDir.resolve("external/project-os-data").toString());

        assertThat(plan.status()).isEqualTo("ready");
        assertThat(plan.executable()).isTrue();
        assertThat(plan.sourcePath()).isEqualTo(layout.runtimeRoot().toAbsolutePath().normalize().toString());
        assertThat(plan.targetPath()).endsWith("external/project-os-data");
        assertThat(plan.steps()).extracting(RuntimeMigrationPlan.Step::id)
                .containsExactly("backup", "stop-service", "sync-data", "validate-copy", "update-env", "fix-permissions", "restart-service", "verify");
        assertThat(plan.rollbackGuidance()).isNotEmpty();
    }

    @Test
    void rejectsUnsafeRuntimeMigrationTargets() throws Exception {
        RuntimeLayout layout = runtimeLayout(tempDir.resolve("runtime"));
        Files.createDirectories(layout.runtimeRoot());
        StorageService service = storageService(layout);

        RuntimeMigrationPlan relative = service.migrationPlan("relative/path");
        RuntimeMigrationPlan current = service.migrationPlan(layout.runtimeRoot().toString());
        RuntimeMigrationPlan child = service.migrationPlan(layout.runtimeRoot().resolve("child").toString());

        assertThat(relative.executable()).isFalse();
        assertThat(relative.blockedReasons()).anyMatch(reason -> reason.contains("absolute"));
        assertThat(current.executable()).isFalse();
        assertThat(current.blockedReasons()).anyMatch(reason -> reason.contains("current runtime"));
        assertThat(child.executable()).isFalse();
        assertThat(child.blockedReasons()).anyMatch(reason -> reason.contains("inside the current runtime"));
    }

    @Test
    void reportOnlyIncludesCanonicalManagedApps() throws Exception {
        RuntimeLayout layout = runtimeLayout(tempDir.resolve("runtime"));
        Files.createDirectories(layout.appRoot("homepage"));
        Files.createDirectories(layout.appRoot("vaultwarden"));
        InstalledAppRepository repository = new InstalledAppRepository(layout);
        repository.save(installed(layout, "homepage", "Homepage"));
        repository.save(installed(layout, "vaultwarden", "Vaultwarden"));
        StorageService service = new StorageService(
                layout,
                repository,
                new ActivityLogService(new ActivityLogRepository(layout)),
                new StorageSampleRepository(layout),
                () -> List.of(appInstance("homepage")),
                new RuntimeFileOperations());

        StorageReport report = service.report();

        assertThat(report.apps()).extracting(AppStorageUsage::appId).containsExactly("homepage");
        assertThat(report.orphanedData()).extracting(OrphanedStorage::name).contains("vaultwarden");
    }

    private StorageService storageService(RuntimeLayout layout) {
        return new StorageService(
                layout,
                new InstalledAppRepository(layout),
                new ActivityLogService(new ActivityLogRepository(layout)),
                new StorageSampleRepository(layout),
                new RuntimeFileOperations());
    }

    private InstalledApp installed(RuntimeLayout layout, String appId, String name) {
        return new InstalledApp(appId, name, "Ready", layout.appRoot(appId).toString(), "project-os-" + appId, "http://localhost:8090", Instant.parse("2026-06-20T12:00:00Z"));
    }

    private AppInstanceView appInstance(String appId) {
        return new AppInstanceView(
                "appinst_" + appId,
                appId,
                appId,
                "General",
                "",
                "Ready",
                "ready",
                "running",
                "owned",
                "local_ready",
                "backup_disabled",
                "http://localhost:8090",
                null,
                List.of(),
                List.of(),
                Instant.parse("2026-06-20T12:00:00Z"));
    }

    private RuntimeLayout runtimeLayout(Path runtimeRoot) {
        ProjectOsRuntimeProperties properties = new ProjectOsRuntimeProperties();
        properties.setRuntimeRoot(runtimeRoot.toString());
        return new RuntimeLayout(properties);
    }
}
