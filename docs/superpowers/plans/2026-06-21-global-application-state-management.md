# Global Application State Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current linked-service model with a canonical global application state model that permanently tracks all observed containers/services, distinguishes managed and pinned apps, supports adoption/usurping control, and keeps Marketplace, My Apps, and Overview in agreement.

**Architecture:** Backend owns app state through a persistent observed-service inventory. My Apps, Marketplace, and Overview render derived view models from the same canonical service instead of recomputing ownership locally. “Linked” is removed from user-facing vocabulary and replaced by “Pinned” for external services the user wants surfaced in My Apps/Home.

**Tech Stack:** Spring Boot Java backend, Flyway SQL migrations, existing Docker discovery services, React/TypeScript frontend, shadcn/ui/Radix components, Tailwind, existing Node unit tests and Gradle backend tests.

---

## Vocabulary And Product Contract

The implementation must use these user-facing states consistently:

- `Managed`: Installed and owned by this Project OS instance.
- `Pinned`: Observed external service the user saved to My Apps/Home. Project OS can open/check it but does not own it.
- `Found`: Observed container/service that Project OS knows about but the user has not pinned or adopted.
- `Recoverable`: Legacy Project OS app or compatible app resources that can be adopted while preserving data.
- `Owned elsewhere`: Found app owned by another Project OS instance.
- `Conflict`: Found resource that blocks or complicates installing a managed copy.
- `Available`: Catalog app with no matching managed, pinned, found, recoverable, foreign, or conflict resource.

The word `Linked` should be removed from primary UI copy, labels, actions, and state names. Backend compatibility is not required.

Observed services are durable system facts. A user must not be able to delete or fully hide an observed container/service from Project OS. They can unpin it from My Apps, but it must remain visible in the observed/known services section and must continue to affect duplicate-install warnings.

---

## File Map

### Backend: New Or Replaced State Layer

- Create `backend/src/main/java/com/projectos/host/ObservedService.java`
  - Immutable record for persisted observed resources.
- Create `backend/src/main/java/com/projectos/host/ObservedServiceRepository.java`
  - CRUD and upsert access to `observed_services`.
- Create `backend/src/main/java/com/projectos/host/ObservedServiceScanner.java`
  - Converts Docker inventory and manually added URLs into observed service candidates.
- Create `backend/src/main/java/com/projectos/host/ObservedServiceService.java`
  - Canonical state service: refresh inventory, list observed services, pin/unpin, ignore noise without hiding, match catalog apps, and produce action results.
- Create `backend/src/main/java/com/projectos/host/ObservedServiceController.java`
  - API endpoints for My Apps service management.
- Create `backend/src/main/java/com/projectos/host/ObservedServiceView.java`
  - Frontend-safe view model for observed services.
- Create `backend/src/main/java/com/projectos/host/ObservedServiceAction.java`
  - Typed available actions for each observed service.
- Create `backend/src/main/java/com/projectos/host/ObservedServiceSource.java`
  - Enum-like string constants: `docker`, `manual_url`, `network`.
- Create `backend/src/main/java/com/projectos/host/ObservedServiceStatus.java`
  - Enum-like string constants: `managed`, `pinned`, `found`, `recoverable`, `owned_elsewhere`, `conflict`.
- Create `backend/src/main/resources/db/migration/V8__observed_services.sql`
  - Creates `observed_services`.
- Create `backend/src/main/resources/db/migration/V9__migrate_external_services_to_observed_services.sql`
  - Migrates old `external_services` rows into pinned observed services, then stops relying on `external_services`.

### Backend: Existing Files To Modify

- Modify `backend/src/main/java/com/projectos/apps/AppOwnershipState.java`
  - Replace `LINKED_SERVICE` with `PINNED_EXTERNAL`.
  - Add explicit states needed by Marketplace card color semantics.
- Modify `backend/src/main/java/com/projectos/apps/AppOwnershipView.java`
  - Replace `linkedService` field with `observedService`.
  - Add `cardTone`, `userStatus`, and `userStatusDescription`.
