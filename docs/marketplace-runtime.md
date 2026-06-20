# Project-OS Marketplace & Runtime Architecture

## Vision

Project-OS is not a Docker Compose launcher.

Project-OS is a homelab operating system that allows non-technical users to discover, install, operate, update, and monitor self-hosted applications with minimal technical knowledge.

The Marketplace serves as the user-facing application catalog.

The Runtime Agent serves as the local execution engine responsible for safely translating application definitions into running services.

The user should never need to understand:

* Docker
* Docker Compose
* Reverse Proxies
* TLS Certificates
* Container Networking
* Storage Mounts
* Linux Service Management

The system should provide safe defaults while exposing advanced controls for power users.

---

# Architectural Overview

```text
┌─────────────────────┐
│ React Frontend      │
└──────────┬──────────┘
           │ REST API
           ▼
┌─────────────────────┐
│ Project-OS Agent    │
│ Local Runtime       │
└──────────┬──────────┘
           │
           ├──────── Catalog
           ├──────── Docker
           ├──────── Filesystem
           ├──────── Tailscale
           └──────── SQLite
```

The frontend never interacts with Docker directly.

All actions pass through the Project-OS Agent.

---

# Core Components

## Marketplace

Responsible for:

* Discovering applications
* Searching applications
* Filtering applications
* Viewing application details
* Viewing installation plans
* Installing applications

The Marketplace should only consume application manifests.

It should never parse Docker Compose directly.

---

## Project-OS Agent

The agent is NOT an AI system.

The agent is a lightweight local service responsible for:

* Catalog loading
* Manifest validation
* Install planning
* Runtime execution
* Health monitoring
* Backup orchestration
* Application lifecycle management

The agent should remain lightweight enough to run comfortably on:

* Raspberry Pi 5
* Intel N100 mini PCs
* Small ARM devices

Target Resource Usage:

* Idle CPU: ~0%
* Memory: <100MB
* SQLite for persistence
* No Kubernetes
* No embedded AI requirement

---

# Catalog Structure

Initially the catalog is hosted locally.

```text
catalog/
└── apps/
    ├── syncthing/
    │   ├── manifest.yaml
    │   ├── compose.yaml
    │   ├── icon.svg
    │   └── README.md
    │
    ├── vaultwarden/
    │   ├── manifest.yaml
    │   ├── compose.yaml
    │   ├── icon.svg
    │   └── README.md
```

Future versions may allow remote catalogs.

The catalog is the source of truth for all marketplace content.

---

# Application Package Model

Every application is represented by:

```text
Application Package
├── Manifest
├── Compose Template
├── Assets
└── Documentation
```

The manifest describes:

* What the application is
* What resources it requires
* What capabilities it exposes
* How Project-OS should manage it

The compose file describes:

* How to run the application

The compose file is considered an implementation detail.

The manifest is considered the authoritative contract.

---

# Manifest Responsibilities

The manifest powers:

* Marketplace cards
* Marketplace detail pages
* Install planning
* Health checks
* Security warnings
* Backup configuration
* Update policy
* Tailscale integration
* Application metadata

Example categories:

```yaml
identity:
compatibility:
storage:
network:
health:
backup:
security:
metadata:
```

---

# Runtime Directory Layout

All managed applications must exist under a controlled runtime root.

```text
/var/lib/project-os/
│
├── apps/
│   ├── syncthing/
│   │   ├── manifest.yaml
│   │   ├── compose.yaml
│   │   ├── config/
│   │   ├── data/
│   │   └── state.json
│   │
│   └── vaultwarden/
│
├── catalog/
├── backups/
├── logs/
└── project-os.db
```

Applications may not write arbitrary host paths.

The agent owns filesystem placement.

---

# Installation Flow

```text
User clicks Install
        │
        ▼
Load Manifest
        │
        ▼
Validate Manifest
        │
        ▼
Generate Install Plan
        │
        ▼
User Approves
        │
        ▼
Create Runtime Directories
        │
        ▼
Render Compose
        │
        ▼
Execute Docker Compose
        │
        ▼
Run Health Checks
        │
        ▼
Register Installed App
```

---

# Install Plan System

Every installation must generate a plan before execution.

Example:

```text
Install Syncthing

Will Create:
- config directory
- data directory

Will Run:
- syncthing/syncthing:1.29.6

Will Expose:
- 8384
- 22000/tcp
- 22000/udp

Will Configure:
- Tailscale Access

Will Back Up:
- config
- data
```

The install plan is a first-class product feature.

Users should always understand what an application will do before installation.

---

# Compose Rendering

For MVP:

```text
manifest.yaml
compose.yaml
```

may be copied into runtime directories.

Future architecture:

```text
manifest.yaml
compose.template.yaml
user answers
```

becomes:

```text
generated compose.yaml
```

This allows Project-OS to control:

* Storage paths
* Ports
* Labels
* Networking
* Secrets

without modifying upstream templates.

---

# Docker Labels

All managed services should receive labels.

Example:

```yaml
labels:
  project-os.managed: "true"
  project-os.app-id: "syncthing"
  project-os.version: "1.0.0"
```

Labels allow the agent to rediscover services after reboot.

Labels also provide future support for:

* Updates
* Monitoring
* Backups
* Diagnostics

---

# Persistence Layer

Use SQLite initially.

Tables:

```text
installed_apps
app_events
app_health
app_backups
settings
```

SQLite is sufficient for:

* Single-node deployments
* Raspberry Pi installations
* Home servers

---

# API Surface

Marketplace:

```http
GET  /api/marketplace/apps
GET  /api/marketplace/apps/{id}
POST /api/marketplace/apps/{id}/plan
POST /api/marketplace/apps/{id}/install
```

Installed Applications:

```http
GET  /api/apps
GET  /api/apps/{id}

POST /api/apps/{id}/start
POST /api/apps/{id}/stop
POST /api/apps/{id}/restart

DELETE /api/apps/{id}
```

System:

```http
GET /api/system/status
GET /api/system/resources
GET /api/system/events
```

---

# Security Model

The agent must reject:

* Arbitrary host filesystem mounts
* Privileged containers by default
* Unknown storage locations
* Dangerous capabilities
* Unvalidated manifests

Applications should only be allowed access to resources explicitly declared in their manifest.

---

# Future Roadmap

For the next detailed stability phase, see [Access Reliability And Self-Healing Plan](./plans/access-reliability-self-healing-plan.md).

Phase 1

* Local catalog
* Manifest loading
* Marketplace UI
* Install plans
* Docker Compose execution

Phase 2

* Health monitoring
* Backup management
* Update management
* Tailscale integration

Phase 3

* Remote catalog synchronization
* Signed manifests
* Community catalog support

Phase 4

* AI Copilot integration
* Automated diagnostics
* Infrastructure recommendations

---

# Design Principle

The Marketplace should never be responsible for running software.

The Agent should never be responsible for presenting software.

The Manifest should be the contract between them.

Marketplace → Manifest → Agent → Runtime

This separation allows Project-OS to remain maintainable, secure, and scalable as the catalog grows from a handful of applications to hundreds of supported services.
