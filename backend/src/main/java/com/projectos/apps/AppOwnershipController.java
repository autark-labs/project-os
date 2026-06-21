package com.projectos.apps;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/app-ownership")
public class AppOwnershipController {

    private final AppOwnershipProvider provider;

    public AppOwnershipController(AppOwnershipProvider provider) {
        this.provider = provider;
    }

    @GetMapping
    public List<AppOwnershipView> apps() {
        return provider.apps();
    }
}