- Modify `backend/src/main/java/com/projectos/apps/AppOwnershipService.java`
  - Consume `ObservedServiceService` instead of `ExternalServiceRepository`.
  - Derive state from managed installed apps plus observed services.
- Modify `backend/src/main/java/com/projectos/discover/DiscoverService.java`
  - Source Marketplace app state exclusively from `AppOwnershipProvider`.
- Modify `backend/src/main/java/com/projectos/discover/DiscoverAppView.java`
  - Add `cardTone` for Marketplace card background.
- Modify `backend/src/main/java/com/projectos/marketplace/install/MarketplaceInstallService.java`
  - Add duplicate preflight from observed services.
  - Add post-install ownership reconciliation before success.
- Modify `backend/src/main/java/com/projectos/marketplace/api/MarketplaceController.java`
  - Require duplicate acknowledgement when observed matching services exist.
- Modify `backend/src/main/java/com/projectos/host/HostInventoryService.java`
  - Keep raw Docker scan behavior but remove user-facing hide semantics for app inventory.
- Modify or retire `backend/src/main/java/com/projectos/host/ExternalServiceService.java`
  - Stop using it as app truth. Existing routes can be removed or changed to delegate to observed service pin/unpin if still referenced during transition.
- Modify `backend/src/main/java/com/projectos/host/ExternalServiceController.java`
  - Remove or replace endpoints with observed service endpoints.
- Modify `backend/src/main/java/com/projectos/host/ExternalServiceRepository.java`
  - Remove after migration if no remaining references.
- Modify `backend/src/main/java/com/projectos/host/HostInventoryIgnoreRepository.java`
  - Keep only for diagnostics if needed. It must not hide observed services from My Apps.

### Backend Tests

- Create `backend/src/test/java/com/projectos/host/ObservedServiceServiceTests.java`.
- Create `backend/src/test/java/com/projectos/host/ObservedServiceControllerTests.java`.
- Modify `backend/src/test/java/com/projectos/apps/AppOwnershipServiceTests.java`.
- Modify `backend/src/test/java/com/projectos/discover/DiscoverServiceTests.java`.
- Modify `backend/src/test/java/com/projectos/marketplace/MarketplaceInstallServiceTests.java`.

### Frontend: New Types/API

- Create `frontend/src/types/observedService.ts`.
- Create `frontend/src/api/ObservedServicesAPIClient.ts`.

### Frontend: Existing Files To Modify

- Modify `frontend/src/types/appOwnership.ts`
  - Replace `linked_service` with `pinned_external`.
  - Replace `linkedService` with `observedService`.
  - Add `cardTone`.
- Modify `frontend/src/types/discover.ts`
  - Add `cardTone`.
- Modify `frontend/src/pages/ApplicationsPage/ApplicationsPage.tsx`
  - Fetch observed services.
  - Show Managed + Pinned as the main My Apps grid.
  - Show all observed/known services permanently in a separate management section.
- Modify `frontend/src/pages/ApplicationsPage/ApplicationsDashboard.tsx`
  - Render visual distinction between managed app cards and pinned external app cards.
- Replace or heavily modify `frontend/src/pages/ApplicationsPage/FoundServicesPanel.tsx`
  - Rename component to `ObservedServicesPanel`.
  - Review opens a real details sheet/dialog.
- Create `frontend/src/pages/ApplicationsPage/ObservedServiceDetailsSheet.tsx`
  - Functional controls: Open, Pin, Unpin, Adopt, Install separate copy, Change app match, View details.
- Modify `frontend/src/pages/ApplicationsPage/extensions/ApplicationsPage.ownershipModel.js`
  - Update derived lists for managed, pinned, and observed services.
- Modify `frontend/src/pages/MarketplacePage/MarketplaceAppList.tsx`
  - Apply card background tones based on canonical app state.
- Modify `frontend/src/pages/MarketplacePage/MarketplaceAppDetail.tsx`
  - Explain observed-service duplicate risk in detail view, not on cards.
