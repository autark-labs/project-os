package com.projectos.host;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;

import com.projectos.activity.ActivityLogService;
import com.projectos.marketplace.catalog.MarketplaceCatalogService;
import com.projectos.marketplace.install.InstalledApp;
import com.projectos.marketplace.install.InstalledAppOwnershipMetadata;
import com.projectos.marketplace.install.InstalledAppRepository;
import com.projectos.marketplace.model.ApplicationManifest;

@Service
public class HostResourceActionService {

    private final HostInventoryService inventoryService;
    private final InstalledAppRepository installedRepository;
    private final HostInventoryIgnoreRepository ignoreRepository;
    private final MarketplaceCatalogService catalogService;
    private final ActivityLogService activityLogService;
    private final HostCommandRunner commandRunner;

    public HostResourceActionService(
            HostInventoryService inventoryService,
            InstalledAppRepository installedRepository,
            HostInventoryIgnoreRepository ignoreRepository,
            MarketplaceCatalogService catalogService,
            ActivityLogService activityLogService,
            HostCommandRunner commandRunner) {
        this.inventoryService = inventoryService;
        this.installedRepository = installedRepository;
        this.ignoreRepository = ignoreRepository;
        this.catalogService = catalogService;
        this.activityLogService = activityLogService;
        this.commandRunner = commandRunner;
    }

    public HostResourceCleanupPlan cleanupPlan(String resourceId) {
        HostInventoryResource resource = resource(resourceId);
        if (!"foreign_project_os".equals(resource.ownershipState())) {
            return new HostResourceCleanupPlan(
                    resource.id(),
                    resourceDisplayName(resource),
                    List.of(),
                    List.of(),
                    List.of(),
                    List.of(),
                    List.of("Docker containers not owned by another Project OS installation"),
                    "",
                    "Cleanup is only available for Project OS containers managed by another installation.");
        }
        String containerName = detail(resource, "containerName");
        return new HostResourceCleanupPlan(
                resource.id(),
                resourceDisplayName(resource),
                List.of(containerName),
                List.of(containerName),
                freePorts(resource),
                List.of("Docker volumes and app data directories are preserved."),
                List.of("Backups", "Unknown host files"),
                "REMOVE " + resourceDisplayName(resource).toUpperCase() + " CONTAINER",
                "This removes the old Docker container only. It does not delete app data.");
    }

    public ActionResult cleanup(String resourceId, HostResourceCleanupRequest request) {
        HostResourceCleanupPlan plan = cleanupPlan(resourceId);
        if (!confirmed(plan.confirmationText(), request == null ? "" : request.confirmationText())) {
            return result(false, "warning", "Confirmation required", "Type the confirmation text exactly before removing this container.", resourceId, "confirm_cleanup");
        }
        for (String container : plan.stopContainers()) {
            HostCommandResult stop = commandRunner.run(List.of("docker", "stop", container));
            if (!stop.ok()) {
                activityLogService.warning("host", "cleanup_container", "Unable to stop found container", stop.output(), appId(resourceId));
                return result(false, "error", "Unable to stop container", stop.output(), resourceId, "review_cleanup_plan");
            }
        }
        for (String container : plan.removeContainers()) {
            HostCommandResult remove = commandRunner.run(List.of("docker", "rm", container));
            if (!remove.ok()) {
                activityLogService.warning("host", "cleanup_container", "Unable to remove found container", remove.output(), appId(resourceId));
                return result(false, "error", "Unable to remove container", remove.output(), resourceId, "review_cleanup_plan");
            }
        }
        activityLogService.success("host", "cleanup_container", "Found app container removed", "Removed container for " + plan.displayName() + " without deleting data.", appId(resourceId));
        return result(true, "success", "Container removed", "The old container was removed. App data was preserved.", resourceId, "refresh_found_apps");
    }

