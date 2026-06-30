# Tempered Control Center Theme Design

Date: 2026-06-30

## Goal

Update Project OS so the whole application feels closer to the redesigned My Apps page: a calm appliance frame with a readable blue-gray workspace, clearer controls, and less visual noise. The work should start at the global theme and shell level before moving page by page.

## Design Direction

Use the **Tempered My Apps** direction as the global baseline.

- The outer shell stays dark and appliance-like.
- The main workspace shifts away from near-black dark blue toward readable blue-gray surfaces.
- Cards become toned-down blue-gray instead of bright sky blue.
- Cyan is the only global primary action and active-navigation color.
- Orange is reserved for attention, recovery, warnings, and “needs review.”
- Red is reserved for destructive actions and failed states.
- Purple is removed from the core theme except where a future page intentionally reintroduces it for a specific visual purpose.

The result should feel like an interactable control center, not a manuscript or infrastructure dashboard.

## Implementation Order

### 1. Theme Tokens

Start in `frontend/src/styles.css`.

Replace the current purple-heavy, very dark `po-*` palette with semantic tokens for:

- app background
- page/workspace background
- shell/sidebar surface
- default card surface
- elevated card surface
- inset surface
- muted surface
- subtle border
- strong border
- primary action
- attention
- danger
- success
- readable primary/secondary/muted text

Update shadcn tokens at the same time so cards, popovers, sheets, buttons, inputs, tabs, dropdowns, and dialogs inherit the same palette.

### 2. Outer Shell

Update:

- `AppShell`
- `Sidebar`
- `MobileAppBar`
- `SystemStatusHeader`

The shell should establish the new product frame:

- dark but not black-blue
- quieter border treatment
- clear active navigation
- compact status controls
- fewer glows
- no transparent popover or sheet backgrounds
- readable text at a glance

### 3. Shared Project OS Components

Update shared components before page-level redesigns:

- `PageShell`
- `PageSection`
- `SoftCard`
- `StatusPill`
- `PrimaryActionCard`
- `EmptyState` / loading / error states
- `DisabledAction`
- `JobProgress`
- `TailscaleControlPopover`

These components should carry the new theme across pages and reduce one-off styling.

### 4. Page Migration

After shell and shared components are stable, migrate pages in this order:

1. Home
2. Discover
3. Access
4. Backups
5. Storage
6. Monitoring
7. Settings
8. Support

Each page pass should remove dead controls, reduce noisy copy, and keep one clear next action where possible.

## Product Rules

- Use cyan for primary actions and selected/active states.
- Use orange only for attention, recovery, and warning states.
- Use red only for destructive or failed states.
- Do not invent page-specific colors unless the global tokens cannot cover the case.
- Do not leave visible placeholder controls.
- Prefer hover, popover, sheet, tooltip, or disclosure patterns for supporting context instead of always-visible explanatory text.
- Maintain clear disabled-action explanations.
- Keep operational pages calm and scannable.

## Non-Goals

- Do not redesign every page in the first implementation pass.
- Do not change backend behavior as part of the theme foundation unless a visible control is dead or misleading.
- Do not introduce a second competing palette for individual pages.
- Do not keep the old purple/dark-blue visual language as a fallback path.

## Validation

Each implementation slice should run the smallest relevant checks:

- frontend typecheck
- frontend build
- targeted component/page contract tests where touched
- visual smoke check for shell, popovers, dropdowns, sheets, and mobile navigation

Manual review should check:

- text readability
- transparent or unreadable popovers
- clipped controls
- active navigation clarity
- primary action visibility
- warning/destructive state distinction
- mobile shell usability