- Modify `frontend/src/pages/MarketplacePage/DuplicateInstallWarningDialog.tsx`
  - Use stronger non-technical warning copy.
- Modify `frontend/src/pages/OverviewPage/OverviewPage.tsx`
  - Replace linked-service reads with observed-service/pinned-service reads.
- Modify `frontend/src/pages/ResolveExistingAppsPage/ResolveExistingAppsPage.tsx`
  - Replace “Add linked service” with “Pin to My Apps” or “Adopt”.

### Frontend Tests

- Modify `frontend/src/pages/ApplicationsPage/extensions/ApplicationsPage.ownershipModel.test.mjs`.
- Modify `frontend/src/pages/MarketplacePage/extensions/MarketplacePage.logic.test.mjs`.
- Add `frontend/src/pages/ApplicationsPage/extensions/ObservedServicesPanel.test.mjs` if component logic is split.

---

## Canonical Backend Data Model

Create `V8__observed_services.sql`:

```sql
create table if not exists observed_services (
    id text primary key,
    source text not null,
    fingerprint text not null,
    display_name text not null,
    url text,
    category text not null default 'External',
    access_scope text not null default 'LAN',
    catalog_app_id text,
    catalog_match_confidence text not null default 'unknown',
    ownership_state text not null,
    user_visibility text not null default 'observed',
    runtime_state text not null default 'unknown',
    health_check_enabled boolean not null default false,
    project_os_instance_id text,
    first_seen_at text not null,
    last_seen_at text not null,
    pinned_at text,
    ignored_at text,
    metadata_json text not null default '{}',
    unique(source, fingerprint)
);

create index if not exists idx_observed_services_catalog_app_id on observed_services(catalog_app_id);
create index if not exists idx_observed_services_user_visibility on observed_services(user_visibility);
create index if not exists idx_observed_services_ownership_state on observed_services(ownership_state);
```

Create `V9__migrate_external_services_to_observed_services.sql`:

```sql
insert or ignore into observed_services (
    id,
    source,
    fingerprint,
    display_name,
    url,
    category,
    access_scope,
    catalog_app_id,
    catalog_match_confidence,
    ownership_state,
    user_visibility,
    runtime_state,
    health_check_enabled,
    first_seen_at,
    last_seen_at,
    pinned_at,
    metadata_json
)
select
    'manual:' || id,
    'manual_url',
    lower(url),
    name,
    url,
    category,
    access_scope,
    catalog_app_id,
    case when catalog_app_id is null or catalog_app_id = '' then 'unknown' else 'user' end,
    'external',
    'pinned',
    'unknown',
    health_check_enabled,
    created_at,
    created_at,
    created_at,
    '{}'
from external_services;
```

Do not delete `external_services` in this migration. Stop reading it from app state code first. A later cleanup sprint can remove the old table and code.

---

## API Contract

Add these endpoints:

```txt
GET    /api/observed-services
POST   /api/observed-services/refresh
GET    /api/observed-services/{id}
POST   /api/observed-services/{id}/pin
POST   /api/observed-services/{id}/unpin
POST   /api/observed-services/{id}/match
POST   /api/observed-services/{id}/adoption-plan
POST   /api/observed-services/{id}/adopt
```

Do not add a hard-delete endpoint for observed services.

`GET /api/observed-services` returns all observed services, including ignored/noisy resources. User-facing sections can collapse lower priority services, but every container/service must remain discoverable on the page.

View model:

```java
public record ObservedServiceView(
        String id,
        String source,
        String displayName,
        String url,
        String category,
        String accessScope,
        String catalogAppId,
        String catalogMatchConfidence,
        String userStatus,
        String userStatusLabel,
        String userStatusDescription,
        String ownershipState,
        String runtimeState,
        boolean pinned,
        boolean managedByThisProjectOs,
        boolean adoptable,
        boolean duplicateInstallWarningRequired,
        List<ObservedServiceAction> availableActions,
        Map<String, String> metadata) {
}
```

Action result shape should reuse existing `ActionResult` where practical:

