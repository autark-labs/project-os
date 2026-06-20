package com.projectos.backups;

import com.projectos.backups.api.RestoreRequest;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.projectos.jobs.ProjectOsJob;
import com.projectos.jobs.ProjectOsJobOutcome;
import com.projectos.jobs.ProjectOsJobService;
import com.projectos.jobs.ProjectOsJobStep;

@RestController
@RequestMapping("/api/backups")
public class BackupController {

    private final BackupService backupService;
    private final ProjectOsJobService jobService;

    public BackupController(BackupService backupService, ProjectOsJobService jobService) {
        this.backupService = backupService;
        this.jobService = jobService;
    }

    @GetMapping
    public BackupReport report() {
        return backupService.report();
    }

    @PostMapping("/apps/{appId}/run")
    public ProjectOsJob run(@PathVariable String appId) {
        return jobService.start("backup", appId, backupSteps(), () -> backupOutcome(backupService.run(appId)));
    }

    @PostMapping("/full/run")
    public ProjectOsJob runFull() {
        return jobService.start("backup", "__full__", backupSteps(), () -> backupOutcome(backupService.runFullBackup("manual")));
    }

    @PostMapping("/routine/run")
    public ProjectOsJob runRoutine() {
        return jobService.start("backup", "__routine__", backupSteps(), () -> backupOutcome(backupService.runAutomatic()));
    }

    @GetMapping("/restore-points/{id}/plan")
    public RestorePlan restorePlan(@PathVariable long id, @RequestParam(required = false) String appId) {
        return backupService.restorePlan(id, appId);
    }

    @PostMapping("/restore-points/{id}/verify")
    public BackupVerificationResult verify(@PathVariable long id) {
        return backupService.verify(id);
    }

    @PostMapping("/restore-points/{id}/restore")
    public RestoreResult restore(@PathVariable long id, @RequestBody(required = false) RestoreRequest request) {
        return backupService.restore(id, request == null ? null : request.appId());
    }

    private java.util.List<ProjectOsJobStep> backupSteps() {
        return java.util.List.of(
                ProjectOsJobStep.pending("prepare_backup", "Preparing restore point"),
                ProjectOsJobStep.pending("copy_data", "Copying app data"),
                ProjectOsJobStep.pending("verify_backup", "Verifying restore point"),
                ProjectOsJobStep.pending("finish", "Finishing backup"));
    }

    private ProjectOsJobOutcome backupOutcome(BackupRunResult result) {
        if ("failed".equals(result.status())) {
            java.util.List<ProjectOsJobStep> steps = java.util.List.of(
                    ProjectOsJobStep.succeeded("prepare_backup", "Preparing restore point", "Backup destination checked."),
                    ProjectOsJobStep.failed("copy_data", "Copying app data", result.message()),
                    ProjectOsJobStep.pending("verify_backup", "Verifying restore point"),
                    ProjectOsJobStep.pending("finish", "Finishing backup"));
            return ProjectOsJobOutcome.failed(result.message(), steps);
        }
        java.util.List<ProjectOsJobStep> steps = java.util.List.of(
                ProjectOsJobStep.succeeded("prepare_backup", "Preparing restore point", "Backup destination checked."),
                ProjectOsJobStep.succeeded("copy_data", "Copying app data", result.message()),
                ProjectOsJobStep.succeeded("verify_backup", "Verifying restore point", result.restorePoint() == null ? "" : result.restorePoint().verificationMessage()),
                ProjectOsJobStep.succeeded("finish", "Finishing backup", result.message()));
        return ProjectOsJobOutcome.succeeded(result.message(), steps);
    }
}
