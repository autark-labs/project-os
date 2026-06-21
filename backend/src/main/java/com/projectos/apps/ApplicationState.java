package com.projectos.apps;

import java.time.Instant;
import java.util.List;

import com.projectos.host.ObservedServiceView;
import com.projectos.marketplace.install.AppInstanceView;
import com.projectos.marketplace.install.AppRuntimeView;

public record ApplicationState(
        List<AppInstanceView> managedApps,
        List<AppRuntimeView> runtimeApps,
        List<ObservedServiceView> observedServices,
        List<ObservedServiceView> pinnedExternalServices,
        List<ObservedServiceView> foundServices,
        List<AppOwnershipView> ownershipViews,
        Instant updatedAt) {
}