```java
public record ActionResult(
        boolean ok,
        String severity,
        String title,
        String message,
        String subjectId,
        String nextAction) {
}
```

---

## State Priority Rules

For each catalog app, `AppOwnershipService` must choose state in this order:

1. `installed_managed` if current Project OS owns a matching installed app.
2. `recoverable` if observed service has legacy Project OS metadata and can be adopted.
3. `managed_elsewhere` if observed service belongs to another Project OS instance.
4. `blocked` if observed service has a port/container/resource conflict.
5. `pinned_external` if an observed service is pinned and matched to the catalog app.
6. `found_on_server` if an observed service is matched to the catalog app but not pinned.
7. `available` if no observed or managed state applies.

The Marketplace `cardTone` mapping:

```txt
installed_managed  -> success
pinned_external    -> info
found_on_server    -> observed
recoverable        -> warning
managed_elsewhere  -> danger
blocked            -> danger
available          -> neutral
coming_soon        -> muted
```

Marketplace card backgrounds must use this state, not the action button style.

---

## Adoption / Usurp Control Contract

Adoption must be plan-then-apply.

For an observed Docker service, the adoption plan should explain:

- what container(s) Project OS found
- whether the service appears to match a catalog app
- what labels/metadata Project OS will add or update
- whether containers will be restarted
- what data paths appear to exist
- whether a safety checkpoint can be created
- what Project OS will own after adoption

Initial adoption scope:

- Support Docker containers with enough metadata to identify an app or a user-selected catalog match.
- Support legacy Project OS resources.
- Support foreign Project OS resources only after explicit “take control” confirmation.
- Do not claim adoption is available for arbitrary LAN URLs with no local container/resource.

If adoption cannot be completed safely, the action should be disabled with a reason.

---

## Task 1: Add Observed Service Persistence

**Files:**
- Create: `backend/src/main/resources/db/migration/V8__observed_services.sql`
- Create: `backend/src/main/resources/db/migration/V9__migrate_external_services_to_observed_services.sql`
- Create: `backend/src/main/java/com/projectos/host/ObservedService.java`
- Create: `backend/src/main/java/com/projectos/host/ObservedServiceRepository.java`
- Test: `backend/src/test/java/com/projectos/host/ObservedServiceServiceTests.java`

- [ ] Write migrations exactly as shown in the data model section.
- [ ] Implement `ObservedService` as a Java record matching the table columns.
- [ ] Implement repository methods:
  - `List<ObservedService> findAll()`
  - `Optional<ObservedService> findById(String id)`
  - `Optional<ObservedService> findBySourceAndFingerprint(String source, String fingerprint)`
  - `void upsert(ObservedService service)`
  - `void pin(String id, Instant now)`
  - `void unpin(String id)`
  - `void updateCatalogMatch(String id, String catalogAppId, String confidence)`
- [ ] Add a repository test or service test proving migrated manual services remain as pinned observed services.
- [ ] Run: `cd backend && ./gradlew test --tests '*ObservedServiceServiceTests'`

Expected result: tests pass and observed services persist independently from old external services.

---

## Task 2: Build Continuous Observed Service Refresh

**Files:**
- Create: `backend/src/main/java/com/projectos/host/ObservedServiceScanner.java`
- Create: `backend/src/main/java/com/projectos/host/ObservedServiceService.java`
- Create: `backend/src/main/java/com/projectos/host/ObservedServiceView.java`
- Create: `backend/src/main/java/com/projectos/host/ObservedServiceAction.java`
- Modify: `backend/src/main/java/com/projectos/host/HostInventoryService.java`
- Test: `backend/src/test/java/com/projectos/host/ObservedServiceServiceTests.java`

- [ ] Add a scanner that converts `HostDockerContainerDiscovery.findContainers()` into observed services using stable fingerprints:
  - Docker source fingerprint: container name.
  - Manual URL source fingerprint: lowercase URL.
