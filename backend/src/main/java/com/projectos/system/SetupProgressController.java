package com.projectos.system;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/setup")
public class SetupProgressController {

    private final SetupProgressService service;

    public SetupProgressController(SetupProgressService service) {
        this.service = service;
    }

    @GetMapping("/progress")
    public SetupProgress progress() {
        return service.status();
    }

    @PostMapping("/progress/complete")
    public SetupProgress complete(@RequestBody SetupProgressUpdateRequest request) {
        return service.completeStep(request.step());
    }

    @PostMapping("/progress/skip")
    public SetupProgress skip(@RequestBody SetupProgressUpdateRequest request) {
        return service.skipStep(request.step());
    }
}
