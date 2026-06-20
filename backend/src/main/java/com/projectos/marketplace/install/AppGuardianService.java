package com.projectos.marketplace.install;

import java.time.Duration;
import java.time.Instant;
import java.util.concurrent.atomic.AtomicBoolean;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import com.projectos.activity.ActivityLogService;
import com.projectos.automation.AutomationService;

@Service
public class AppGuardianService {

    private static final Duration REPAIR_RATE_LIMIT = Duration.ofMinutes(5);

    private final InstalledAppRepository repository;
    private final AppLifecycleService appLifecycleService;
    private final boolean enabled;
    private final ActivityLogService activityLogService;
    private final AutomationService automationService;
    private final AtomicBoolean running = new AtomicBoolean(false);

    @Autowired
    public AppGuardianService(InstalledAppRepository repository, AppLifecycleService appLifecycleService, @Value("${project-os.guardian.enabled:true}") boolean enabled, ActivityLogService activityLogService, AutomationService automationService) {
        this.repository = repository;
        this.appLifecycleService = appLifecycleService;
        this.enabled = enabled;
        this.activityLogService = activityLogService;
        this.automationService = automationService;
    }

    public AppGuardianService(InstalledAppRepository repository, AppLifecycleService appLifecycleService, @Value("${project-os.guardian.enabled:true}") boolean enabled) {
        this(repository, appLifecycleService, enabled, null, null);
    }

    @Scheduled(
            initialDelayString = "${project-os.guardian.initial-delay-ms:10000}",
            fixedDelayString = "${project-os.guardian.interval-ms:15000}")
    public void inspectAndRepair() {
        if (!enabled || !running.compareAndSet(false, true)) {
            return;
        }
        try {
            for (InstalledApp app : repository.findAll()) {
                inspectApp(app);
            }
        } finally {
            running.set(false);
        }
    }

    public void inspectApp(InstalledApp app) {
        if (automationService != null && !automationService.recipeEnabled(AutomationService.RESTART_UNHEALTHY_APP)) {
            return;
        }
        InstallSettings settings = repository.settingsFor(app.appId()).orElseGet(() -> InstallSettings.defaults(app.accessUrl()));
        if (!settings.autoRepairEnabled()) {
            return;
        }

        AppHealthSnapshot snapshot = appLifecycleService.healthSnapshot(app.appId());
        if (!shouldRepair(snapshot)) {
            return;
        }
        if (recentlyAttempted(settings)) {
            return;
        }

        repository.recordEvent(app.appId(), "guardian_issue_detected", "Project OS noticed " + app.appName() + " needs attention: " + snapshot.message() + ".");
        if (activityLogService != null) {
            activityLogService.warning("stability", "guardian_issue_detected", app.appName() + " needs attention", snapshot.message(), app.appId());
        }
        Instant attemptAt = Instant.now();
        saveGuardianState(app, settings, "guardian_repair_queued", attemptAt);
        try {
            appLifecycleService.repair(app.appId(), true);
        } catch (RuntimeException exception) {
            saveGuardianState(app, settings, blockedByOwnership(exception) ? "guardian_repair_blocked" : "guardian_repair_failed", attemptAt);
            if (!hasRecentGuardianFailure(app.appId())) {
                repository.recordEvent(app.appId(), "guardian_repair_failed", "Project OS could not repair " + app.appName() + ". Reason: " + failureReason(exception));
                if (activityLogService != null) {
                    activityLogService.error("stability", "guardian_repair_failed", "Automatic repair failed for " + app.appName(), failureReason(exception), app.appId(), exception);
                }
            }
        }
    }

    private boolean shouldRepair(AppHealthSnapshot snapshot) {
        return !snapshot.startupGrace() && ("Needs attention".equals(snapshot.status()) || "Unavailable".equals(snapshot.status()));
    }

    private boolean recentlyAttempted(InstallSettings settings) {
        return settings.lastRepairAttemptAt() != null && settings.lastRepairAttemptAt().plus(REPAIR_RATE_LIMIT).isAfter(Instant.now());
    }

    private void saveGuardianState(InstalledApp app, InstallSettings settings, String status, Instant attemptAt) {
        repository.saveSettings(app.appId(), new InstallSettings(
                settings.accessUrl(),
                settings.privateAccessUrl(),
                settings.tailscaleEnabled(),
                settings.storageSubfolders(),
                settings.backup(),
                settings.desiredAccessMode(),
                settings.privateAccessRequirement(),
                settings.expectedLocalPort(),
                settings.expectedProtocol(),
                settings.lastAccessCheckAt(),
                settings.lastSuccessfulAccessAt(),
                attemptAt,
                status,
                settings.autoRepairEnabled()));
    }

    private boolean blockedByOwnership(RuntimeException exception) {
        String message = exception.getMessage();
        return message != null && message.contains("not owned by this Project OS instance");
    }

    private String failureReason(RuntimeException exception) {
        String message = exception.getMessage();
        return message == null || message.isBlank() ? "No failure reason was returned." : message;
    }

    private boolean hasRecentGuardianFailure(String appId) {
        Instant cutoff = Instant.now().minusSeconds(10);
        return repository.eventsFor(appId, 5).stream()
                .anyMatch(event -> "guardian_repair_failed".equals(event.type()) && event.createdAt().isAfter(cutoff));
    }
}