    public HostResourceDataDeletionPlan dataDeletionPlan(String resourceId) {
        HostInventoryResource resource = resource(resourceId);
        List<String> paths = dataPaths(resource);
        List<String> blockedReasons = paths.stream()
                .filter(path -> !safeDeletablePath(path))
                .map(path -> "Path is not safe for guided deletion: " + path)
                .toList();
        if (paths.isEmpty()) {
            blockedReasons = List.of("Project OS does not know which data paths belong to this resource.");
        }
        return new HostResourceDataDeletionPlan(
                resource.id(),
                resourceDisplayName(resource),
                paths,
                blockedReasons,
                "DELETE " + resourceDisplayName(resource).toUpperCase() + " DATA",
                "This permanently deletes the listed data paths. This is separate from container cleanup.");
    }

    public ActionResult deleteData(String resourceId, HostResourceDataDeletionRequest request) {
        HostResourceDataDeletionPlan plan = dataDeletionPlan(resourceId);
        if (!plan.blockedReasons().isEmpty()) {
            return result(false, "warning", "Data deletion blocked", String.join(" ", plan.blockedReasons()), resourceId, "review_data_paths");
        }
        if (!confirmed(plan.confirmationText(), request == null ? "" : request.confirmationText())) {
            return result(false, "warning", "Confirmation required", "Type the confirmation text exactly before deleting data.", resourceId, "confirm_data_deletion");
        }
        try {
            for (String path : plan.paths()) {
                deleteRecursively(Path.of(path));
            }
            activityLogService.warning("host", "delete_found_data", "Found app data deleted", "Deleted data paths for " + plan.displayName() + ".", appId(resourceId));
            return result(true, "success", "Data deleted", "The selected data paths were deleted.", resourceId, "refresh_found_apps");
        } catch (IOException exception) {
            activityLogService.error("host", "delete_found_data", "Unable to delete found app data", exception.getMessage(), appId(resourceId), exception);
            return result(false, "error", "Unable to delete data", exception.getMessage(), resourceId, "review_data_paths");
        }
    }

    public HostResourceRecoveryPlan recoveryPlan(String resourceId) {
        HostInventoryResource resource = resource(resourceId);
        String displayName = catalogName(resource).orElse(resourceDisplayName(resource));
        List<String> blockedReasons = new ArrayList<>();
        if (!"legacy_project_os".equals(resource.ownershipState())) {
            blockedReasons.add("Only legacy Project OS resources can be recovered into this installation.");
        }
        if (resource.catalogAppId() == null || resource.catalogAppId().isBlank()) {
            blockedReasons.add("This resource does not identify a catalog app.");
        }
        if (!blockedReasons.isEmpty()) {
            return new HostResourceRecoveryPlan(resource.id(), displayName, false, List.of(), blockedReasons, "");
        }
        return new HostResourceRecoveryPlan(
                resource.id(),
                displayName,
                true,
                List.of(
                        "Add " + displayName + " to this Project OS installation without deleting data.",
                        "Keep the existing Docker container and runtime files in place.",
                        "Hide this found app prompt after recovery."),
                List.of(),
                "RECOVER " + displayName.toUpperCase());
    }

    public ActionResult recover(String resourceId, HostResourceRecoveryRequest request) {
        HostResourceRecoveryPlan plan = recoveryPlan(resourceId);
        if (!plan.recoverable()) {
            return result(false, "warning", "Recovery unavailable", String.join(" ", plan.blockedReasons()), resourceId, "review_found_apps");
        }
        if (!confirmed(plan.confirmationText(), request == null ? "" : request.confirmationText())) {
            return result(false, "warning", "Confirmation required", "Type the confirmation text exactly before recovering this app.", resourceId, "confirm_recovery");
        }
        HostInventoryResource resource = resource(resourceId);
        Instant now = Instant.now();
        String appId = resource.catalogAppId();
        String runtimePath = dataPaths(resource).stream().findFirst().orElse("");
        installedRepository.save(new InstalledApp(
                appId,
                plan.displayName(),
                "Ready",
                runtimePath,
                detail(resource, "composeProject"),
                resource.accessUrls().stream().findFirst().orElse(""),
                now));
        installedRepository.saveOwnershipMetadata(new InstalledAppOwnershipMetadata(
                appId,
                blankToDefault(detail(resource, "appInstanceId"), "appinst_" + appId),
                appId,
                resource.currentInstanceId(),
                detail(resource, "composeProject"),
                "recovered",
                "owned",
                now,
                now));
        ignoreRepository.ignore(resourceId);
        activityLogService.success("host", "recover_found_app", "Found app recovered", "Recovered " + plan.displayName() + " into this Project OS installation.", appId);
        return result(true, "success", "App recovered", plan.displayName() + " now appears in Project OS.", resourceId, "open_apps");
    }

