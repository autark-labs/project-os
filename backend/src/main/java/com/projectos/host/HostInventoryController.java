package com.projectos.host;

import java.util.List;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/host/inventory")
public class HostInventoryController {

    private final HostInventoryService service;
    private final HostResourceActionService actionService;

    public HostInventoryController(HostInventoryService service, HostResourceActionService actionService) {
        this.service = service;
        this.actionService = actionService;
    }

    @GetMapping
    public List<HostInventoryResource> inventory(@RequestParam(defaultValue = "false") boolean includeIgnored) {
        return service.inventory(includeIgnored);
    }

    @GetMapping("/{resourceId}")
    public HostInventoryResource resource(@PathVariable String resourceId) {
        return service.findById(resourceId)
                .orElseThrow(() -> new IllegalArgumentException("Unknown host resource: " + resourceId));
    }

    @PostMapping("/{resourceId}/ignore")
    public ActionResult ignore(@PathVariable String resourceId) {
        return service.ignore(resourceId);
    }

    @DeleteMapping("/{resourceId}/ignore")
    public ActionResult unignore(@PathVariable String resourceId) {
        return service.unignore(resourceId);
    }

    @PostMapping("/{resourceId}/cleanup-plan")
    public HostResourceCleanupPlan cleanupPlan(@PathVariable String resourceId) {
        return actionService.cleanupPlan(resourceId);
    }

    @PostMapping("/{resourceId}/cleanup")
    public ActionResult cleanup(@PathVariable String resourceId, @RequestBody HostResourceCleanupRequest request) {
        return actionService.cleanup(resourceId, request);
    }

    @PostMapping("/{resourceId}/data-deletion-plan")
    public HostResourceDataDeletionPlan dataDeletionPlan(@PathVariable String resourceId) {
        return actionService.dataDeletionPlan(resourceId);
    }

    @PostMapping("/{resourceId}/delete-data")
    public ActionResult deleteData(@PathVariable String resourceId, @RequestBody HostResourceDataDeletionRequest request) {
        return actionService.deleteData(resourceId, request);
    }

    @PostMapping("/{resourceId}/recovery-plan")
    public HostResourceRecoveryPlan recoveryPlan(@PathVariable String resourceId) {
        return actionService.recoveryPlan(resourceId);
    }

    @PostMapping("/{resourceId}/recover")
    public ActionResult recover(@PathVariable String resourceId, @RequestBody HostResourceRecoveryRequest request) {
        return actionService.recover(resourceId, request);
    }
}
