# Unified App Ownership Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build one canonical app ownership state model used by both Discover and My Apps, so managed installs, detected services, linked services, recoverable apps, and duplicate-install warnings behave consistently.

**Architecture:** Add a backend ownership read model that merges catalog apps, current-instance installed apps, host inventory, and linked external services into one canonical state per catalog app. Discover and My Apps consume that same model instead of independently deriving ownership, while host inventory actions remain the execution layer for recovery/adoption/cleanup and linked-service actions. Backwards compatibility is explicitly out of scope; remove old frontend derivation and response normalization when it conflicts with the new contract.

**Tech Stack:** Spring Boot 4.1, Java records/services/controllers, SQLite/Flyway migrations, React 18, TypeScript, shadcn/Radix primitives, Tailwind, existing `node:test` frontend test style.

**Coordination Contract:** Implement from `docs/superpowers/specs/2026-06-21-unified-app-ownership-contract.md`. That contract is authoritative for `AppOwnershipView`, `AppOwnershipAction`, state names, state priority, sorting, nullable fields, current-instance ownership checks, linked-service schema, page responsibilities, and duplicate-install warning copy. If any inline code example below differs from the coordination contract, update the code to the contract instead of preserving the older example.

---

## File Map

### Backend Create

- `backend/src/main/java/com/projectos/apps/AppOwnershipState.java`  
  Canonical ownership-state enum-like constants and helpers.

- `backend/src/main/java/com/projectos/apps/AppOwnershipView.java`  
  Shared read model for Marketplace/Discover and My Apps.

- `backend/src/main/java/com/projectos/apps/AppOwnershipAction.java`  
  User-safe action descriptors shared by pages.

- `backend/src/main/java/com/projectos/apps/AppOwnershipService.java`  
  Merges catalog, installed app repository, ownership metadata, host inventory, and linked services.

- `backend/src/main/java/com/projectos/apps/AppOwnershipController.java`  
  New canonical API under `/api/app-ownership`.

- `backend/src/main/resources/db/migration/V7__external_service_catalog_links.sql`  
  Adds optional catalog linkage to external services.

- `backend/src/test/java/com/projectos/apps/AppOwnershipServiceTests.java`  
  Backend coverage for state classification and actions.

### Backend Modify

- `backend/src/main/java/com/projectos/discover/DiscoverService.java`  
  Replace local installed/found classification with `AppOwnershipService`.

- `backend/src/main/java/com/projectos/discover/DiscoverAppView.java`  
  Extend with canonical ownership fields: `ownership`, `ownedByCurrentInstance`, duplicate warning flag, review link.

- `backend/src/main/java/com/projectos/discover/DiscoverServiceTests.java`  
  Update expectations to use canonical states and duplicate warning flags.

- `backend/src/main/java/com/projectos/marketplace/install/AppInstanceViewService.java`  
  Use `AppOwnershipService` for My Apps managed/linked/found sections or remove duplicated ownership decisions.

- `backend/src/main/java/com/projectos/host/ExternalService.java`  
  Add `catalogAppId`.

- `backend/src/main/java/com/projectos/host/ExternalServiceRequest.java`  
  Add optional `catalogAppId`.

- `backend/src/main/java/com/projectos/host/ExternalServiceRepository.java`  
  Persist/read `catalog_app_id`.

- `backend/src/main/java/com/projectos/host/ExternalServiceService.java`  
  Preserve catalog link when adding external services.

- `backend/src/main/java/com/projectos/host/HostResourceActionService.java`  
  Rename recovery language to adoption for supported legacy Project OS resources and return explicit blocked adoption guidance for unmanaged Docker resources.

### Frontend Create

- `frontend/src/types/appOwnership.ts`  
  Shared TypeScript contract matching `AppOwnershipView`.

- `frontend/src/api/AppOwnershipAPIClient.ts`  
  API client for `/api/app-ownership`.

- `frontend/src/pages/ApplicationsPage/FoundServicesPanel.tsx`  
  My Apps surface for detected/adoptable/external services.

- `frontend/src/pages/MarketplacePage/DuplicateInstallWarningDialog.tsx`  
  Strong duplicate warning gate.

- `frontend/src/pages/MarketplacePage/MarketplaceAppCard.tsx`  
  Compact, stable marketplace card component.

### Frontend Modify

- `frontend/src/types/discover.ts`  
  Mirror Discover fields backed by canonical ownership.

- `frontend/src/types/host.ts`  
  Add `catalogAppId` to `ExternalService` and request type.

- `frontend/src/pages/MarketplacePage/MarketplacePage.tsx`  
  Consume canonical Discover state and block duplicate installs until acknowledged.

- `frontend/src/pages/MarketplacePage/MarketplaceAppList.tsx`  
  Render compact cards with stable heights.

- `frontend/src/pages/MarketplacePage/MarketplaceAppDetail.tsx`  
  Move existing-service explanation into detail panel and route review actions to Applications.

- `frontend/src/pages/ApplicationsPage/ApplicationsPage.tsx`  
  Load ownership state and pass found/linked/detected sections to dashboard.

- `frontend/src/pages/ApplicationsPage/ApplicationsDashboard.tsx`  
  Align My Apps language and sections with Marketplace.

- `frontend/src/api/InstalledAppsAPIClient.ts`  
  Remove old `normalizeAppList` compatibility fallback.

- `frontend/src/pages/MarketplacePage/extensions/MarketplacePage.logic.js`  
  Delete ownership/card derivation and keep only active search, sort, starter, and activity helpers.

---

## Task 1: Backend Canonical Ownership Model

**Files:**
- Create: `backend/src/main/java/com/projectos/apps/AppOwnershipState.java`
- Create: `backend/src/main/java/com/projectos/apps/AppOwnershipAction.java`
- Create: `backend/src/main/java/com/projectos/apps/AppOwnershipView.java`
- Create: `backend/src/main/java/com/projectos/apps/AppOwnershipService.java`
- Create: `backend/src/main/java/com/projectos/apps/AppOwnershipController.java`
- Create: `backend/src/test/java/com/projectos/apps/AppOwnershipServiceTests.java`

- [ ] **Step 1: Write failing service tests**

Create `backend/src/test/java/com/projectos/apps/AppOwnershipServiceTests.java`:

