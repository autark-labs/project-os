package com.projectos.apps;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Instant;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import com.projectos.host.ObservedServiceRepository;
import com.projectos.host.ObservedServiceScanner;
import com.projectos.host.ObservedServiceService;
import com.projectos.host.ObservedServiceView;
import com.projectos.marketplace.install.AppInstanceView;
import com.projectos.marketplace.runtime.ProjectOsRuntimeProperties;
import com.projectos.marketplace.runtime.RuntimeLayout;

import java.nio.file.Path;

class ApplicationStateServiceTests {

    @TempDir
    Path runtimeRoot;

    @Test
    void snapshotIncludesEveryPinnedObservedServiceEvenWithoutCatalogMatch() {
        ObservedServiceRepository repository = repository();
        repository.upsert(pinned("manual:gitlab", "gitlab"));
        repository.upsert(pinned("docker:compassionate_mclean", "compassionate_mclean"));
        repository.upsert(found("docker:vaultwarden", "vaultwarden"));
        ObservedServiceService observedServiceService = new ObservedServiceService(repository, noScan());
        ApplicationStateService service = new ApplicationStateService(
                List::of,
                List::of,
                observedServiceService,
                null,
                Instant::now);

        ApplicationState state = service.snapshot();

        assertThat(state.pinnedExternalServices())
                .extracting(ObservedServiceView::id)
                .containsExactlyInAnyOrder("manual:gitlab", "docker:compassionate_mclean");
    }

    @Test
    void snapshotIsCachedForOneRequestWindow() {
        AtomicInteger managedCalls = new AtomicInteger();
        ApplicationStateService service = new ApplicationStateService(
                () -> {
                    managedCalls.incrementAndGet();
                    return List.of(appInstance());
                },
                List::of,
                new ObservedServiceService(repository(), noScan()),
                null,
                () -> Instant.parse("2026-06-21T12:00:00Z"));

        service.snapshot();
        service.snapshot();

        assertThat(managedCalls).hasValue(1);
    }

    private ObservedServiceScanner noScan() {
        return new ObservedServiceScanner(List::of, () -> new com.projectos.system.ProjectOsIdentity("", "project-os", "", "", Instant.EPOCH, 1));
    }

    private com.projectos.host.ObservedService pinned(String id, String name) {
        return service(id, name, "pinned");
    }

    private com.projectos.host.ObservedService found(String id, String name) {
        return service(id, name, "visible");
    }

    private com.projectos.host.ObservedService service(String id, String name, String visibility) {
        return new com.projectos.host.ObservedService(
                id,
                "docker",
                id,
                name,
                null,
                "External",
                "LAN",
                null,
                "unknown",
                "external",
                visibility,
                "running",
                false,
                "",
                Instant.parse("2026-06-21T12:00:00Z"),
                Instant.parse("2026-06-21T12:00:00Z"),
                "pinned".equals(visibility) ? Instant.parse("2026-06-21T12:00:00Z") : null,
                null,
                "{}");
    }

    private AppInstanceView appInstance() {
        return new AppInstanceView(
                "appinst_homepage",
                "homepage",
                "Homepage",
                "Dashboards",
                "",
                "Ready",
                "ready",
                "running",
                "owned",
                "local_ready",
                "backup_disabled",
                "http://localhost:3005",
                null,
                List.of(),
                List.of(),
                Instant.parse("2026-06-21T12:00:00Z"));
    }

    private ObservedServiceRepository repository() {
        return new ObservedServiceRepository(runtimeLayout());
    }

    private RuntimeLayout runtimeLayout() {
        ProjectOsRuntimeProperties properties = new ProjectOsRuntimeProperties();
        properties.setRuntimeRoot(runtimeRoot.toString());
        return new RuntimeLayout(properties);
    }
}
