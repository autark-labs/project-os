package com.projectos.apps;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.function.Supplier;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.projectos.host.ObservedService;
import com.projectos.host.ObservedServiceService;
import com.projectos.host.ObservedServiceView;
import com.projectos.marketplace.install.AppInstanceView;
import com.projectos.marketplace.install.AppInstanceViewProvider;
import com.projectos.marketplace.install.AppLifecycleService;
import com.projectos.marketplace.install.AppRuntimeView;

@Service
public class ApplicationStateService {

    private static final Duration SNAPSHOT_TTL = Duration.ofSeconds(3);

    private final Supplier<List<AppInstanceView>> managedApps;
    private final Supplier<List<AppRuntimeView>> runtimeApps;
    private final ObservedServiceService observedServiceService;
    private final AppOwnershipService appOwnershipService;
    private final Supplier<Instant> clock;
    private ApplicationState cached;
    private Instant cachedAt = Instant.EPOCH;

    @Autowired
    public ApplicationStateService(
            AppInstanceViewProvider appInstanceViewProvider,
            AppLifecycleService appLifecycleService,
            ObservedServiceService observedServiceService,
            AppOwnershipService appOwnershipService) {
        this(appInstanceViewProvider::list, appLifecycleService::listApps, observedServiceService, appOwnershipService, Instant::now);
    }

    public ApplicationStateService(
            Supplier<List<AppInstanceView>> managedApps,
            Supplier<List<AppRuntimeView>> runtimeApps,
            ObservedServiceService observedServiceService,
            AppOwnershipService appOwnershipService,
            Supplier<Instant> clock) {
        this.managedApps = managedApps;
        this.runtimeApps = runtimeApps;
        this.observedServiceService = observedServiceService;
        this.appOwnershipService = appOwnershipService;
        this.clock = clock;
    }

    public synchronized ApplicationState snapshot() {
        Instant now = clock.get();
        if (cached != null && cachedAt.plus(SNAPSHOT_TTL).isAfter(now)) {
            return cached;
        }
        List<AppInstanceView> managed = managedApps.get();
        List<AppRuntimeView> runtime = runtimeApps.get();
        List<ObservedService> observed = refreshObservedServices();
        List<ObservedServiceView> observedViews = observed.stream()
                .map(ObservedServiceService::toView)
                .toList();
        List<ObservedServiceView> pinned = observedViews.stream()
                .filter(service -> "pinned_external".equals(service.userStatus()))
                .toList();
        List<ObservedServiceView> found = observedViews.stream()
                .filter(service -> !service.managedByThisProjectOs() && !"pinned_external".equals(service.userStatus()))
                .toList();
        List<AppOwnershipView> ownership = appOwnershipService == null ? List.of() : appOwnershipService.apps(observed);
        cached = new ApplicationState(managed, runtime, observedViews, pinned, found, ownership, now);
        cachedAt = now;
        return cached;
    }

    public synchronized void invalidate() {
        cached = null;
        cachedAt = Instant.EPOCH;
    }

    private List<ObservedService> refreshObservedServices() {
        if (observedServiceService == null) {
            return List.of();
        }
        observedServiceService.refresh();
        return observedServiceService.observedServices();
    }
}
