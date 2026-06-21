package com.projectos.apps;

import java.util.Comparator;
import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;

import com.projectos.discover.DiscoverInstalledAppSummary;
import com.projectos.host.ExternalService;
import com.projectos.host.ExternalServiceRepository;
import com.projectos.host.HostInventoryProvider;
import com.projectos.host.HostInventoryResource;
import com.projectos.marketplace.catalog.MarketplaceCatalogService;
import com.projectos.marketplace.install.DockerOwnershipService;
import com.projectos.marketplace.install.InstalledApp;
import com.projectos.marketplace.install.InstalledAppOwnershipMetadata;
import com.projectos.marketplace.install.InstalledAppRepository;
import com.projectos.marketplace.model.ApplicationManifest;

@Service
public class AppOwnershipService implements AppOwnershipProvider {

    private final MarketplaceCatalogService catalogService;
    private final InstalledAppRepository installedAppRepository;
    private final HostInventoryProvider hostInventoryProvider;
    private final ExternalServiceRepository externalServiceRepository;
    private final DockerOwnershipService dockerOwnershipService;

    public AppOwnershipService(
            MarketplaceCatalogService catalogService,
            InstalledAppRepository installedAppRepository,
            HostInventoryProvider hostInventoryProvider,
            ExternalServiceRepository externalServiceRepository,
            DockerOwnershipService dockerOwnershipService) {
        this.catalogService = catalogService;
        this.installedAppRepository = installedAppRepository;
        this.hostInventoryProvider = hostInventoryProvider;
        this.externalServiceRepository = externalServiceRepository;
        this.dockerOwnershipService = dockerOwnershipService;
    }

    @Override
    public List<AppOwnershipView> apps() {
        List<HostInventoryResource> inventory = hostInventoryProvider.inventory(false);
        List<ExternalService> linkedServices = externalServiceRepository.findAll();
        return catalogService.findAll().stream()
                .map(manifest -> appView(manifest, inventory, linkedServices))
                .sorted(Comparator.comparing(AppOwnershipView::name, String.CASE_INSENSITIVE_ORDER))
                .toList();
    }

    public Optional<AppOwnershipView> app(String appId) {
        List<HostInventoryResource> inventory = hostInventoryProvider.inventory(false);
        List<ExternalService> linkedServices = externalServiceRepository.findAll();
        return catalogService.findById(appId)
                .map(manifest -> appView(manifest, inventory, linkedServices));
    }

    private AppOwnershipView appView(ApplicationManifest manifest, List<HostInventoryResource> inventory, List<ExternalService> linkedServices) {
        InstalledApp installed = installedAppRepository.findById(manifest.id())
                .filter(app -> ownershipCompatible(manifest.id()))
                .orElse(null);
        HostInventoryResource recoverable = matchingResource(manifest.id(), inventory, "legacy_project_os").orElse(null);
        HostInventoryResource managedElsewhere = matchingResource(manifest.id(), inventory, "foreign_project_os").orElse(null);
        HostInventoryResource blocked = matchingResource(manifest.id(), inventory, "unknown_conflict").orElse(null);
        ExternalService linkedService = matchingLinkedService(manifest.id(), linkedServices).orElse(null);
        HostInventoryResource found = matchingFoundResource(manifest.id(), inventory).orElse(null);

        AppOwnershipState state = state(installed, recoverable, managedElsewhere, blocked, linkedService, found);
        HostInventoryResource foundResource = switch (state) {
            case RECOVERABLE -> recoverable;
            case MANAGED_ELSEWHERE -> managedElsewhere;
            case BLOCKED -> blocked;
            case FOUND_ON_SERVER -> found;
            default -> null;
        };
        ExternalService visibleLinkedService = state == AppOwnershipState.LINKED_SERVICE ? linkedService : null;
        String reviewExistingHref = reviewExistingHref(state, foundResource, visibleLinkedService);
        AppOwnershipAction primaryAction = primaryAction(manifest.id(), state, installed, foundResource, visibleLinkedService, reviewExistingHref);
        return new AppOwnershipView(
                manifest.id(),
                manifest.name(),
                manifest.category(),
                manifest.image(),
                firstPresent(manifest.shortValue(), manifest.plainLanguage(), manifest.description()),
                firstPresent(manifest.plainLanguage(), manifest.description()),
                state,
                stateLabel(state),
                stateDescription(state, foundResource),
                statusTone(state),
                state == AppOwnershipState.INSTALLED_MANAGED,
                state == AppOwnershipState.INSTALLED_MANAGED,
                duplicateWarningRequired(state),
                reviewExistingHref,
                primaryAction,
                availableActions(manifest.id(), state, installed, foundResource, visibleLinkedService, reviewExistingHref),
                installed == null ? null : new DiscoverInstalledAppSummary(installed.appId(), installed.appName(), installed.status(), installed.accessUrl()),
                foundResource,
                visibleLinkedService);
    }