- [ ] Refresh behavior:
  - Upsert every currently seen Docker container.
  - Preserve existing `pinned_at`, `user_visibility`, and user catalog matches.
  - Update `last_seen_at`, runtime state, URL, metadata, and ownership state.
  - Do not delete missing services during refresh. Mark missing runtime as `not_seen_recently` only if needed.
- [ ] Catalog matching:
  - Prefer Docker ownership labels.
  - Then explicit user match.
  - Then exact normalized app id/name/url match.
  - Store match confidence as `label`, `user`, `inferred`, or `unknown`.
- [ ] Service view must always include available actions:
  - `open` when URL exists.
  - `pin` when not pinned.
  - `unpin` when pinned.
  - `adoption_plan` when adoptable.
  - `install_copy` when catalog match exists and service is not managed by this Project OS.
  - `change_match` for all observed non-managed services.
- [ ] Add tests:
  - Docker container remains visible after unpin.
  - Pinned state survives refresh.
  - Unmatched container is still returned.
  - Ignored/noisy container is still returned.
- [ ] Run: `cd backend && ./gradlew test --tests '*ObservedServiceServiceTests'`

Expected result: observed services are durable system facts and cannot disappear due to unpinning.

---

## Task 3: Add Observed Service API

**Files:**
- Create: `backend/src/main/java/com/projectos/host/ObservedServiceController.java`
- Test: `backend/src/test/java/com/projectos/host/ObservedServiceControllerTests.java`

- [ ] Add `GET /api/observed-services` returning `ObservedServiceService.list(true)`.
- [ ] Add `POST /api/observed-services/refresh` triggering refresh and returning all views.
- [ ] Add `GET /api/observed-services/{id}`.
- [ ] Add `POST /api/observed-services/{id}/pin`.
- [ ] Add `POST /api/observed-services/{id}/unpin`.
- [ ] Add `POST /api/observed-services/{id}/match` with body:

```java
public record ObservedServiceMatchRequest(String catalogAppId) {
}
```

- [ ] Add tests proving:
  - unpin returns success but service still appears in the list
  - no delete endpoint exists
  - match updates the catalog app id
- [ ] Run: `cd backend && ./gradlew test --tests '*ObservedServiceControllerTests'`

Expected result: frontend can manage pinned state and catalog match without deleting observed truth.

---

## Task 4: Rewire App Ownership To Observed Services

**Files:**
- Modify: `backend/src/main/java/com/projectos/apps/AppOwnershipState.java`
- Modify: `backend/src/main/java/com/projectos/apps/AppOwnershipView.java`
- Modify: `backend/src/main/java/com/projectos/apps/AppOwnershipService.java`
- Modify: `backend/src/main/java/com/projectos/apps/AppOwnershipAction.java`
- Test: `backend/src/test/java/com/projectos/apps/AppOwnershipServiceTests.java`

- [ ] Replace `LINKED_SERVICE` with `PINNED_EXTERNAL`.
- [ ] Add `cardTone` to `AppOwnershipView`.
- [ ] Replace `ExternalServiceRepository` dependency with `ObservedServiceService`.
- [ ] Call observed service refresh before deriving ownership views, or use a cached refresh with explicit staleness rules.
- [ ] Apply the state priority rules from this plan.
- [ ] Replace review hrefs:
  - Pinned/found/recoverable/foreign/conflict states use `/apps?service=<observedServiceId>`.
  - Do not emit `/apps?linked=...`.
- [ ] Add tests:
  - unpinned Vaultwarden observed service makes Discover state `found_on_server`, not `available`.
  - pinned Vaultwarden makes state `pinned_external`, not installed.
  - managed Vaultwarden wins over pinned/found state.
  - foreign Project OS resource is not installed.
  - review href uses `service=`.
- [ ] Run: `cd backend && ./gradlew test --tests '*AppOwnershipServiceTests'`

Expected result: all pages can share one honest app ownership model.

---

## Task 5: Rewire Discover And Marketplace Backend

