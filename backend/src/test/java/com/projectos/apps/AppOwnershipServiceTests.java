package com.projectos.apps;

import static org.assertj.core.api.Assertions.assertThat;

import java.nio.file.Path;
import java.time.Instant;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import com.projectos.discover.DiscoverInstalledAppSummary;
import com.projectos.host.ExternalService;
import com.projectos.host.ExternalServiceRepository;
import com.projectos.host.HostInventoryResource;
import com.projectos.marketplace.catalog.ManifestValidator;
import com.projectos.marketplace.catalog.ManifestYamlReader;
import com.projectos.marketplace.catalog.MarketplaceCatalogService;
import com.projectos.marketplace.install.DockerOwnershipService;
import com.projectos.marketplace.install.InstalledApp;
import com.projectos.marketplace.install.InstalledAppOwnershipMetadata;
import com.projectos.marketplace.install.InstalledAppRepository;
import com.projectos.marketplace.runtime.ProjectOsRuntimeProperties;
import com.projectos.marketplace.runtime.RuntimeLayout;
import com.projectos.system.ProjectOsIdentity;

class AppOwnershipServiceTests {

    @TempDir
    Path runtimeRoot;

    @Test
    void returnsCanonicalOwnershipViewsSortedByNameWithManagedAppsOnlyMarkedInstalled() {
        InstalledAppRepository installedRepository = installedRepository();
        installedRepository.save(new InstalledApp(
                "vaultwarden",
                "Family Passwords",
                "Ready",
                runtimeRoot.resolve("apps/vaultwarden").toString(),
                "projectos_current_vaultwarden",
                "http://localhost:8090",
                Instant.parse("2026-06-21T12:00:00Z")));
        installedRepository.saveOwnershipMetadata(new InstalledAppOwnershipMetadata(
                "vaultwarden",
                "appinst_vaultwarden",
                "vaultwarden",
                "current-instance",
                "runtime-hash",
                "installed",
                "owned",
                Instant.parse("2026-06-21T12:00:00Z"),
                Instant.parse("2026-06-21T12:00:00Z")));
        installedRepository.save(new InstalledApp(
                "jellyfin",
                "Other Jellyfin",
                "Ready",
                runtimeRoot.resolve("apps/jellyfin").toString(),
                "projectos_other_jellyfin",
                "http://localhost:8096",
                Instant.parse("2026-06-21T12:00:00Z")));
        installedRepository.saveOwnershipMetadata(new InstalledAppOwnershipMetadata(
                "jellyfin",
                "appinst_jellyfin",
                "jellyfin",
                "other-instance",
                "other-hash",
                "installed",
                "owned",
                Instant.parse("2026-06-21T12:00:00Z"),
                Instant.parse("2026-06-21T12:00:00Z")));

        List<AppOwnershipView> views = service(installedRepository, List.of(
                resource("jellyfin", "foreign_project_os"),
                resource("homepage", "legacy_project_os"),
                resource("actual-budget", "unknown_conflict"))).apps();

        assertThat(views).isSortedAccordingTo((left, right) -> String.CASE_INSENSITIVE_ORDER.compare(left.name(), right.name()));
        assertThat(views).filteredOn(view -> view.catalogAppId().equals("vaultwarden"))
                .singleElement()
                .satisfies(view -> {
                    assertThat(view.state()).isEqualTo(AppOwnershipState.INSTALLED_MANAGED);
                    assertThat(view.stateLabel()).isEqualTo("Installed");
                    assertThat(view.statusTone()).isEqualTo("success");
                    assertThat(view.installed()).isTrue();
                    assertThat(view.ownedByCurrentInstance()).isTrue();
                    assertThat(view.installCopyWarningRequired()).isFalse();
                    assertThat(view.primaryAction()).isEqualTo(new AppOwnershipAction("manage", "Manage", "route", "/apps", null, false, ""));
                    assertThat(view.installedApp()).isEqualTo(new DiscoverInstalledAppSummary("vaultwarden", "Family Passwords", "Ready", "http://localhost:8090"));
                    assertThat(view.foundResource()).isNull();
                    assertThat(view.linkedService()).isNull();
                });
        assertThat(views).filteredOn(view -> view.catalogAppId().equals("jellyfin"))
                .singleElement()
                .satisfies(view -> {
                    assertThat(view.state()).isEqualTo(AppOwnershipState.MANAGED_ELSEWHERE);
                    assertThat(view.installed()).isFalse();
                    assertThat(view.ownedByCurrentInstance()).isFalse();
                    assertThat(view.installCopyWarningRequired()).isTrue();
                    assertThat(view.reviewExistingHref()).isEqualTo("/apps/found?resource=docker%3Afound_jellyfin");
                    assertThat(view.primaryAction().id()).isEqualTo("review_existing");
                    assertThat(view.availableActions()).extracting(AppOwnershipAction::id).contains("review_existing", "install_copy");
                    assertThat(view.installedApp()).isNull();
                    assertThat(view.foundResource()).isNotNull();
                });
        assertThat(views).filteredOn(view -> view.catalogAppId().equals("homepage"))
                .singleElement()
                .satisfies(view -> {
                    assertThat(view.state()).isEqualTo(AppOwnershipState.RECOVERABLE);
                    assertThat(view.stateLabel()).isEqualTo("Recoverable");
                    assertThat(view.primaryAction().id()).isEqualTo("review_existing");
                    assertThat(view.installCopyWarningRequired()).isTrue();
                });
        assertThat(views).filteredOn(view -> view.catalogAppId().equals("actual-budget"))
                .singleElement()
                .satisfies(view -> {
                    assertThat(view.state()).isEqualTo(AppOwnershipState.BLOCKED);
                    assertThat(view.statusTone()).isEqualTo("danger");
                    assertThat(view.installed()).isFalse();
                });
    }

