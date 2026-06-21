package com.projectos.host;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/observed-services")
public class ObservedServiceController {

    private final ObservedServiceService service;

    public ObservedServiceController(ObservedServiceService service) {
        this.service = service;
    }

    @GetMapping
    public List<ObservedServiceView> list() {
        return service.refresh();
    }

    @PostMapping("/refresh")
    public List<ObservedServiceView> refresh() {
        return service.refresh();
    }

    @GetMapping("/{id}")
    public ObservedServiceView get(@PathVariable String id) {
        return service.get(id);
    }

    @PostMapping("/{id}/pin")
    public ActionResult pin(@PathVariable String id) {
        return service.pin(id);
    }

    @PostMapping("/{id}/unpin")
    public ActionResult unpin(@PathVariable String id) {
        return service.unpin(id);
    }

    @PostMapping("/{id}/match")
    public ActionResult match(@PathVariable String id, @RequestBody ObservedServiceMatchRequest request) {
        return service.updateCatalogMatch(id, request == null ? null : request.catalogAppId());
    }

    @PostMapping("/{id}/adoption-plan")
    public ObservedServiceAdoptionPlan adoptionPlan(@PathVariable String id) {
        return service.adoptionPlan(id);
    }

    @PostMapping("/{id}/adopt")
    public ActionResult adopt(@PathVariable String id, @RequestBody ObservedServiceAdoptionRequest request) {
        return service.adopt(id, request);
    }
}