**Files:**
- Modify: `backend/src/main/java/com/projectos/discover/DiscoverAppView.java`
- Modify: `backend/src/main/java/com/projectos/discover/DiscoverService.java`
- Modify: `backend/src/main/java/com/projectos/marketplace/install/MarketplaceInstallService.java`
- Modify: `backend/src/main/java/com/projectos/marketplace/api/MarketplaceController.java`
- Test: `backend/src/test/java/com/projectos/discover/DiscoverServiceTests.java`
- Test: `backend/src/test/java/com/projectos/marketplace/MarketplaceInstallServiceTests.java`

- [ ] Add `cardTone` to discover app responses.
- [ ] Make `DiscoverService` pass through ownership state, status, actions, and card tone from `AppOwnershipProvider`.
- [ ] Before install, check observed services for matching `catalogAppId`.
- [ ] If matching observed service exists and request lacks explicit duplicate acknowledgement, reject with an actionable warning.
- [ ] After install, refresh observed services and app ownership.
- [ ] If ownership does not become `installed_managed`, fail the job with user-safe copy:

```txt
Project OS could not confirm that this app is managed by this installation. The install was stopped so we do not show a service as installed when it is not under Project OS control.
```

- [ ] Add tests:
  - install duplicate without acknowledgement fails.
  - install duplicate with acknowledgement proceeds to install service.
  - install result fails if reconciliation does not produce `installed_managed`.
  - Discover never returns `available` for a matched observed service.
- [ ] Run:

```bash
cd backend && ./gradlew test --tests '*DiscoverServiceTests' --tests '*MarketplaceInstallServiceTests'
```

Expected result: Marketplace cannot silently install over known services, and install success cannot lie.

---

## Task 6: Replace Frontend Linked Types And API

**Files:**
- Create: `frontend/src/types/observedService.ts`
- Create: `frontend/src/api/ObservedServicesAPIClient.ts`
- Modify: `frontend/src/types/appOwnership.ts`
- Modify: `frontend/src/types/discover.ts`

- [ ] Define `ObservedServiceView` and `ObservedServiceAction` TypeScript types matching backend.
- [ ] Add API client methods:
  - `list()`
  - `refresh()`
  - `get(id)`
  - `pin(id)`
  - `unpin(id)`
  - `match(id, catalogAppId)`
  - `adoptionPlan(id)`
  - `adopt(id, confirmation)`
- [ ] Replace frontend ownership state union:
  - remove `linked_service`
  - add `pinned_external`
- [ ] Replace `linkedService` properties with `observedService`.
- [ ] Run: `cd frontend && yarn typecheck`

Expected result: TypeScript no longer exposes linked-service vocabulary in the main app state model.

---

## Task 7: Rebuild My Apps Around Managed + Pinned + Observed

**Files:**
- Modify: `frontend/src/pages/ApplicationsPage/ApplicationsPage.tsx`
- Modify: `frontend/src/pages/ApplicationsPage/ApplicationsDashboard.tsx`
- Replace: `frontend/src/pages/ApplicationsPage/FoundServicesPanel.tsx`
- Create: `frontend/src/pages/ApplicationsPage/ObservedServicesPanel.tsx`
- Create: `frontend/src/pages/ApplicationsPage/ObservedServiceDetailsSheet.tsx`
- Modify: `frontend/src/pages/ApplicationsPage/extensions/ApplicationsPage.ownershipModel.js`
- Test: `frontend/src/pages/ApplicationsPage/extensions/ApplicationsPage.ownershipModel.test.mjs`

- [ ] Fetch app instances, app ownership, and observed services together.
- [ ] Main My Apps grid includes:
  - Managed apps.
  - Pinned external apps with a distinct visual treatment and copy that says Project OS opens/checks them but does not own them.
- [ ] Add a permanent `Observed on this system` section.
  - It must show every observed service/container.
  - It must not have a hide/delete action.
  - It can group lower priority services under collapsible accordions, but they remain visible.
- [ ] Review opens `ObservedServiceDetailsSheet`.
- [ ] Details sheet actions must be real:
  - Open URL.
  - Pin to My Apps.
  - Unpin from My Apps.
  - Change catalog match.
  - Review adoption plan.
  - Adopt/take control when backend says adoptable.
  - Install separate copy with warning when catalog match exists.
