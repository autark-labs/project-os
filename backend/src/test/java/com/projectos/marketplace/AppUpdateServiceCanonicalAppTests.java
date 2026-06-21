package com.projectos.marketplace;

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
import com.projectos.marketplace.install.AppUpdateService;
import com.projectos.marketplace.install.AppUpdateStatus;
import com.projectos.marketplace.install.InstalledApp;
import com.projectos.marketplace.install.InstalledAppRepository;
import com.projectos.marketplace.runtime.ProjectOsRuntimeProperties;
import com.projectos.marketplace.runtime.RuntimeLayout;
import com.projectos.system.ProjectSettingsRepository;
import com.projectos.system.ProjectSettingsService;

class AppUpdateServiceCanonicalAppTests {

    @TempDir
    Path runtimeRoot;

    @Test
    void statusesOnlyIncludeCanonicalManagedApps() throws Exception {
        RuntimeLayout runtimeLayout = runtimeLayout();
        InstalledAppRepository repository = new InstalledAppRepository(runtimeLayout);
        repository.save(installed(runtimeLayout, "homepage", "Homepage"));
        repository.save(installed(runtimeLayout, "vaultwarden", "Vaultwarden"));
        ActivityLogService activityLogService = new ActivityLogService(new ActivityLogRepository(runtimeLayout));
        AppUpdateService service = new AppUpdateService(
                repository,
                new MarketplaceCatalogService(new ManifestYamlReader(), new ManifestValidator()),
                null,
                null,
                null,
                null,
                activityLogService,
                new ProjectSettingsService(new ProjectSettingsRepository(runtimeLayout), activityLogService),
                () -> List.of(appInstance("homepage")));

        assertThat(service.statuses())
                .extracting(AppUpdateStatus::appId)
                .containsExactly("homepage");
    }

    private InstalledApp installed(RuntimeLayout runtimeLayout, String appId, String name) throws Exception {
        Path appRoot = runtimeLayout.appRoot(appId);
        Files.createDirectories(appRoot);
        Files.writeString(appRoot.resolve("compose.yaml"), "services:\n  app:\n    image: example/" + appId + ":old\n");
        return new InstalledApp(appId, name, "Ready", appRoot.toString(), "project-os-" + appId, "http://localhost:8090", Instant.parse("2026-06-20T12:00:00Z"));
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

    private RuntimeLayout runtimeLayout() {
        ProjectOsRuntimeProperties properties = new ProjectOsRuntimeProperties();
        properties.setRuntimeRoot(runtimeRoot.toString());
        return new RuntimeLayout(properties);
    }
}
