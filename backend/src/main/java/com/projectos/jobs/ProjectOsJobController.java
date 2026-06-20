package com.projectos.jobs;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/jobs")
public class ProjectOsJobController {

    private final ProjectOsJobService jobService;

    public ProjectOsJobController(ProjectOsJobService jobService) {
        this.jobService = jobService;
    }

    @GetMapping
    public List<ProjectOsJob> jobs() {
        return jobService.list();
    }

    @GetMapping("/{jobId}")
    public ResponseEntity<ProjectOsJob> job(@PathVariable String jobId) {
        return jobService.findById(jobId)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping("/{jobId}/cancel")
    public ResponseEntity<ProjectOsJob> cancel(@PathVariable String jobId) {
        return jobService.cancel(jobId)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }
}
