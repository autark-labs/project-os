package com.projectos.host;

import java.util.List;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/external-services")
public class ExternalServiceController {

    private final ExternalServiceService service;

    public ExternalServiceController(ExternalServiceService service) {
        this.service = service;
    }

    @GetMapping
    public List<ExternalService> list() {
        return service.list();
    }

    @PostMapping
    public ExternalService add(@RequestBody ExternalServiceRequest request) {
        return service.add(request);
    }

    @DeleteMapping("/{id}")
    public ActionResult remove(@PathVariable String id) {
        return service.remove(id);
    }
}