- [ ] Route query `?service=<id>` opens the details sheet for that service.
- [ ] Remove `?linked=` handling and copy.
- [ ] Add tests:
  - managed and pinned apps both appear in main grid.
  - pinned app is visually classified as pinned, not managed.
  - unpinned observed service stays in observed section.
  - review target uses service id.
- [ ] Run: `cd frontend && node --test frontend/src/pages/ApplicationsPage/extensions/ApplicationsPage.ownershipModel.test.mjs`

Expected result: My Apps clearly distinguishes owned apps from saved external services and never loses observed containers.

---

## Task 8: Add Adoption / Usurp Control UI And Backend Flow

**Files:**
- Create: `backend/src/main/java/com/projectos/host/ObservedServiceAdoptionPlan.java`
- Modify: `backend/src/main/java/com/projectos/host/ObservedServiceService.java`
- Modify: `backend/src/main/java/com/projectos/host/ObservedServiceController.java`
- Modify: `frontend/src/pages/ApplicationsPage/ObservedServiceDetailsSheet.tsx`
- Test: `backend/src/test/java/com/projectos/host/ObservedServiceServiceTests.java`

- [ ] Implement adoption plan generation for Docker-backed observed services.
- [ ] Plan must include:
  - user-safe summary
  - containers affected
  - catalog app match
  - labels/metadata to be written
  - restart requirement
  - data preservation statement
  - warnings
- [ ] Apply adoption only after explicit confirmation.
- [ ] For current implementation, adoption may be limited to writing Project OS ownership metadata and refreshing state if Docker ownership service supports it.
- [ ] If Docker label mutation is not currently supported, return an actionable disabled reason and do not render a fake button.
- [ ] Add backend tests:
  - plan exists for recoverable Docker service.
  - foreign service requires stronger confirmation.
  - arbitrary manual URL is not adoptable.
  - successful adoption causes ownership state to become managed or recoverable-to-managed depending available Docker support.
- [ ] Add frontend sheet states:
  - loading plan
  - plan loaded
  - adoption disabled with reason
  - adoption success toast
  - adoption failure toast
- [ ] Run: `cd backend && ./gradlew test --tests '*ObservedServiceServiceTests'`

Expected result: adoption is a real, safe flow and never appears as a dead control.

---

## Task 9: Marketplace Card State Colors And Detail Copy

**Files:**
- Modify: `frontend/src/pages/MarketplacePage/MarketplaceAppList.tsx`
- Modify: `frontend/src/pages/MarketplacePage/MarketplaceAppDetail.tsx`
- Modify: `frontend/src/pages/MarketplacePage/DuplicateInstallWarningDialog.tsx`
- Modify: `frontend/src/pages/MarketplacePage/extensions/MarketplacePage.logic.js`
- Test: `frontend/src/pages/MarketplacePage/extensions/MarketplacePage.logic.test.mjs`

- [ ] Add card background classes by `cardTone`:

```ts
const marketplaceCardToneClass = {
  success: 'border-emerald-300/25 bg-emerald-500/10 hover:bg-emerald-500/15',
  info: 'border-sky-300/25 bg-sky-500/10 hover:bg-sky-500/15',
  observed: 'border-amber-300/25 bg-amber-500/10 hover:bg-amber-500/15',
  warning: 'border-orange-300/25 bg-orange-500/10 hover:bg-orange-500/15',
  danger: 'border-red-300/25 bg-red-500/10 hover:bg-red-500/15',
  neutral: 'border-slate-700/25 bg-slate-950/48 hover:bg-slate-900/70',
  muted: 'border-slate-700/25 bg-slate-900/35 hover:bg-slate-900/50',
};
```

- [ ] Ensure selected state adds an outline without erasing semantic tone.
- [ ] Keep Marketplace card copy compact.
- [ ] Put duplicate/service explanation in detail panel:

