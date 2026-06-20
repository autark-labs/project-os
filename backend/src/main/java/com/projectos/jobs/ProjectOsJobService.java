package com.projectos.jobs;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executor;
import java.util.function.Supplier;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class ProjectOsJobService {

    private final ProjectOsJobRepository repository;
    private final Executor executor;
    private final boolean autoRun;
    private final ConcurrentHashMap<String, Runnable> queuedTasks = new ConcurrentHashMap<>();

    @Autowired
    public ProjectOsJobService(ProjectOsJobRepository repository) {
        this(repository, command -> Thread.ofVirtual().name("project-os-job-", 0).start(command), true);
    }

    public ProjectOsJobService(ProjectOsJobRepository repository, Executor executor, boolean autoRun) {
        this.repository = repository;
        this.executor = executor;
        this.autoRun = autoRun;
    }

    public ProjectOsJob start(String type, String subjectId, List<ProjectOsJobStep> steps, Supplier<ProjectOsJobOutcome> operation) {
        Optional<ProjectOsJob> active = repository.activeFor(type, subjectId);
        if (active.isPresent()) {
            return active.get();
        }
        ProjectOsJob job = repository.create(type, subjectId, steps);
        Runnable task = () -> run(job, operation);
        queuedTasks.put(job.jobId(), task);
        if (autoRun) {
            executor.execute(() -> {
                Runnable queued = queuedTasks.remove(job.jobId());
                if (queued != null) {
                    queued.run();
                }
            });
        }
        return job;
    }

    public List<ProjectOsJob> list() {
        return repository.list(100);
    }

    public Optional<ProjectOsJob> findById(String jobId) {
        return repository.findById(jobId);
    }

    public Optional<ProjectOsJob> cancel(String jobId) {
        queuedTasks.remove(jobId);
        return repository.findById(jobId).map(job -> {
            if ("succeeded".equals(job.status()) || "failed".equals(job.status()) || "cancelled".equals(job.status())) {
                return job;
            }
            return repository.cancel(jobId);
        });
    }

    public void runQueuedJobsNow() {
        List<Runnable> tasks = new ArrayList<>(queuedTasks.values());
        queuedTasks.clear();
        tasks.forEach(Runnable::run);
    }

    private void run(ProjectOsJob job, Supplier<ProjectOsJobOutcome> operation) {
        try {
            String firstStepId = job.steps().isEmpty() ? "" : job.steps().getFirst().id();
            repository.markRunning(job.jobId(), firstStepId);
            ProjectOsJobOutcome outcome = operation.get();
            if ("failed".equals(outcome.status())) {
                repository.fail(job.jobId(), "job_failed", outcome.message(), java.util.Map.of());
            } else {
                repository.succeed(job.jobId(), outcome.message(), outcome.steps());
            }
        } catch (RuntimeException exception) {
            repository.fail(job.jobId(), "job_failed", safeMessage(exception), java.util.Map.of("exception", exception.getClass().getSimpleName()));
        }
    }

    private String safeMessage(RuntimeException exception) {
        return exception.getMessage() == null || exception.getMessage().isBlank()
                ? "Project OS could not finish this job."
                : exception.getMessage();
    }
}
