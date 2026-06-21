package com.projectos.host;

import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

import org.springframework.stereotype.Service;

@Service
public class ExternalServiceService {

    private final ExternalServiceRepository repository;

    public ExternalServiceService(ExternalServiceRepository repository) {
        this.repository = repository;
    }

    public List<ExternalService> list() {
        return repository.findAll();
    }

    public ExternalService add(ExternalServiceRequest request) {
        String name = clean(request == null ? "" : request.name());
        String url = clean(request == null ? "" : request.url());
        if (name.isBlank()) {
            throw new IllegalArgumentException("Linked service name is required.");
        }
        if (!validUrl(url)) {
            throw new IllegalArgumentException("Linked service URL must start with http:// or https://.");
        }
        ExternalService service = new ExternalService(
                "ext_" + UUID.randomUUID().toString().replace("-", ""),
                name,
                url,
                cleanOrDefault(request.category(), "External"),
                cleanOrDefault(request.accessScope(), "LAN"),
                request.healthCheckEnabled(),
                "linked",
                cleanToNull(request.catalogAppId()),
                Instant.now());
        repository.save(service);
        return service;
    }

    public ActionResult remove(String id) {
        boolean deleted = repository.delete(id);
        if (!deleted) {
            return new ActionResult(false, "warning", "Linked service not found", "No linked service matched that id.", id, "refresh_linked_services");
        }
        return new ActionResult(true, "success", "Linked service removed", "The external service link was removed. No runtime resources were changed.", id, "refresh_linked_services");
    }

    private boolean validUrl(String url) {
        String normalized = url.toLowerCase(Locale.ROOT);
        return normalized.startsWith("http://") || normalized.startsWith("https://");
    }

    private String cleanOrDefault(String value, String fallback) {
        String cleaned = clean(value);
        return cleaned.isBlank() ? fallback : cleaned;
    }

    private String clean(String value) {
        return value == null ? "" : value.trim();
    }

    private String cleanToNull(String value) {
        String cleaned = clean(value);
        return cleaned.isBlank() ? null : cleaned;
    }
}