```java
package com.projectos.apps;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Instant;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.nio.file.Path;

import com.projectos.host.ExternalService;
import com.projectos.host.ExternalServiceRepository;
import com.projectos.host.HostInventoryProvider;
import com.projectos.host.HostInventoryResource;
import com.projectos.marketplace.catalog.ManifestValidator;
import com.projectos.marketplace.catalog.ManifestYamlReader;
import com.projectos.marketplace.catalog.MarketplaceCatalogService;
import com.projectos.marketplace.install.InstalledApp;
import com.projectos.marketplace.install.InstalledAppOwnershipMetadata;
import com.projectos.marketplace.install.InstalledAppRepository;
import com.projectos.marketplace.runtime.ProjectOsRuntimeProperties;
import com.projectos.marketplace.runtime.RuntimeLayout;

class AppOwnershipServiceTests {
    @TempDir
    Path runtimeRoot;

    @Test
    void currentInstanceManagedAppIsInstalledManaged() {
        InstalledAppRepository installed = installedRepository();
        installed.save(new InstalledApp(
                "vaultwarden",
                "Family Passwords",
                "Ready",
                runtimeRoot.resolve("apps/vaultwarden").toString(),
                "project-os-vaultwarden",
                "http://localhost:8090",
                Instant.parse("2026-06-21T12:00:00Z")));
        installed.saveOwnershipMetadata(new InstalledAppOwnershipMetadata(
                "vaultwarden",
                "appinst_vaultwarden",
                "vaultwarden",
                "current-instance",
                "project-os-vaultwarden",
                "installed",
                "owned",
                Instant.parse("2026-06-21T12:00:00Z"),
                Instant.parse("2026-06-21T12:00:00Z")));

        AppOwnershipView view = ownershipService(installed, List.of(), externalRepository()).byCatalogAppId().get("vaultwarden");

        assertThat(view.state()).isEqualTo(AppOwnershipState.INSTALLED_MANAGED);
        assertThat(view.ownedByCurrentInstance()).isTrue();
        assertThat(view.installedApp()).isNotNull();
        assertThat(view.installCopyWarningRequired()).isFalse();
        assertThat(view.primaryAction().id()).isEqualTo("manage");
    }

    @Test
    void linkedServiceMatchingCatalogAppIsNotInstalled() {
        ExternalServiceRepository external = externalRepository();
        external.save(new ExternalService(
                "external-jellyfin",
                "Living Room Jellyfin",
                "http://jellyfin.local:8096",
                "Media",
                "lan",
                true,
                "linked",
                "jellyfin",
                Instant.parse("2026-06-21T12:00:00Z")));

        AppOwnershipView view = ownershipService(installedRepository(), List.of(), external).byCatalogAppId().get("jellyfin");

        assertThat(view.state()).isEqualTo(AppOwnershipState.LINKED_SERVICE);
        assertThat(view.ownedByCurrentInstance()).isFalse();
        assertThat(view.installed()).isFalse();
        assertThat(view.linkedService()).isNotNull();
        assertThat(view.reviewExistingHref()).isEqualTo("/apps?linked=external-jellyfin");
        assertThat(view.installCopyWarningRequired()).isTrue();
    }

    @Test
    void localFoundServiceMatchingCatalogAppIsNotInstalledAndCanBeReviewed() {
        HostInventoryResource found = new HostInventoryResource(
                "docker:jellyfin",
                "Jellyfin",
                "jellyfin",
                "external_docker",
                "observed",
                "",
                "current-instance",
                "running",
                List.of("http://localhost:8096"),
                "docker",
                List.of("view_details", "open", "link_external_service", "ignore"),
                false,
                "info",
                "Found Docker container not managed by Project OS: jellyfin.",
                Map.of("containerName", "jellyfin"));

        AppOwnershipView view = ownershipService(installedRepository(), List.of(found), externalRepository()).byCatalogAppId().get("jellyfin");

        assertThat(view.state()).isEqualTo(AppOwnershipState.FOUND_ON_SERVER);
        assertThat(view.ownedByCurrentInstance()).isFalse();
        assertThat(view.installed()).isFalse();
        assertThat(view.foundResource()).isEqualTo(found);
        assertThat(view.reviewExistingHref()).isEqualTo("/apps/found?resource=docker%3Ajellyfin");
        assertThat(view.installCopyWarningRequired()).isTrue();
    }

    @Test
    void foreignAndRecoverableResourcesAreDistinctFromInstalled() {
        HostInventoryResource foreign = resource("docker:foreign-jellyfin", "jellyfin", "foreign_project_os");
        HostInventoryResource legacy = resource("docker:legacy-homepage", "homepage", "legacy_project_os");

        Map<String, AppOwnershipView> views = ownershipService(installedRepository(), List.of(foreign, legacy), externalRepository()).byCatalogAppId();

        assertThat(views.get("jellyfin").state()).isEqualTo(AppOwnershipState.MANAGED_ELSEWHERE);
        assertThat(views.get("jellyfin").installed()).isFalse();
        assertThat(views.get("homepage").state()).isEqualTo(AppOwnershipState.RECOVERABLE);
        assertThat(views.get("homepage").installed()).isFalse();
    }

    private HostInventoryResource resource(String id, String catalogAppId, String ownershipState) {
        return new HostInventoryResource(
                id,
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
                "Found matching resource.",
                Map.of("containerName", catalogAppId));
    }

    private AppOwnershipService ownershipService(InstalledAppRepository installed, List<HostInventoryResource> inventory, ExternalServiceRepository external) {
        HostInventoryProvider provider = includeIgnored -> inventory;
        return new AppOwnershipService(catalogService(), installed, provider, external);
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

    private RuntimeLayout runtimeLayout() {
        ProjectOsRuntimeProperties properties = new ProjectOsRuntimeProperties();
        properties.setRuntimeRoot(runtimeRoot.toString());
        return new RuntimeLayout(properties);
    }
}
```

- [ ] **Step 2: Run the failing tests**

Run:

```bash
cd backend
./gradlew test --tests com.projectos.apps.AppOwnershipServiceTests
```

Expected: compile fails because `com.projectos.apps` classes do not exist and `ExternalService` does not yet include `catalogAppId`.

- [ ] **Step 3: Add canonical state constants**

Create `backend/src/main/java/com/projectos/apps/AppOwnershipState.java`:

```java
package com.projectos.apps;

public final class AppOwnershipState {
    public static final String INSTALLED_MANAGED = "installed_managed";
    public static final String FOUND_ON_SERVER = "found_on_server";
    public static final String LINKED_SERVICE = "linked_service";
    public static final String MANAGED_ELSEWHERE = "managed_elsewhere";
    public static final String RECOVERABLE = "recoverable";
    public static final String BLOCKED = "blocked";
    public static final String AVAILABLE = "available";

    private AppOwnershipState() {
    }
}
```

- [ ] **Step 4: Add ownership action and view records**

Create `backend/src/main/java/com/projectos/apps/AppOwnershipAction.java`:

```java
package com.projectos.apps;

public record AppOwnershipAction(
        String id,
        String label,
        String href,
        String method,
        boolean dangerous,
        boolean preferred) {
}
```

Create `backend/src/main/java/com/projectos/apps/AppOwnershipView.java`:

```java
package com.projectos.apps;

import com.projectos.host.ExternalService;
import com.projectos.host.HostInventoryResource;
import com.projectos.marketplace.install.InstalledApp;
import com.projectos.marketplace.model.ApplicationManifest;

public record AppOwnershipView(
        String catalogAppId,
        ApplicationManifest app,
        String state,
        String stateLabel,
        String stateDescription,
        boolean installed,
        boolean ownedByCurrentInstance,
        boolean canInstallManagedCopy,
        boolean installCopyWarningRequired,
        String reviewExistingHref,
        AppOwnershipAction primaryAction,
        AppOwnershipAction secondaryAction,
        InstalledApp installedApp,
        HostInventoryResource foundResource,
        ExternalService linkedService) {
}
```

- [ ] **Step 5: Add ownership merge service**

Create `backend/src/main/java/com/projectos/apps/AppOwnershipService.java`:

