# Unified App Ownership Contract

This contract is the integration source of truth for the Discover marketplace and My Apps work. Backend and frontend implementation must follow this shape exactly. Do not create page-local ownership state names or derive installed/found/linked status in React.

If this contract conflicts with older inline snippets in `docs/superpowers/plans/2026-06-21-unified-app-ownership-flow.md`, this contract wins. Workers must use this file for record shapes, action shapes, state priority, sorting, nullability, and duplicate-warning copy.

## Canonical Endpoint

`GET /api/app-ownership`

Returns one `AppOwnershipView` per catalog app, sorted by app name.

## Canonical States

- `available`: catalog app can be installed by this Project OS instance.
- `installed_managed`: installed and owned by the current Project OS instance.
- `linked_service`: user-added external shortcut matching this catalog app. It is not installed.
- `found_on_server`: matching service was detected on the host/network but is not Project OS managed. It is not installed.
- `recoverable`: legacy Project OS resource can be adopted into this instance. It is not installed until adoption succeeds.
- `managed_elsewhere`: resource belongs to another Project OS instance. It is not installed.
- `blocked`: matching resource creates an install conflict. It is not installed.
- `coming_soon`: reserved for a future manifest-level installability field. The current catalog schema has no such field, so this sprint must not emit `coming_soon` unless that backend schema field is added in the same change.

Only `installed_managed` may set `installed=true` and `ownedByCurrentInstance=true`.

## AppOwnershipView

Backend record and TypeScript type must expose:

- `catalogAppId: string`
- `name: string`
- `category: string`
- `image: string`
- `summary: string`
- `description: string`
- `state: AppOwnershipState`
- `stateLabel: string`
- `stateDescription: string`
- `statusTone: "neutral" | "success" | "info" | "warning" | "danger"`
- `installed: boolean`
- `ownedByCurrentInstance: boolean`
- `installCopyWarningRequired: boolean`
- `reviewExistingHref: string | null`
- `primaryAction: AppOwnershipAction`
- `availableActions: AppOwnershipAction[]`
- `installedApp: DiscoverInstalledAppSummary | null`
- `foundResource: HostInventoryResource | null`
- `linkedService: ExternalService | null`

## AppOwnershipAction

Action records must expose:

- `id: string`
- `label: string`
- `kind: "route" | "external" | "install" | "disabled"`
- `href: string | null`
- `method: string | null`
- `disabled: boolean`
- `reason: string`

Required action IDs:

- `review_setup`: install/review for `available`
- `manage`: route to `/apps` for `installed_managed`
- `open`: external URL for installed or linked app when URL exists
- `review_existing`: route to `reviewExistingHref` for `linked_service`, `found_on_server`, `recoverable`, `managed_elsewhere`, or `blocked`
- `install_copy`: explicit duplicate install path for non-installed existing-service states
- `unavailable`: disabled action for `coming_soon`

## State Mapping Rules

Priority order per catalog app:

1. `installed_managed` if `InstalledAppRepository.findById(catalogAppId)` exists and ownership is compatible with the current instance. Compatible means ownership metadata is absent, or `ownership_status=owned` and `project_os_instance_id` is blank or equals `DockerOwnershipService.currentIdentity().instanceId()`. Legacy, foreign, unmanaged, or uncertain metadata must not be marked installed.
2. `recoverable` if host inventory has `ownershipState=legacy_project_os`.
3. `managed_elsewhere` if host inventory has `ownershipState=foreign_project_os`.
4. `blocked` if host inventory has `ownershipState=unknown_conflict`.
5. `linked_service` if `external_services.catalog_app_id` equals the catalog app id.
6. `found_on_server` if host inventory has a non-owned matching `catalogAppId`.
7. `available`.

`/api/app-ownership` must sort by app name, case-insensitive.

## Duplicate Install Warning

`installCopyWarningRequired=true` for:

- `linked_service`
- `found_on_server`
- `recoverable`
- `managed_elsewhere`
- `blocked`

Marketplace cards must stay compact and only show the state badge. Marketplace detail must explain the issue and prefer review/adoption. Starting an install for one of those states requires a strong confirmation dialog before calling the install endpoint.

Warning copy:

Title: `Install a second copy?`

Body: `Project OS already found a matching service for this app. Installing another copy can leave two versions running at the same time. That can very likely cause confusing behavior across your network, especially when other devices try to connect. The recommended path is to review the existing service and adopt or link it when possible.`

Primary action: `Review existing service`

Secondary action: `Install second copy anyway`

## Discover Contract

`DiscoverAppView` must include all canonical ownership fields from `AppOwnershipView` and continue to include:

- `id`
- `app`
- `serviceKindLabel`
- `estimatedInstallTime`
- `difficulty`
- `setupSchema`

Discover must not decide installed/found/linked state itself. It receives that state from `AppOwnershipService`.

## My Apps Contract

My Apps must load `/api/app-ownership` and use it to build:

- managed app cards from `state=installed_managed`
- existing service controls from `linked_service`, `found_on_server`, `recoverable`, `managed_elsewhere`, and `blocked`

`/api/app-instances` remains the runtime-management endpoint for current-instance managed apps only. My Apps may join runtime telemetry onto managed ownership views, but it must not show foreign, linked, or observed resources as installed.

Detected service controls must be:

- `recoverable`: review adoption plan, adopt, open when URL exists, or install second copy via Discover.
- `linked_service`: open, remove link, or install managed copy via Discover with duplicate warning.
- `found_on_server`: open when URL exists, link external service when supported, ignore, or install managed copy via Discover with duplicate warning.
- `managed_elsewhere`: review cleanup plan, open when URL exists, or install managed copy via Discover with duplicate warning.
- `blocked`: review details. Do not offer normal install as primary action.

Unmanaged Docker adoption is not claimed. If the backend cannot safely adopt it, copy must say: `Project OS can link this service or install a managed copy, but guided adoption for unmanaged Docker containers is not available yet.`

## Linked Services Schema

`external_services` must include nullable `catalog_app_id`.

`ExternalService` and `ExternalServiceRequest` must expose `catalogAppId`.

When a user links a detected service from a host resource, the request must preserve the matching `catalogAppId` so Marketplace and My Apps agree that the app is a linked service, not installed.

## Non-Negotiables

- Do not set `installed=true` for linked, found, recoverable, foreign, or blocked services.
- Do not infer installed state from `foundResource`, URL, or linked service presence.
- Do not auto-adopt resources.
- Do not hide duplicate-install impact in the card grid. Explain it in detail view and confirmation.
- Do not leave a visible dead control.