    private boolean ownershipCompatible(String appId) {
        Optional<InstalledAppOwnershipMetadata> metadata = installedAppRepository.ownershipFor(appId);
        if (metadata.isEmpty()) {
            return true;
        }
        InstalledAppOwnershipMetadata ownership = metadata.get();
        if ("owned".equals(ownership.ownershipStatus())) {
            String instanceId = ownership.projectOsInstanceId();
            return instanceId == null || instanceId.isBlank() || instanceId.equals(dockerOwnershipService.currentIdentity().instanceId());
        }
        return false;
    }

    private AppOwnershipState state(
            InstalledApp installed,
            HostInventoryResource recoverable,
            HostInventoryResource managedElsewhere,
            HostInventoryResource blocked,
            ExternalService linkedService,
            HostInventoryResource found) {
        if (installed != null) {
            return AppOwnershipState.INSTALLED_MANAGED;
        }
        if (recoverable != null) {
            return AppOwnershipState.RECOVERABLE;
        }
        if (managedElsewhere != null) {
            return AppOwnershipState.MANAGED_ELSEWHERE;
        }
        if (blocked != null) {
            return AppOwnershipState.BLOCKED;
        }
        if (linkedService != null) {
            return AppOwnershipState.LINKED_SERVICE;
        }
        if (found != null) {
            return AppOwnershipState.FOUND_ON_SERVER;
        }
        return AppOwnershipState.AVAILABLE;
    }

    private Optional<HostInventoryResource> matchingResource(String appId, List<HostInventoryResource> inventory, String ownershipState) {
        return inventory.stream()
                .filter(resource -> appId.equals(resource.catalogAppId()))
                .filter(resource -> ownershipState.equals(resource.ownershipState()))
                .findFirst();
    }

    private Optional<HostInventoryResource> matchingFoundResource(String appId, List<HostInventoryResource> inventory) {
        return inventory.stream()
                .filter(resource -> appId.equals(resource.catalogAppId()))
                .filter(resource -> !"owned_managed".equals(resource.ownershipState()))
                .findFirst();
    }

    private Optional<ExternalService> matchingLinkedService(String appId, List<ExternalService> linkedServices) {
        return linkedServices.stream()
                .filter(service -> appId.equals(service.catalogAppId()))
                .findFirst();
    }

    private List<AppOwnershipAction> availableActions(
            String appId,
            AppOwnershipState state,
            InstalledApp installed,
            HostInventoryResource foundResource,
            ExternalService linkedService,
            String reviewExistingHref) {
        return switch (state) {
            case INSTALLED_MANAGED -> installedActions(installed);
            case LINKED_SERVICE -> linkedActions(appId, linkedService, reviewExistingHref);
            case FOUND_ON_SERVER, RECOVERABLE, MANAGED_ELSEWHERE, BLOCKED -> existingServiceActions(appId, foundResource, reviewExistingHref);
            case COMING_SOON -> List.of(unavailable());
            default -> List.of(reviewSetup(appId));
        };
    }

    private List<AppOwnershipAction> installedActions(InstalledApp installed) {
        if (installed.accessUrl() == null || installed.accessUrl().isBlank()) {
            return List.of(manage());
        }
        return List.of(manage(), open(installed.accessUrl()));
    }

    private List<AppOwnershipAction> linkedActions(String appId, ExternalService linkedService, String reviewExistingHref) {
        if (linkedService.url() == null || linkedService.url().isBlank()) {
            return List.of(reviewExisting(reviewExistingHref), installCopy(appId));
        }
        return List.of(open(linkedService.url()), reviewExisting(reviewExistingHref), installCopy(appId));
    }