```java
package com.projectos.apps;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;

import com.projectos.host.ExternalService;
import com.projectos.host.ExternalServiceRepository;
import com.projectos.host.HostInventoryProvider;
import com.projectos.host.HostInventoryResource;
import com.projectos.marketplace.catalog.MarketplaceCatalogService;
import com.projectos.marketplace.install.InstalledApp;
import com.projectos.marketplace.install.InstalledAppOwnershipMetadata;
import com.projectos.marketplace.install.InstalledAppRepository;
import com.projectos.marketplace.model.ApplicationManifest;

@Service
public class AppOwnershipService {
    private final MarketplaceCatalogService catalogService;
    private final InstalledAppRepository installedRepository;
    private final HostInventoryProvider hostInventoryProvider;
    private final ExternalServiceRepository externalServiceRepository;

    public AppOwnershipService(
            MarketplaceCatalogService catalogService,
            InstalledAppRepository installedRepository,
            HostInventoryProvider hostInventoryProvider,
            ExternalServiceRepository externalServiceRepository) {
        this.catalogService = catalogService;
        this.installedRepository = installedRepository;
        this.hostInventoryProvider = hostInventoryProvider;
        this.externalServiceRepository = externalServiceRepository;
    }

    public List<AppOwnershipView> list() {
        Map<String, AppOwnershipView> views = byCatalogAppId();
        return views.values().stream()
                .sorted(Comparator.comparing(AppOwnershipView::state).thenComparing(view -> view.app().name(), String.CASE_INSENSITIVE_ORDER))
                .toList();
    }

    public Map<String, AppOwnershipView> byCatalogAppId() {
        Map<String, InstalledApp> installed = installedRepository.findAll().stream()
                .collect(java.util.stream.Collectors.toMap(InstalledApp::appId, app -> app, (left, right) -> left));
        Map<String, HostInventoryResource> found = hostInventoryProvider.inventory(false).stream()
                .filter(resource -> resource.catalogAppId() != null && !resource.catalogAppId().isBlank())
                .filter(resource -> !"owned_managed".equals(resource.ownershipState()))
                .collect(java.util.stream.Collectors.toMap(HostInventoryResource::catalogAppId, resource -> resource, this::higherPriorityResource, LinkedHashMap::new));
        Map<String, ExternalService> linked = externalServiceRepository.findAll().stream()
                .filter(service -> service.catalogAppId() != null && !service.catalogAppId().isBlank())
                .collect(java.util.stream.Collectors.toMap(ExternalService::catalogAppId, service -> service, (left, right) -> left, LinkedHashMap::new));

        Map<String, AppOwnershipView> result = new LinkedHashMap<>();
        for (ApplicationManifest manifest : catalogService.findAll()) {
            InstalledApp installedApp = installed.get(manifest.id());
            HostInventoryResource resource = found.get(manifest.id());
            ExternalService linkedService = linked.get(manifest.id());
            result.put(manifest.id(), view(manifest, installedApp, resource, linkedService));
        }
        return result;
    }

    private AppOwnershipView view(ApplicationManifest manifest, InstalledApp installedApp, HostInventoryResource resource, ExternalService linkedService) {
        InstalledAppOwnershipMetadata ownership = installedRepository.ownershipFor(manifest.id()).orElse(null);
        boolean ownedByCurrentInstance = installedApp != null && ownership != null && "owned".equals(ownership.ownershipStatus());
        String state = state(ownedByCurrentInstance, resource, linkedService);
        String reviewHref = reviewHref(state, resource, linkedService);
        boolean existingService = !AppOwnershipState.INSTALLED_MANAGED.equals(state) && !AppOwnershipState.AVAILABLE.equals(state);
        return new AppOwnershipView(
                manifest.id(),
                manifest,
                state,
                stateLabel(state),
                stateDescription(state, manifest, resource, linkedService),
                AppOwnershipState.INSTALLED_MANAGED.equals(state),
                ownedByCurrentInstance,
                !AppOwnershipState.INSTALLED_MANAGED.equals(state),
                existingService,
                reviewHref,
                primaryAction(state, reviewHref),
                secondaryAction(state, manifest.id()),
                AppOwnershipState.INSTALLED_MANAGED.equals(state) ? installedApp : null,
                resource,
                linkedService);
    }

    private String state(boolean ownedByCurrentInstance, HostInventoryResource resource, ExternalService linkedService) {
        if (ownedByCurrentInstance) {
            return AppOwnershipState.INSTALLED_MANAGED;
        }
        if (resource != null && "unknown_conflict".equals(resource.ownershipState())) {
            return AppOwnershipState.BLOCKED;
        }
        if (resource != null && "foreign_project_os".equals(resource.ownershipState())) {
            return AppOwnershipState.MANAGED_ELSEWHERE;
        }
        if (resource != null && "legacy_project_os".equals(resource.ownershipState())) {
            return AppOwnershipState.RECOVERABLE;
        }
        if (resource != null) {
            return AppOwnershipState.FOUND_ON_SERVER;
        }
        if (linkedService != null) {
            return AppOwnershipState.LINKED_SERVICE;
        }
        return AppOwnershipState.AVAILABLE;
    }

    private HostInventoryResource higherPriorityResource(HostInventoryResource left, HostInventoryResource right) {
        return priority(left) <= priority(right) ? left : right;
    }

    private int priority(HostInventoryResource resource) {
        return switch (resource.ownershipState()) {
            case "unknown_conflict" -> 0;
            case "foreign_project_os" -> 1;
            case "legacy_project_os" -> 2;
            case "external_docker" -> 3;
            default -> 4;
        };
    }

    private String stateLabel(String state) {
        return switch (state) {
            case AppOwnershipState.INSTALLED_MANAGED -> "Installed";
            case AppOwnershipState.FOUND_ON_SERVER -> "Existing service";
            case AppOwnershipState.LINKED_SERVICE -> "Linked service";
            case AppOwnershipState.MANAGED_ELSEWHERE -> "Managed elsewhere";
            case AppOwnershipState.RECOVERABLE -> "Recoverable";
            case AppOwnershipState.BLOCKED -> "Blocked";
            default -> "Available";
        };
    }

    private String stateDescription(String state, ApplicationManifest manifest, HostInventoryResource resource, ExternalService linkedService) {
        return switch (state) {
            case AppOwnershipState.INSTALLED_MANAGED -> manifest.name() + " is managed by this Project OS installation.";
            case AppOwnershipState.FOUND_ON_SERVER -> "Project OS found " + manifest.name() + " already running on this server.";
            case AppOwnershipState.LINKED_SERVICE -> "Project OS has a link to " + linkedService.name() + ", but does not manage it.";
            case AppOwnershipState.MANAGED_ELSEWHERE, AppOwnershipState.RECOVERABLE, AppOwnershipState.BLOCKED -> resource.summary();
            default -> "Ready to review before install.";
        };
    }

    private String reviewHref(String state, HostInventoryResource resource, ExternalService linkedService) {
        if (linkedService != null && AppOwnershipState.LINKED_SERVICE.equals(state)) {
            return "/apps?linked=" + encode(linkedService.id());
        }
        if (resource != null && !AppOwnershipState.INSTALLED_MANAGED.equals(state)) {
            return "/apps/found?resource=" + encode(resource.id());
        }
        return "";
    }

    private AppOwnershipAction primaryAction(String state, String reviewHref) {
        return switch (state) {
            case AppOwnershipState.INSTALLED_MANAGED -> new AppOwnershipAction("manage", "Manage", "/apps", "GET", false, true);
            case AppOwnershipState.AVAILABLE -> new AppOwnershipAction("review_setup", "Review setup", "", "GET", false, true);
            case AppOwnershipState.BLOCKED -> new AppOwnershipAction("review_issue", "Review issue", reviewHref, "GET", false, true);
            default -> new AppOwnershipAction("review_existing", "Review", reviewHref, "GET", false, true);
        };
    }

    private AppOwnershipAction secondaryAction(String state, String catalogAppId) {
        if (AppOwnershipState.INSTALLED_MANAGED.equals(state)) {
            return new AppOwnershipAction("open", "Open", "/apps", "GET", false, false);
        }
        if (AppOwnershipState.AVAILABLE.equals(state)) {
            return null;
        }
        return new AppOwnershipAction("install_copy", "Install separate copy", "/discover?app=" + encode(catalogAppId), "GET", true, false);
    }

    private String encode(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }
}
```

- [ ] **Step 6: Add controller**

Create `backend/src/main/java/com/projectos/apps/AppOwnershipController.java`:

```java
package com.projectos.apps;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/app-ownership")
public class AppOwnershipController {
    private final AppOwnershipService service;

    public AppOwnershipController(AppOwnershipService service) {
        this.service = service;
    }

    @GetMapping
    public List<AppOwnershipView> list() {
        return service.list();
    }
}
```

- [ ] **Step 7: Run tests and commit**

Run:

```bash
cd backend
./gradlew test --tests com.projectos.apps.AppOwnershipServiceTests
```

Expected: tests still fail until Task 2 adds `catalogAppId` to `ExternalService`. Do not commit yet.

---

## Task 2: Database And Linked Service Catalog IDs

**Files:**
- Create: `backend/src/main/resources/db/migration/V7__external_service_catalog_links.sql`
- Modify: `backend/src/main/java/com/projectos/host/ExternalService.java`
- Modify: `backend/src/main/java/com/projectos/host/ExternalServiceRequest.java`
- Modify: `backend/src/main/java/com/projectos/host/ExternalServiceRepository.java`
- Modify: `backend/src/main/java/com/projectos/host/ExternalServiceService.java`
- Modify: `frontend/src/types/host.ts`

- [ ] **Step 1: Add Flyway migration**

Create `backend/src/main/resources/db/migration/V7__external_service_catalog_links.sql`:

```sql
alter table external_services add column catalog_app_id text not null default '';

create index if not exists idx_external_services_catalog_app_id on external_services(catalog_app_id);
```

- [ ] **Step 2: Update backend records**

Modify `backend/src/main/java/com/projectos/host/ExternalService.java` to:

```java
package com.projectos.host;

import java.time.Instant;

public record ExternalService(
        String id,
        String name,
        String url,
        String category,
        String accessScope,
        boolean healthCheckEnabled,
        String managementMode,
        String catalogAppId,
        Instant createdAt) {
}
```

Modify `backend/src/main/java/com/projectos/host/ExternalServiceRequest.java` to include:

```java
package com.projectos.host;

public record ExternalServiceRequest(
        String name,
        String url,
        String category,
        String accessScope,
        boolean healthCheckEnabled,
        String catalogAppId) {
}
```

- [ ] **Step 3: Update repository SQL**

In `backend/src/main/java/com/projectos/host/ExternalServiceRepository.java`, replace the `save` SQL with:

```java
String sql = """
        insert into external_services(id, name, url, category, access_scope, health_check_enabled, management_mode, catalog_app_id, created_at)
        values(?, ?, ?, ?, ?, ?, ?, ?, ?)
        on conflict(id) do update set
            name = excluded.name,
            url = excluded.url,
            category = excluded.category,
            access_scope = excluded.access_scope,
            health_check_enabled = excluded.health_check_enabled,
            management_mode = excluded.management_mode,
            catalog_app_id = excluded.catalog_app_id
        """;
```

Then set parameters:

```java
statement.setString(1, service.id());
statement.setString(2, service.name());
statement.setString(3, service.url());
statement.setString(4, service.category());
statement.setString(5, service.accessScope());
statement.setInt(6, service.healthCheckEnabled() ? 1 : 0);
statement.setString(7, service.managementMode());
statement.setString(8, service.catalogAppId() == null ? "" : service.catalogAppId());
statement.setString(9, service.createdAt().toString());
```

Update `externalService(ResultSet resultSet)` to:

```java
return new ExternalService(
        resultSet.getString("id"),
        resultSet.getString("name"),
        resultSet.getString("url"),
        resultSet.getString("category"),
        resultSet.getString("access_scope"),
        resultSet.getInt("health_check_enabled") == 1,
        resultSet.getString("management_mode"),
        resultSet.getString("catalog_app_id"),
        Instant.parse(resultSet.getString("created_at")));
```

- [ ] **Step 4: Update service creation**

In `backend/src/main/java/com/projectos/host/ExternalServiceService.java`, when constructing `ExternalService`, pass:

```java
clean(request.catalogAppId())
```

Use helper:

```java
private String clean(String value) {
    return value == null ? "" : value.trim();
}
```

- [ ] **Step 5: Update frontend host types**

In `frontend/src/types/host.ts`, update:

```ts
export type ExternalService = {
  id: string;
  name: string;
  url: string;
  category: string;
  accessScope: string;
  healthCheckEnabled: boolean;
  managementMode: 'linked' | string;
  catalogAppId: string;
  createdAt: string;
};

export type ExternalServiceRequest = {
  name: string;
  url: string;
  category: string;
  accessScope: string;
  healthCheckEnabled: boolean;
  catalogAppId: string;
};
```

- [ ] **Step 6: Run ownership tests**

Run:

```bash
cd backend
./gradlew test --tests com.projectos.apps.AppOwnershipServiceTests
```

Expected: PASS.

- [ ] **Step 7: Run backend full tests and commit**

Run:

```bash
cd backend
./gradlew test
```

Expected: PASS.

Commit:

```bash
git add backend/src/main/java/com/projectos/apps \
  backend/src/main/java/com/projectos/host/ExternalService.java \
  backend/src/main/java/com/projectos/host/ExternalServiceRequest.java \
  backend/src/main/java/com/projectos/host/ExternalServiceRepository.java \
  backend/src/main/java/com/projectos/host/ExternalServiceService.java \
  backend/src/main/resources/db/migration/V7__external_service_catalog_links.sql \
  backend/src/test/java/com/projectos/apps/AppOwnershipServiceTests.java \
  frontend/src/types/host.ts
git commit -m "Add canonical app ownership model"
```

---

## Task 3: Wire Discover Backend To Canonical Ownership

**Files:**
- Modify: `backend/src/main/java/com/projectos/discover/DiscoverAppView.java`
- Modify: `backend/src/main/java/com/projectos/discover/DiscoverService.java`
- Modify: `backend/src/test/java/com/projectos/discover/DiscoverServiceTests.java`

- [ ] **Step 1: Add failing Discover tests**

In `backend/src/test/java/com/projectos/discover/DiscoverServiceTests.java`, add:

```java
@Test
void discoverUsesCanonicalOwnershipForExistingServicesAndDuplicateWarnings() {
    HostInventoryResource found = new HostInventoryResource(
            "docker:jellyfin",
            "Jellyfin",
            "jellyfin",
            "external_docker",
            "observed",
            "",
            "current-instance",
            "running",
            List.of("http://localhost:8096"),
            "docker",
            List.of("view_details", "open", "link_external_service", "ignore"),
            false,
            "info",
            "Found Docker container not managed by Project OS: jellyfin.",
            Map.of("containerName", "jellyfin"));
    DiscoverService service = discoverService(List.of(found));

    DiscoverAppView jellyfin = service.app("jellyfin").orElseThrow();

    assertThat(jellyfin.state()).isEqualTo("found_on_server");
    assertThat(jellyfin.installed()).isFalse();
    assertThat(jellyfin.ownedByCurrentInstance()).isFalse();
    assertThat(jellyfin.installCopyWarningRequired()).isTrue();
    assertThat(jellyfin.reviewExistingHref()).isEqualTo("/apps/found?resource=docker%3Ajellyfin");
    assertThat(jellyfin.primaryActionLabel()).isEqualTo("Review");
}
```

- [ ] **Step 2: Run failing Discover tests**

Run:

```bash
cd backend
./gradlew test --tests com.projectos.discover.DiscoverServiceTests
```

Expected: FAIL because `DiscoverAppView` does not expose the new fields and `DiscoverService` still performs local classification.

- [ ] **Step 3: Extend DiscoverAppView**

Modify `backend/src/main/java/com/projectos/discover/DiscoverAppView.java`:

```java
package com.projectos.discover;

import com.projectos.apps.AppOwnershipView;
import com.projectos.host.ExternalService;
import com.projectos.host.HostInventoryResource;
import com.projectos.marketplace.model.ApplicationManifest;

public record DiscoverAppView(
        String id,
        ApplicationManifest app,
        String name,
        String image,
        String summary,
        String description,
        String categoryLabel,
        String serviceKindLabel,
        String estimatedInstallTime,
        String difficulty,
        String state,
        String stateLabel,
        String stateDescription,
        String primaryAction,
        String primaryActionLabel,
        boolean installed,
        boolean ownedByCurrentInstance,
        boolean canInstallManagedCopy,
        boolean installCopyWarningRequired,
        String reviewExistingHref,
        DiscoverInstalledAppSummary installedApp,
        HostInventoryResource foundResource,
        ExternalService linkedService,
        DiscoverSetupSchema setupSchema) {

    public static DiscoverAppView from(ApplicationManifest manifest, AppOwnershipView ownership, DiscoverSetupSchema setupSchema) {
        return new DiscoverAppView(
                manifest.id(),
                manifest,
                manifest.name(),
                manifest.image(),
                firstPresent(manifest.shortValue(), manifest.plainLanguage(), manifest.description()),
                firstPresent(manifest.plainLanguage(), manifest.description()),
                manifest.category(),
                serviceKindLabel(manifest.usage().kind()),
                manifest.installTime(),
                manifest.difficulty(),
                ownership.state(),
                ownership.stateLabel(),
                ownership.stateDescription(),
                ownership.primaryAction().id(),
                ownership.primaryAction().label(),
                ownership.installed(),
                ownership.ownedByCurrentInstance(),
                ownership.canInstallManagedCopy(),
                ownership.installCopyWarningRequired(),
                ownership.reviewExistingHref(),
                ownership.installedApp() == null ? null : new DiscoverInstalledAppSummary(
                        ownership.installedApp().appId(),
                        ownership.installedApp().appName(),
                        ownership.installedApp().status(),
                        ownership.installedApp().accessUrl()),
                ownership.foundResource(),
                ownership.linkedService(),
                setupSchema);
    }

    private static String serviceKindLabel(String kind) {
        return switch (kind) {
            case "web-app" -> "App you open";
            case "companion-service" -> "Service you connect to";
            case "admin-service" -> "Setup tool";
            case "background-service" -> "Background service";
            case "infrastructure" -> "Infrastructure";
            default -> kind == null ? "App" : kind.replace("-", " ");
        };
    }

    private static String firstPresent(String... values) {
        for (String value : values) {
            if (value != null && !value.isBlank()) {
                return value;
            }
        }
        return "";
    }
}
```

