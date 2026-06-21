package com.projectos.apps;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/app-ownership")
public class AppOwnershipController {

    private final AppOwnershipProvider provider;
    private final ApplicationStateService applicationStateService;

    public AppOwnershipController(AppOwnershipProvider provider) {
        this(provider, null);
    }

    @Autowired
    public AppOwnershipController(AppOwnershipProvider provider, ApplicationStateService applicationStateService) {
        this.provider = provider;
        this.applicationStateService = applicationStateService;
    }

    @GetMapping
    public List<AppOwnershipView> apps() {
        if (applicationStateService != null) {
            return applicationStateService.snapshot().ownershipViews();
        }
        return provider.apps();
    }
}