    @Test
    void linkedServiceWinsBeforeFoundOnServerAndNeverLooksInstalled() {
        ExternalServiceRepository externalRepository = externalRepository();
        ExternalService linked = new ExternalService(
                "ext_jellyfin",
                "Media Server",
                "http://media.local",
                "Media",
                "LAN",
                true,
                "linked",
                "jellyfin",
                Instant.parse("2026-06-21T12:00:00Z"));
        externalRepository.save(linked);

        AppOwnershipView view = service(installedRepository(), externalRepository, List.of(resource("jellyfin", "external_docker"))).app("jellyfin").orElseThrow();

        assertThat(view.state()).isEqualTo(AppOwnershipState.LINKED_SERVICE);
        assertThat(view.stateLabel()).isEqualTo("Linked service");
        assertThat(view.statusTone()).isEqualTo("info");
        assertThat(view.installed()).isFalse();
        assertThat(view.ownedByCurrentInstance()).isFalse();
        assertThat(view.installCopyWarningRequired()).isTrue();
        assertThat(view.primaryAction()).isEqualTo(new AppOwnershipAction("review_existing", "Review existing service", "route", "/apps?linked=ext_jellyfin", null, false, ""));
        assertThat(view.availableActions()).extracting(AppOwnershipAction::id).contains("open", "review_existing", "install_copy");
        assertThat(view.linkedService()).isEqualTo(linked);
        assertThat(view.foundResource()).isNull();
    }

    @Test
    void legacyInstalledMetadataDoesNotCountAsCurrentInstanceInstalled() {
        InstalledAppRepository repository = installedRepository();
        repository.save(new InstalledApp(
                "homepage",
                "Homepage",
                "Ready",
                runtimeRoot.resolve("apps/homepage").toString(),
                "project-os-homepage",
                "http://localhost:3000",
                Instant.parse("2026-06-21T12:00:00Z")));
        repository.saveOwnershipMetadata(new InstalledAppOwnershipMetadata(
                "homepage",
                "appinst_homepage",
                "homepage",
                "",
                runtimeRoot.resolve("apps/homepage").toString(),
                "legacy_unscoped",
                "legacy_unscoped",
                Instant.parse("2026-06-21T12:00:00Z"),
                Instant.parse("2026-06-21T12:00:00Z")));

        AppOwnershipView view = service(repository, List.of()).app("homepage").orElseThrow();

        assertThat(view.state()).isEqualTo(AppOwnershipState.AVAILABLE);
        assertThat(view.installed()).isFalse();
        assertThat(view.ownedByCurrentInstance()).isFalse();
        assertThat(view.installedApp()).isNull();
    }

    private AppOwnershipService service(InstalledAppRepository installedRepository, List<HostInventoryResource> inventory) {
        return service(installedRepository, externalRepository(), inventory);
    }

    private AppOwnershipService service(InstalledAppRepository installedRepository, ExternalServiceRepository externalRepository, List<HostInventoryResource> inventory) {
        return new AppOwnershipService(
                catalogService(),
                installedRepository,
                includeIgnored -> inventory,
                externalRepository,
                dockerOwnershipService());
    }

    private MarketplaceCatalogService catalogService() {
        return new MarketplaceCatalogService(new ManifestYamlReader(), new ManifestValidator());
    }

    private InstalledAppRepository installedRepository() {
        return new InstalledAppRepository(runtimeLayout());
    }

    private ExternalServiceRepository externalRepository() {
        return new ExternalServiceRepository(runtimeLayout());
    }

    private DockerOwnershipService dockerOwnershipService() {
        return new DockerOwnershipService(
                () -> new ProjectOsIdentity("current-instance", "project-os", runtimeRoot.toString(), "runtime-hash", Instant.parse("2026-06-20T12:00:00Z"), 1),
                () -> "0.2.0",
                false);
    }

    private RuntimeLayout runtimeLayout() {
        ProjectOsRuntimeProperties properties = new ProjectOsRuntimeProperties();
        properties.setRuntimeRoot(runtimeRoot.toString());
        return new RuntimeLayout(properties);
    }

    private HostInventoryResource resource(String catalogAppId, String ownershipState) {
        return new HostInventoryResource(
                "docker:found_" + catalogAppId,
                catalogAppId,
                catalogAppId,
                ownershipState,
                "observed",
                "other-instance",
                "current-instance",
                "running",
                List.of("http://localhost:8080"),
                "docker",
                List.of("view_details", "open"),
                false,
                "medium",
                "Found matching service for " + catalogAppId + ".",
                Map.of());
    }
}