- [ ] **Step 4: Refactor DiscoverService to use AppOwnershipService**

In `backend/src/main/java/com/projectos/discover/DiscoverService.java`:

- Inject `AppOwnershipService`.
- Remove `InstalledAppRepository` and `HostInventoryProvider` fields if they are no longer needed.
- Replace `apps()` with:

```java
public List<DiscoverAppView> apps() {
    Map<String, AppOwnershipView> ownershipByAppId = ownershipService.byCatalogAppId();
    return catalogService.findAll().stream()
            .map(manifest -> DiscoverAppView.from(manifest, ownershipByAppId.get(manifest.id()), setupService.schema(manifest)))
            .sorted(Comparator.comparing(DiscoverAppView::name, String.CASE_INSENSITIVE_ORDER))
            .toList();
}
```

- Replace `app(String appId)` with:

```java
public Optional<DiscoverAppView> app(String appId) {
    return catalogService.findById(appId)
            .map(manifest -> DiscoverAppView.from(
                    manifest,
                    ownershipService.byCatalogAppId().get(manifest.id()),
                    setupService.schema(manifest)));
}
```

- Delete local `state`, `stateLabel`, `stateDescription`, `primaryAction`, `primaryActionLabel`, `serviceKindLabel`, and `firstPresent` helpers from `DiscoverService`.

Keep the test-only constructor but update it to accept `AppOwnershipService` or build one in tests.

- [ ] **Step 5: Run tests**

Run:

```bash
cd backend
./gradlew test --tests com.projectos.discover.DiscoverServiceTests --tests com.projectos.apps.AppOwnershipServiceTests
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add backend/src/main/java/com/projectos/discover \
  backend/src/test/java/com/projectos/discover/DiscoverServiceTests.java
git commit -m "Use canonical ownership in Discover"
```

---

## Task 4: Marketplace Frontend State And Duplicate Warning

**Files:**
- Create: `frontend/src/types/appOwnership.ts`
- Modify: `frontend/src/types/discover.ts`
- Create: `frontend/src/pages/MarketplacePage/DuplicateInstallWarningDialog.tsx`
- Create: `frontend/src/pages/MarketplacePage/MarketplaceAppCard.tsx`
- Modify: `frontend/src/pages/MarketplacePage/MarketplaceAppList.tsx`
- Modify: `frontend/src/pages/MarketplacePage/MarketplacePage.tsx`
- Modify: `frontend/src/pages/MarketplacePage/MarketplaceAppDetail.tsx`
- Test: `frontend/src/pages/MarketplacePage/extensions/MarketplacePage.logic.test.mjs`

- [ ] **Step 1: Update frontend types**

Create `frontend/src/types/appOwnership.ts`:

```ts
import type { ExternalService, HostInventoryResource } from './host';
import type { MarketplaceApp } from './marketplace';

export type AppOwnershipState =
  | 'installed_managed'
  | 'found_on_server'
  | 'linked_service'
  | 'managed_elsewhere'
  | 'recoverable'
  | 'blocked'
  | 'available'
  | string;

export type AppOwnershipAction = {
  id: string;
  label: string;
  href: string;
  method: string;
  dangerous: boolean;
  preferred: boolean;
};

export type AppOwnershipView = {
  catalogAppId: string;
  app: MarketplaceApp;
  state: AppOwnershipState;
  stateLabel: string;
  stateDescription: string;
  installed: boolean;
  ownedByCurrentInstance: boolean;
  canInstallManagedCopy: boolean;
  installCopyWarningRequired: boolean;
  reviewExistingHref: string;
  primaryAction: AppOwnershipAction;
  secondaryAction: AppOwnershipAction | null;
  installedApp: unknown | null;
  foundResource: HostInventoryResource | null;
  linkedService: ExternalService | null;
};
```

Modify `frontend/src/types/discover.ts` to add:

```ts
import type { ExternalService } from './host';

ownedByCurrentInstance: boolean;
canInstallManagedCopy: boolean;
installCopyWarningRequired: boolean;
reviewExistingHref: string;
linkedService: ExternalService | null;
```

- [ ] **Step 2: Create duplicate warning dialog**

Create `frontend/src/pages/MarketplacePage/DuplicateInstallWarningDialog.tsx`:

```tsx
import { TriangleAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { poButtonClass } from '@/lib/projectOsStyleKit';

type DuplicateInstallWarningDialogProps = {
  appName: string;
  open: boolean;
  reviewHref: string;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
};

export function DuplicateInstallWarningDialog({ appName, open, reviewHref, onOpenChange, onConfirm }: DuplicateInstallWarningDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-red-300/25 bg-slate-950 text-slate-100 sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Installing another {appName} may cause confusion</DialogTitle>
          <DialogDescription className="text-slate-400">
            Project OS already found {appName}. Installing a separate copy means you may have two {appName} services on your server or network.
          </DialogDescription>
        </DialogHeader>

        <section className="rounded-lg border border-red-300/30 bg-red-500/10 p-4">
          <div className="flex items-start gap-3">
            <TriangleAlert className="mt-0.5 size-5 shrink-0 text-red-200" />
            <div>
              <h4 className="font-bold text-white">This can cause strange behavior</h4>
              <ul className="mt-2 grid gap-2 text-sm leading-6 text-red-100/85">
                <li>Your TV, phone, or browser may open the wrong {appName}.</li>
                <li>Settings and libraries may not match between the two copies.</li>
                <li>Troubleshooting will be harder because both services may look similar.</li>
              </ul>
            </div>
          </div>
        </section>

        <p className="text-sm leading-6 text-slate-400">
          Recommended: review the existing service first. Continue only if you intentionally want a second, separate {appName}.
        </p>

        <DialogFooter>
          <Button asChild className={poButtonClass('quiet')} variant="outline">
            <a href={reviewHref}>Review existing instead</a>
          </Button>
          <Button className="bg-red-500 text-white hover:bg-red-400" onClick={onConfirm} type="button">
            I understand, install separate copy
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 3: Create compact marketplace card**

Create `frontend/src/pages/MarketplacePage/MarketplaceAppCard.tsx`:

```tsx
import { CheckCircle2, MoreHorizontal, Sparkles, TriangleAlert } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { poButtonClass } from '@/lib/projectOsStyleKit';
import { cn } from '@/lib/utils';
import type { DiscoverAppView } from '@/types/discover';
import { AppImage } from './MarketplacePage.shared';

type MarketplaceAppCardProps = {
  app: DiscoverAppView;
  isSelected: boolean;
  onSelect: () => void;
};

export function MarketplaceAppCard({ app, isSelected, onSelect }: MarketplaceAppCardProps) {
  const stateTone = stateBadgeClass(app.state);
  const PrimaryIcon = app.state === 'installed_managed' ? CheckCircle2 : app.state === 'available' ? Sparkles : TriangleAlert;
  return (
    <article
      className={cn(
        'grid min-h-[228px] grid-rows-[auto_1fr_auto] gap-4 rounded-lg border p-4 text-slate-100 shadow-po-card transition',
        'border-slate-700/35 bg-slate-950/48 hover:border-violet-300/40 hover:bg-slate-900/60',
        isSelected && 'border-violet-300/60 bg-violet-950/20 shadow-po-brand-glow',
        app.state === 'installed_managed' && 'border-emerald-300/35 bg-emerald-950/15',
        ['found_on_server', 'linked_service', 'managed_elsewhere', 'recoverable', 'blocked'].includes(app.state) && 'border-amber-300/35 bg-amber-950/15',
      )}
    >
      <button className="grid gap-4 text-left" onClick={onSelect} type="button">
        <span className="flex min-w-0 items-start gap-3">
          <AppImage app={app.app} />
          <span className="min-w-0 flex-1">
            <span className="flex items-start justify-between gap-2">
              <strong className="min-w-0 truncate text-base text-white">{app.name}</strong>
              <Badge className={stateTone} variant="outline">{app.stateLabel}</Badge>
            </span>
            <span className="mt-1 block truncate text-xs text-slate-400">
              {app.categoryLabel} · {app.estimatedInstallTime} · {app.difficulty}
            </span>
          </span>
        </span>

        <span className="block">
          <span className="line-clamp-1 block text-base font-black leading-tight text-white">{app.summary}</span>
          <span className="mt-2 line-clamp-2 block min-h-10 text-sm leading-5 text-slate-300">{app.description}</span>
        </span>
      </button>

      <div className="flex items-center justify-between gap-3 border-t border-white/10 pt-3">
        <div className="min-w-0 truncate text-xs text-slate-400">{app.serviceKindLabel}</div>
        <div className="flex items-center gap-2">
          <Button
            className={cn(
              'h-8 px-3 text-xs',
              app.state === 'available' && poButtonClass('primary'),
              app.state === 'installed_managed' && 'border-emerald-300/25 bg-emerald-500/10 text-emerald-100 hover:bg-emerald-500/15',
              ['found_on_server', 'linked_service', 'managed_elsewhere', 'recoverable', 'blocked'].includes(app.state) && 'border-amber-300/25 bg-amber-500/10 text-amber-100 hover:bg-amber-500/15',
            )}
            onClick={onSelect}
            type="button"
            variant={app.state === 'available' ? 'default' : 'outline'}
          >
            <PrimaryIcon className="size-3.5" />
            {app.primaryActionLabel}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button aria-label={`${app.name} actions`} className={poButtonClass('quietIcon')} size="icon" type="button" variant="outline">
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 border-slate-700 bg-slate-950 text-slate-100">
              <DropdownMenuLabel>{app.name}</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-slate-800" />
              <DropdownMenuItem className="focus:bg-slate-800 focus:text-white" onSelect={onSelect}>
                View details
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </article>
  );
}