```txt
Project OS already sees this app on your system. Installing another copy can cause confusing behavior across your network, especially from phones, TVs, or other devices that discover services automatically. Pin or adopt the existing service when possible. Install a second copy only if you intentionally want two separate instances.
```

- [ ] Add tests:
  - observed app receives observed card tone.
  - pinned app receives info card tone.
  - managed app receives success card tone.
  - hide installed hides only managed apps, not pinned/found services unless product decision changes.
- [ ] Run: `cd frontend && node --test frontend/src/pages/MarketplacePage/extensions/MarketplacePage.logic.test.mjs`

Expected result: Marketplace gives quick visual state recognition without cluttering cards with paragraphs.

---

## Task 10: Overview And Existing Apps Flow Cleanup

**Files:**
- Modify: `frontend/src/pages/OverviewPage/OverviewPage.tsx`
- Modify: `frontend/src/pages/ResolveExistingAppsPage/ResolveExistingAppsPage.tsx`
- Modify: `frontend/src/api/ExternalServiceAPIClient.ts`
- Modify or delete after reference removal: `frontend/src/api/ExternalServiceAPIClient.ts`

- [ ] Replace Overview linked-service list with pinned observed services plus a count of observed services needing review.
- [ ] Replace `Add linked service` copy with `Pin to My Apps`.
- [ ] Replace old external service API calls with observed service API calls.
- [ ] Ensure no frontend route depends on `/api/external-services`.
- [ ] Run:

```bash
cd frontend && rg "linked|Linked|external-services|ExternalServiceAPIClient" src
```

Expected result: no user-facing linked-service vocabulary remains outside historical/internal compatibility code.

---

## Task 11: End-To-End Validation And Regression Tests

**Files:**
- Modify tests listed above as needed.
- Optional create fixture helpers under existing backend/frontend test patterns.

- [ ] Backend full test run:

```bash
cd backend && ./gradlew test
```

- [ ] Frontend logic tests:

```bash
cd frontend && node --test $(find src -name '*.test.mjs' | sort)
```

- [ ] Frontend static checks:

```bash
cd frontend && yarn lint
cd frontend && yarn typecheck
cd frontend && yarn build
```

- [ ] Manual smoke checklist:
  - Vaultwarden observed but unpinned appears in My Apps observed section.
  - Vaultwarden observed but unpinned appears in Marketplace as `Found`, not `Available`.
  - Pin Vaultwarden: it appears in My Apps main grid as pinned, visually distinct from managed.
  - Unpin Vaultwarden: it leaves main grid but remains in observed section and Marketplace still warns.
  - Review button opens functional service details sheet.
  - Install duplicate without acknowledgement is blocked.
  - Install duplicate with acknowledgement either succeeds and appears as managed, or fails honestly.
  - All Docker containers are visible somewhere on My Apps.
  - No dead buttons are visible.

Expected result: current bugs are prevented by model-level tests and manual user-flow validation.

---

## Execution Notes

- Do not preserve backwards compatibility for old linked-service state.
- Do not add a delete/hide endpoint for observed services.
- Do not show external/found/pinned services as installed.
- Do not let frontend pages infer install state independently.
- Do not render adoption controls unless the backend action is available.
- Keep raw Docker detail behind details/advanced disclosure.
- Prefer shadcn `Sheet`, `Dialog`, `Alert`, `Badge`, `Button`, `DropdownMenu`, `Accordion`, and `Tooltip`.

---

## Plan Self-Review

- Spec coverage: The plan covers vocabulary replacement, permanent observation, managed + pinned My Apps state, observed services with functional options, adoption/usurp flow, Marketplace card state colors, duplicate warning behavior, and install truthfulness.
- Placeholder scan: No `TBD` or placeholder implementation steps remain. Adoption scope is explicitly constrained where current Docker label mutation support may limit behavior.
- Type consistency: Backend and frontend use `ObservedServiceView`, `ObservedServiceAction`, `pinned_external`, `observedService`, and `cardTone` consistently.
- Risk: The largest implementation risk is Docker adoption. The plan requires disabling the action with a real reason unless backend can safely apply ownership metadata.