    private List<AppOwnershipAction> existingServiceActions(String appId, HostInventoryResource foundResource, String reviewExistingHref) {
        if (foundResource != null && foundResource.accessUrls() != null && !foundResource.accessUrls().isEmpty()) {
            return List.of(open(foundResource.accessUrls().getFirst()), reviewExisting(reviewExistingHref), installCopy(appId));
        }
        return List.of(reviewExisting(reviewExistingHref), installCopy(appId));
    }

    private AppOwnershipAction primaryAction(
            String appId,
            AppOwnershipState state,
            InstalledApp installed,
            HostInventoryResource foundResource,
            ExternalService linkedService,
            String reviewExistingHref) {
        return switch (state) {
            case INSTALLED_MANAGED -> manage();
            case LINKED_SERVICE, FOUND_ON_SERVER, RECOVERABLE, MANAGED_ELSEWHERE, BLOCKED -> reviewExisting(reviewExistingHref);
            case COMING_SOON -> unavailable();
            default -> reviewSetup(appId);
        };
    }

    private String reviewExistingHref(AppOwnershipState state, HostInventoryResource foundResource, ExternalService linkedService) {
        if (state == AppOwnershipState.LINKED_SERVICE && linkedService != null) {
            return "/apps?linked=" + encode(linkedService.id());
        }
        if (foundResource != null) {
            return "/apps/found?resource=" + encode(foundResource.id());
        }
        return null;
    }

    private AppOwnershipAction reviewSetup(String appId) {
        return new AppOwnershipAction("review_setup", "Review setup", "route", "/discover?app=" + encode(appId), null, false, "");
    }

    private AppOwnershipAction manage() {
        return new AppOwnershipAction("manage", "Manage", "route", "/apps", null, false, "");
    }

    private AppOwnershipAction open(String url) {
        return new AppOwnershipAction("open", "Open", "external", url, null, false, "");
    }

    private AppOwnershipAction reviewExisting(String href) {
        return new AppOwnershipAction("review_existing", "Review existing service", "route", href, null, false, "");
    }

    private AppOwnershipAction installCopy(String appId) {
        return new AppOwnershipAction("install_copy", "Install second copy anyway", "install", "/api/discover/apps/" + appId + "/install", "POST", false, "");
    }

    private AppOwnershipAction unavailable() {
        return new AppOwnershipAction("unavailable", "Unavailable", "disabled", null, null, true, "This app is not available yet.");
    }

    private String stateLabel(AppOwnershipState state) {
        return switch (state) {
            case INSTALLED_MANAGED -> "Installed";
            case LINKED_SERVICE -> "Linked service";
            case FOUND_ON_SERVER -> "Found on server";
            case RECOVERABLE -> "Recoverable";
            case MANAGED_ELSEWHERE -> "Managed elsewhere";
            case BLOCKED -> "Blocked";
            case COMING_SOON -> "Coming soon";
            default -> "Available";
        };
    }

    private String stateDescription(AppOwnershipState state, HostInventoryResource foundResource) {
        return switch (state) {
            case INSTALLED_MANAGED -> "Managed by this Project OS installation.";
            case LINKED_SERVICE -> "Linked as an external service. Project OS does not manage its runtime.";
            case FOUND_ON_SERVER, RECOVERABLE, MANAGED_ELSEWHERE, BLOCKED -> foundResource == null ? "" : foundResource.summary();
            case COMING_SOON -> "This app is not available yet.";
            default -> "Ready to review before install.";
        };
    }

    private String statusTone(AppOwnershipState state) {
        return switch (state) {
            case INSTALLED_MANAGED -> "success";
            case LINKED_SERVICE -> "info";
            case RECOVERABLE, MANAGED_ELSEWHERE -> "warning";
            case BLOCKED -> "danger";
            default -> "neutral";
        };
    }

    private boolean duplicateWarningRequired(AppOwnershipState state) {
        return state == AppOwnershipState.LINKED_SERVICE
                || state == AppOwnershipState.FOUND_ON_SERVER
                || state == AppOwnershipState.RECOVERABLE
                || state == AppOwnershipState.MANAGED_ELSEWHERE
                || state == AppOwnershipState.BLOCKED;
    }

    private String firstPresent(String... values) {
        for (String value : values) {
            if (value != null && !value.isBlank()) {
                return value;
            }
        }
        return "";
    }

    private String encode(String value) {
        return java.net.URLEncoder.encode(value, java.nio.charset.StandardCharsets.UTF_8);
    }
}