function stateBadgeClass(state: string) {
  if (state === 'installed_managed') {
    return 'border-emerald-300/25 bg-emerald-500/10 text-emerald-100';
  }
  if (['found_on_server', 'linked_service', 'managed_elsewhere', 'recoverable', 'blocked'].includes(state)) {
    return 'border-amber-300/25 bg-amber-500/10 text-amber-100';
  }
  return 'border-sky-300/25 bg-sky-500/10 text-sky-100';
}
```

- [ ] **Step 4: Update MarketplaceAppList to use the card**

In `frontend/src/pages/MarketplacePage/MarketplaceAppList.tsx`, remove the local `AppStoreCard`, `stateBadgeClass`, and `outcomeCopy` functions. Import and render:

```tsx
import { MarketplaceAppCard } from './MarketplaceAppCard';
```

Then replace:

```tsx
{apps.length ? apps.map((app) => <AppStoreCard app={app} isSelected={selectedAppId === app.id} key={app.id} onSelect={() => onSelect(app.id)} />) : (
  <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-8 text-center text-sm text-slate-400">No apps match this view.</div>
)}
```

with:

```tsx
{apps.length ? apps.map((app) => (
  <MarketplaceAppCard app={app} isSelected={selectedAppId === app.id} key={app.id} onSelect={() => onSelect(app.id)} />
)) : (
  <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-8 text-center text-sm text-slate-400">No apps match this view.</div>
)}
```

- [ ] **Step 5: Update Marketplace detail existing-service section**

In `frontend/src/pages/MarketplacePage/MarketplaceAppDetail.tsx`, add props:

```ts
installCopyWarningRequired: boolean;
reviewExistingHref: string;
onRequestSeparateInstall: () => void;
```

Replace found-resource-only logic with:

```tsx
{installCopyWarningRequired && (
  <ExistingServiceNotice
    appName={app.name}
    reviewHref={reviewExistingHref}
    onRequestSeparateInstall={onRequestSeparateInstall}
  />
)}
```

Add component:

```tsx
function ExistingServiceNotice({
  appName,
  reviewHref,
  onRequestSeparateInstall,
}: {
  appName: string;
  reviewHref: string;
  onRequestSeparateInstall: () => void;
}) {
  return (
    <section className="rounded-lg border border-amber-300/25 bg-amber-500/10 p-4">
      <div className="grid gap-3">
        <div>
          <h4 className="font-bold text-white">Existing service found</h4>
          <p className="mt-1 text-sm leading-6 text-amber-100/85">
            Project OS found {appName} already running or linked. Reviewing it first is recommended.
            If it runs on this server, Applications can guide you through bringing it under Project OS management.
            If it is only a network link, Project OS will keep it as a linked service instead.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild className="bg-amber-400 text-slate-950 hover:bg-amber-300">
            <a href={reviewHref}>Review existing in Applications</a>
          </Button>
          <Button className={poButtonClass('quiet')} onClick={onRequestSeparateInstall} type="button" variant="outline">
            Install a separate Project OS copy
          </Button>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 6: Gate duplicate install in MarketplacePage**

In `frontend/src/pages/MarketplacePage/MarketplacePage.tsx`, add:

```tsx
const [duplicateWarningOpen, setDuplicateWarningOpen] = useState(false);
const [duplicateInstallApprovedForAppId, setDuplicateInstallApprovedForAppId] = useState<string | null>(null);
```

Add:

```tsx
function requestSeparateInstall() {
  if (!selectedView) {
    return;
  }
  if (selectedView.installCopyWarningRequired && duplicateInstallApprovedForAppId !== selectedView.id) {
    setDuplicateWarningOpen(true);
    return;
  }
  setDuplicateWarningOpen(false);
}

function approveDuplicateInstall() {
  if (!selectedView) {
    return;
  }
  setDuplicateInstallApprovedForAppId(selectedView.id);
  setDuplicateWarningOpen(false);
}
```

In `installApp`, replace the old found-resource hard block:

```tsx
const app = apps.find((candidate) => candidate.id === appId);
const foundResource = app?.foundResource;
if (foundResource) {
  setMarketplaceError(`${app?.name || appId} already exists on this server but is not managed by this Project OS installation. Review existing apps before installing a duplicate.`);
  return;
}
```

with:

```tsx
const view = apps.find((candidate) => candidate.id === appId);
if (view?.installCopyWarningRequired && duplicateInstallApprovedForAppId !== appId) {
  setDuplicateWarningOpen(true);
  return;
}
```

Render:

```tsx
{selectedView && (
  <DuplicateInstallWarningDialog
    appName={selectedView.name}
    open={duplicateWarningOpen}
    reviewHref={selectedView.reviewExistingHref}
    onOpenChange={setDuplicateWarningOpen}
    onConfirm={approveDuplicateInstall}
  />
)}
```

Pass to `MarketplaceAppDetail`:

```tsx
installCopyWarningRequired={selectedView.installCopyWarningRequired}
reviewExistingHref={selectedView.reviewExistingHref}
onRequestSeparateInstall={requestSeparateInstall}
```

- [ ] **Step 7: Run frontend checks**

Run:

```bash
cd frontend
yarn typecheck
yarn lint
yarn build
```

Expected: all pass.

- [ ] **Step 8: Commit**

```bash
git add frontend/src/types/appOwnership.ts \
  frontend/src/types/discover.ts \
  frontend/src/pages/MarketplacePage/DuplicateInstallWarningDialog.tsx \
  frontend/src/pages/MarketplacePage/MarketplaceAppCard.tsx \
  frontend/src/pages/MarketplacePage/MarketplaceAppList.tsx \
  frontend/src/pages/MarketplacePage/MarketplacePage.tsx \
  frontend/src/pages/MarketplacePage/MarketplaceAppDetail.tsx
git commit -m "Harden Marketplace ownership flow"
```

---

## Task 5: Align My Apps With Canonical Ownership

**Files:**
- Create: `frontend/src/api/AppOwnershipAPIClient.ts`
- Modify: `frontend/src/pages/ApplicationsPage/ApplicationsPage.tsx`
- Create: `frontend/src/pages/ApplicationsPage/FoundServicesPanel.tsx`
- Modify: `frontend/src/pages/ApplicationsPage/ApplicationsDashboard.tsx`
- Modify: `frontend/src/pages/ApplicationsPage/extensions/ApplicationsPage.cardModel.test.mjs`

- [ ] **Step 1: Add frontend ownership API client**

Create `frontend/src/api/AppOwnershipAPIClient.ts`:

```ts
import { httpClient } from './httpClient';
import type { AppOwnershipView } from '@/types/appOwnership';

export const AppOwnershipAPIClient = {
  async list() {
    const response = await httpClient.get<AppOwnershipView[]>('/api/app-ownership');
    return response.data;
  },
};
```

- [ ] **Step 2: Add FoundServicesPanel**

Create `frontend/src/pages/ApplicationsPage/FoundServicesPanel.tsx`:

```tsx
import { Link } from 'react-router-dom';
import { ExternalLink, ShieldAlert } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { poButtonClass } from '@/lib/projectOsStyleKit';
import type { AppOwnershipView } from '@/types/appOwnership';

type FoundServicesPanelProps = {
  items: AppOwnershipView[];
};

export function FoundServicesPanel({ items }: FoundServicesPanelProps) {
  if (items.length === 0) {
    return null;
  }
  return (
    <section className="grid gap-3">
      <div>
        <h4 className="text-sm font-black uppercase tracking-normal text-amber-300">Existing services</h4>
        <p className="mt-1 text-sm text-slate-500">
          These match apps Project OS knows about, but they are not managed installs unless you adopt them.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <article className="grid min-h-[190px] gap-4 rounded-lg border border-amber-300/25 bg-amber-500/10 p-4 shadow-po-card" key={item.catalogAppId}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="truncate text-base font-black text-white">{item.app.name}</h3>
                <p className="mt-1 truncate text-sm text-slate-400">{item.stateDescription}</p>
              </div>
              <Badge className="border-amber-300/25 bg-amber-500/10 text-amber-100" variant="outline">{item.stateLabel}</Badge>
            </div>
            <div className="flex items-start gap-2 rounded-lg border border-amber-300/20 bg-slate-950/35 p-3 text-sm leading-5 text-amber-100/85">
              <ShieldAlert className="mt-0.5 size-4 shrink-0 text-amber-200" />
              <span>Review this before installing another copy. Adoption is preferred when this is the service you already use.</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild className="bg-amber-400 text-slate-950 hover:bg-amber-300" size="sm">
                <Link to={item.reviewExistingHref}>Review existing</Link>
              </Button>
              {item.linkedService?.url && (
                <Button asChild className={poButtonClass('quiet')} size="sm" variant="outline">
                  <a href={item.linkedService.url} rel="noreferrer" target="_blank">
                    <ExternalLink className="size-4" />
                    Open
                  </a>
                </Button>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Load ownership state in ApplicationsPage**

In `frontend/src/pages/ApplicationsPage/ApplicationsPage.tsx`, import:

```ts
import { AppOwnershipAPIClient } from '@/api/AppOwnershipAPIClient';
import type { AppOwnershipView } from '@/types/appOwnership';
```

Add state:

```tsx
const [ownershipViews, setOwnershipViews] = useState<AppOwnershipView[]>([]);
```

In `loadApps`, replace separate inventory/external fetch:

```tsx
const [inventory, externalServices] = await Promise.all([
  HostInventoryAPIClient.list(false),
  ExternalServiceAPIClient.list().catch(() => []),
]);
setHostInventory(inventory);
setLinkedServices(externalServices);
```

with:

```tsx
const [inventory, externalServices, ownership] = await Promise.all([
  HostInventoryAPIClient.list(false),
  ExternalServiceAPIClient.list().catch(() => []),
  AppOwnershipAPIClient.list().catch(() => []),
]);
setHostInventory(inventory);
setLinkedServices(externalServices);
setOwnershipViews(ownership);
```

Pass to dashboard:

```tsx
ownershipViews={ownershipViews}
```

- [ ] **Step 4: Render existing services in ApplicationsDashboard**

In `frontend/src/pages/ApplicationsPage/ApplicationsDashboard.tsx`, import:

```tsx
import type { AppOwnershipView } from '@/types/appOwnership';
import { FoundServicesPanel } from './FoundServicesPanel';
```

Add prop:

```ts
ownershipViews: AppOwnershipView[];
```

Compute:

```tsx
const existingServiceViews = ownershipViews.filter((view) =>
  ['found_on_server', 'linked_service', 'managed_elsewhere', 'recoverable', 'blocked'].includes(view.state)
);
```

In basic view, before linked services, render:

```tsx
<FoundServicesPanel items={existingServiceViews} />
```

In the advanced view, render the same panel immediately after the managed apps table:

```tsx
<CardContent className="p-0">
  <div className={cn('grid border-b border-white/10 px-5 py-2 text-xs font-semibold text-slate-500', gridColumns)}>
    <span>Application</span>
    <span>Status</span>
    <span>CPU</span>
    <span>Memory</span>
    {showAdvancedMetrics && <span>Uptime</span>}
    <span className="text-right">Actions</span>
  </div>
  {/* existing managed app rows remain here */}
  <div className="border-t border-white/10 p-5">
    <FoundServicesPanel items={existingServiceViews} />
  </div>
</CardContent>
```

Do not build a second adoption UI in Discover.

- [ ] **Step 5: Keep managed app counts honest**

In `ApplicationsPage.tsx`, ensure summary uses only `apps` from `/api/app-instances`, not ownership views:

```tsx
const appSummary = useMemo(() => ({
  installed: apps.length,
  running: apps.filter((app) => displayStatus(app, healthByAppId[app.appId] || app.healthSnapshot) === 'Ready').length,
  stopped: apps.filter((app) => displayStatus(app, healthByAppId[app.appId] || app.healthSnapshot) === 'Paused').length,
  unhealthy: apps.filter((app) => appNeedsAttention(app, telemetryByAppId[app.appId], accessByAppId[app.appId], healthByAppId[app.appId] || app.healthSnapshot)).length,
}), [accessByAppId, apps, healthByAppId, telemetryByAppId]);
```

- [ ] **Step 6: Run frontend checks**

Run:

```bash
cd frontend
yarn typecheck
yarn lint
yarn build
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add frontend/src/api/AppOwnershipAPIClient.ts \
  frontend/src/pages/ApplicationsPage/ApplicationsPage.tsx \
  frontend/src/pages/ApplicationsPage/ApplicationsDashboard.tsx \
  frontend/src/pages/ApplicationsPage/FoundServicesPanel.tsx
git commit -m "Align My Apps with ownership state"
```

---

## Task 6: Enhanced Detected-App Controls In My Apps

**Files:**
- Modify: `backend/src/main/java/com/projectos/host/HostResourceActionService.java`
- Modify: `backend/src/main/java/com/projectos/host/HostResourceRecoveryPlan.java`
- Modify: `frontend/src/pages/ApplicationsPage/FoundServicesPanel.tsx`
- Modify: `frontend/src/api/HostInventoryAPIClient.ts`
- Test: `backend/src/test/java/com/projectos/host/HostResourceActionServiceTests.java`

- [ ] **Step 1: Add backend tests for adoption wording and unmanaged resources**

Create or update `backend/src/test/java/com/projectos/host/HostResourceActionServiceTests.java` with tests for:

```java
@Test
void adoptionPlanAllowsLegacyProjectOsResourcesAndUsesAdoptionLanguage() {
    HostResourceRecoveryPlan plan = service.recoveryPlan("docker:legacy-homepage");

    assertThat(plan.recoverable()).isTrue();
    assertThat(plan.steps()).anySatisfy(step -> assertThat(step).contains("bring Homepage under Project OS management"));
    assertThat(plan.confirmationText()).isEqualTo("ADOPT HOMEPAGE");
}

@Test
void adoptionPlanBlocksUnmanagedDockerUntilGuidedAdoptionIsSupported() {
    HostResourceRecoveryPlan plan = service.recoveryPlan("docker:plain-jellyfin");

    assertThat(plan.recoverable()).isFalse();
    assertThat(plan.blockedReasons()).contains("Project OS can link this service or install a managed copy, but guided adoption for unmanaged Docker containers is not available yet.");
}
```

Expected initial result: FAIL due old recovery wording and unsupported fixture/test setup.

- [ ] **Step 2: Rename recovery copy to adoption copy**

In `HostResourceActionService.recoveryPlan`, keep the existing Java method names in this slice and change user-facing strings:

```java
"Bring " + displayName + " under Project OS management without deleting data.",
"Keep the existing Docker container and runtime files in place.",
"Hide this found service prompt after adoption."
```

Set confirmation text:

```java
"ADOPT " + displayName.toUpperCase()
```

For unmanaged Docker resources, return:

```java
blockedReasons.add("Project OS can link this service or install a managed copy, but guided adoption for unmanaged Docker containers is not available yet.");
```

This is honest and complete for the current supported adoption capability in this plan: legacy Project OS resources are adoptable; arbitrary Docker adoption is blocked with clear copy and does not create an installed app record.

- [ ] **Step 3: Add My Apps control buttons**

In `FoundServicesPanel.tsx`, add actions based on ownership state:

```tsx
{item.state === 'recoverable' && (
  <Button asChild className="bg-amber-400 text-slate-950 hover:bg-amber-300" size="sm">
    <Link to={item.reviewExistingHref}>Review adoption plan</Link>
  </Button>
)}
{item.state === 'found_on_server' && (
  <>
    <Button asChild className="bg-amber-400 text-slate-950 hover:bg-amber-300" size="sm">
      <Link to={item.reviewExistingHref}>Review service</Link>
    </Button>
    <Button asChild className={poButtonClass('quiet')} size="sm" variant="outline">
      <Link to={`/discover?app=${encodeURIComponent(item.catalogAppId)}`}>Install managed copy</Link>
    </Button>
  </>
)}
{item.state === 'linked_service' && (
  <Button asChild className={poButtonClass('quiet')} size="sm" variant="outline">
    <Link to={`/discover?app=${encodeURIComponent(item.catalogAppId)}`}>Install managed copy</Link>
  </Button>
)}
```

- [ ] **Step 4: Run tests**

Run:

```bash
cd backend
./gradlew test --tests com.projectos.host.HostResourceActionServiceTests
cd ../frontend
yarn typecheck
yarn lint
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/src/main/java/com/projectos/host/HostResourceActionService.java \
  backend/src/main/java/com/projectos/host/HostResourceRecoveryPlan.java \
  backend/src/test/java/com/projectos/host/HostResourceActionServiceTests.java \
  frontend/src/pages/ApplicationsPage/FoundServicesPanel.tsx
git commit -m "Improve detected service controls"
```

---

## Task 7: Remove Divorced Frontend Ownership Logic

**Files:**
- Modify/Delete: `frontend/src/pages/MarketplacePage/extensions/MarketplacePage.logic.js`
- Modify/Delete: `frontend/src/pages/MarketplacePage/extensions/MarketplacePage.logic.test.mjs`
- Delete: `frontend/src/pages/MarketplacePage/extensions/MarketplacePage.setup.js`
- Delete: `frontend/src/pages/MarketplacePage/extensions/MarketplacePage.setup.test.mjs`
- Modify: `frontend/src/api/InstalledAppsAPIClient.ts`

- [ ] **Step 1: Remove dead setup derivation**

Delete with `apply_patch` delete hunks:

```patch
*** Begin Patch
*** Delete File: frontend/src/pages/MarketplacePage/extensions/MarketplacePage.setup.js
*** End Patch
```

```patch
*** Begin Patch
*** Delete File: frontend/src/pages/MarketplacePage/extensions/MarketplacePage.setup.test.mjs
*** End Patch
```

- [ ] **Step 2: Strip ownership/card helpers from MarketplacePage.logic.js**

Keep only these exported helper names in `MarketplacePage.logic.js`:

```txt
START_HERE_DISMISSAL_KEY
marketplaceVisibleApps
starterAppsForMarketplace
shouldShowStartHereSection
starterCatalogForDiscover
formatMarketplaceActivityTime
marketplaceActivityTone
```

Delete:

```js
discoverAppCardView
discoverAppState
discoverAppStateLabel
discoverAppStateDescription
discoverAppPrimaryAction
discoverAppPrimaryActionLabel
optionsFromInstalledSettings
```

- [ ] **Step 3: Update tests**

In `MarketplacePage.logic.test.mjs`, remove tests for deleted helpers and keep tests for search/sort/starter behavior.

- [ ] **Step 4: Remove old response normalization**

In `frontend/src/api/InstalledAppsAPIClient.ts`, replace:

```ts
async listApps() {
  const response = await httpClient.get<unknown>('/api/apps');
  return normalizeAppList(response.data);
}
```

with:

```ts
async listApps() {
  const response = await httpClient.get<AppRuntimeView[]>('/api/apps');
  return response.data;
}
```

Delete `normalizeAppList`.

- [ ] **Step 5: Search for stale imports**

Run:

```bash
rg "discoverAppCardView|setupPreviewForApp|installOptionsFromSetupAnswers|defaultSetupAnswers|optionsFromInstalledSettings|normalizeAppList" frontend/src
```

Expected: no results.

- [ ] **Step 6: Run frontend tests/checks**

Run:

```bash
cd frontend
for f in $(rg --files src | rg '\\.test\\.mjs$'); do node --test "$f" || exit 1; done
yarn typecheck
yarn lint
yarn build
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add frontend/src/pages/MarketplacePage/extensions \
  frontend/src/api/InstalledAppsAPIClient.ts
git commit -m "Remove stale frontend ownership derivation"
```

---

## Task 8: Full Verification And Manual Smoke

**Files:**
- Verify: all files changed by Tasks 1-7.

- [ ] **Step 1: Backend verification**

Run:

```bash
cd backend
./gradlew test
```

Expected: `BUILD SUCCESSFUL`.

- [ ] **Step 2: Frontend verification**

Run:

```bash
cd frontend
for f in $(rg --files src | rg '\\.test\\.mjs$'); do node --test "$f" || exit 1; done
yarn typecheck
yarn lint
yarn build
```

Expected: all pass.

- [ ] **Step 3: Start backend on non-conflicting port**

Run:

```bash
cd backend
./gradlew bootRun --args='--server.port=8083'
```

Expected: backend starts and Flyway reports schema at latest migration.

- [ ] **Step 4: Start frontend proxying to that backend**

Run:

```bash
cd frontend
PROJECT_OS_BACKEND_URL=http://localhost:8083 yarn dev --host 127.0.0.1
```

Expected: Vite starts on an available local port.

- [ ] **Step 5: API smoke**

Run:

```bash
curl -fsS http://localhost:8083/api/app-ownership | jq 'map({id:.catalogAppId,state:.state,installed:.installed,owned:.ownedByCurrentInstance})[0:5]'
curl -fsS http://localhost:8083/api/discover/apps | jq 'map({id:.id,state:.state,installed:.installed,warning:.installCopyWarningRequired})[0:5]'
curl -fsS http://localhost:8083/api/app-instances | jq 'map({id:.catalogAppId,ownership:.ownershipState})[0:5]'
```

Expected:

- `/api/app-ownership` returns all catalog apps with canonical states.
- `/api/discover/apps` mirrors those states.
- `/api/app-instances` returns only current-instance managed apps.

- [ ] **Step 6: Manual UI smoke**

Use fixtures or local data to validate:

- Available app card: compact, `Available`, `Review setup`.
- Current-instance installed app: `Installed`, card visually distinct, My Apps managed count includes it.
- Linked service matching catalog app: Discover shows `Linked service`, not installed; My Apps shows it under existing/linked services.
- Local found service matching catalog app: Discover shows `Existing service`, not installed; detail recommends Applications review.
- Duplicate install warning appears before installing separate copy.
- `Hide installed` hides only `installed_managed` cards.
- Card heights remain stable on desktop and mobile widths.

- [ ] **Step 7: Check for uncommitted verification fixes**

Run:

```bash
git status --short
```

Expected: no uncommitted files from Tasks 1-7. If the previous verification steps forced code changes, stage only those changed files shown by `git status --short` and commit:

```bash
git commit -m "Fix ownership flow verification issues"
```

---

## Self-Review Checklist

- Spec coverage:
  - Canonical installed/found/linked state: Tasks 1-3.
  - Marketplace compact cards and duplicate warning: Task 4.
  - My Apps aligned with Marketplace: Task 5.
  - Enhanced detected-app controls: Task 6.
  - Refactoring/deleting old frontend ownership logic: Task 7.
  - Backend, DB, and verification: Tasks 1, 2, 8.

- No backwards compatibility:
  - Task 7 removes compatibility normalization and stale local setup rules.
  - Task 2 changes external service schema directly with a forward migration.

- Residual risk:
  - Arbitrary unmanaged Docker adoption is not falsely claimed. It remains blocked with honest copy and does not create an installed app record in this plan.