    private HostInventoryResource resource(String resourceId) {
        return inventoryService.findById(resourceId)
                .orElseThrow(() -> new IllegalArgumentException("Unknown host resource: " + resourceId));
    }

    private String resourceDisplayName(HostInventoryResource resource) {
        String displayName = resource.displayName() == null || resource.displayName().isBlank() ? detail(resource, "containerName") : resource.displayName();
        return titleCase(displayName);
    }

    private Optional<String> catalogName(HostInventoryResource resource) {
        if (resource.catalogAppId() == null || resource.catalogAppId().isBlank()) {
            return Optional.empty();
        }
        return catalogService.findById(resource.catalogAppId()).map(ApplicationManifest::name);
    }

    private List<String> dataPaths(HostInventoryResource resource) {
        String encoded = detail(resource, "dataPaths");
        if (encoded.isBlank()) {
            return List.of();
        }
        return java.util.Arrays.stream(encoded.split("[,|]"))
                .map(String::trim)
                .filter(value -> !value.isBlank())
                .distinct()
                .toList();
    }

    private List<String> freePorts(HostInventoryResource resource) {
        String ports = detail(resource, "ports");
        if (ports.isBlank()) {
            return List.of();
        }
        return java.util.Arrays.stream(ports.split(","))
                .map(String::trim)
                .filter(value -> !value.isBlank())
                .toList();
    }

    private boolean safeDeletablePath(String rawPath) {
        if (rawPath == null || rawPath.isBlank()) {
            return false;
        }
        Path path = Path.of(rawPath).normalize();
        if (!path.isAbsolute()) {
            return false;
        }
        int nameCount = path.getNameCount();
        return nameCount >= 2
                && !path.equals(Path.of("/"))
                && !path.startsWith("/bin")
                && !path.startsWith("/boot")
                && !path.startsWith("/dev")
                && !path.startsWith("/etc")
                && !path.startsWith("/lib")
                && !path.startsWith("/lib64")
                && !path.startsWith("/proc")
                && !path.startsWith("/run")
                && !path.startsWith("/sbin")
                && !path.startsWith("/sys")
                && !path.startsWith("/usr");
    }

    private void deleteRecursively(Path path) throws IOException {
        if (!Files.exists(path)) {
            return;
        }
        try (java.util.stream.Stream<Path> paths = Files.walk(path)) {
            for (Path candidate : paths.sorted(Comparator.reverseOrder()).toList()) {
                Files.deleteIfExists(candidate);
            }
        }
    }

    private String detail(HostInventoryResource resource, String key) {
        String value = resource.details().get(key);
        return value == null ? "" : value.trim();
    }

    private ActionResult result(boolean ok, String severity, String title, String message, String resourceId, String nextAction) {
        return new ActionResult(ok, severity, title, message == null ? "" : message, resourceId, nextAction);
    }

    private boolean confirmed(String expected, String actual) {
        return expected != null && !expected.isBlank() && expected.equals(actual == null ? "" : actual.trim());
    }

    private String appId(String resourceId) {
        return inventoryService.findById(resourceId).map(HostInventoryResource::catalogAppId).orElse(null);
    }

    private String blankToDefault(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value;
    }

    private String titleCase(String value) {
        if (value == null || value.isBlank()) {
            return "Resource";
        }
        String cleaned = value.replace('-', ' ').replace('_', ' ').trim();
        StringBuilder builder = new StringBuilder();
        for (String word : cleaned.split("\\s+")) {
            if (word.isBlank()) {
                continue;
            }
            if (!builder.isEmpty()) {
                builder.append(' ');
            }
            builder.append(Character.toUpperCase(word.charAt(0)));
            if (word.length() > 1) {
                builder.append(word.substring(1).toLowerCase());
            }
        }
        return builder.isEmpty() ? value : builder.toString();
    }
}
