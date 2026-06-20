# Project OS Docs

This folder tracks the current Project OS architecture, beta installation notes, implementation plans, and working design references.

## Current Architecture And Beta Docs

- [Non-technical install guide](./non-technical-install-guide.md): Normal-user path from choosing an installer to opening Project OS and installing the first app.
- [Install smoke test playbook](./install-smoke-test-playbook.md): Repeatable donor-machine install checks with isolated smoke service paths.
- [Marketplace runtime architecture](./marketplace-runtime.md): Core runtime model, manifest boundaries, API surface, and catalog principles.
- [Installation flow and hardening](./installation-flow-and-hardening.md): Current one-click install flow, hardening already implemented, and known gaps.
- [Manifest authoring checklist](./manifest-authoring-checklist.md): Required manifest fields, access expectations, install readiness, and test expectations.
- [Service user installation](./service-user-installation.md): System service-user setup, durable host paths, systemd, Docker, and Tailscale operator requirements.
- [Street-to-seat installation](./street-to-seat-installation.md): Full host bootstrap flow, production packaging, helper command, and future public installer model.
- [Local development](./local-development.md): Opt-in Spring `dev` profile, mock Tailscale behavior, and local frontend/backend commands.
- [Pi beta install and next development](./pi-beta-install-and-next-development.md): Real-device beta findings, installer simplification, release/update planning, SSD runtime behavior, manifest expansion, autowire setup, network bug follow-up, and future developer deploy ideas.
- [Implemented page temporary functionality audit](./implemented-page-temporary-functionality-audit.md): Known temporary or limited behavior in implemented pages, excluding intentional placeholder pages.
- [Update manager smoke targets](./update-manager-smoke-targets.md): Vaultwarden and Jellyfin smoke checks for app update policy, checkpoints, health, and rollback.

## Planning Archive

- [Marketplace install stories](./plans/marketplace-install-stories.md): Story-driven implementation slices for marketplace installation.
- [Access reliability and self-healing plan](./plans/access-reliability-self-healing-plan.md): Private access reliability, service health, repair workflows, and user-facing stability plan.
- [User-facing hardening stories](./plans/user-facing-hardening-stories.md): Page stories for monitoring, setup health, devices, storage, backups, manifest health, private access cleanup, and support diagnostics.
- [Frontend simplification and automation plan](./plans/frontend-simplification-plan.md): Guided actions, default-first installs, page ownership, auto-refresh, safety checkpoints, and basic/advanced presentation.
- [Backup page refactor plan](./plans/backup-page-refactor-plan.md): Routine and manual backup UX and restore timeline planning.
- [Implemented page cleanup stories](./plans/implemented-page-cleanup-stories.md): Story backlog for temporary or limited behavior in implemented pages.
- [Appliance hardening next stories](./plans/appliance-hardening-next-stories.md): Six follow-up stories for CLI onboarding, release installers, network map v2, restore simulation, update management, and safe automation activation.

## Design References

- [Marketplace mockup](./initialDevelopment/Marketplace.png)
- [Applications page reference](./applicationsPageWorking/ApplicationsPage.png)
- [Network page reference](./networkPageWorking/networkPage.png)
- [Network page v2 reference](./networkPageWorking/NetworkPageV2.png)

## Documentation Conventions

- Keep architecture documents focused on stable boundaries and tradeoffs.
- Put implementation sequencing in dedicated plan or story documents under `docs/plans`.
- Keep user-facing behavior separate from low-level technical notes when possible.
- Update [installation-flow-and-hardening.md](./installation-flow-and-hardening.md) when a planned reliability feature becomes implemented behavior.
- Update [pi-beta-install-and-next-development.md](./pi-beta-install-and-next-development.md) after real-device install tests.
