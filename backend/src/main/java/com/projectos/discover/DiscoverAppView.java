package com.projectos.discover;

import java.util.List;

import com.projectos.apps.AppOwnershipAction;
import com.projectos.apps.AppOwnershipState;
import com.projectos.host.ObservedServiceView;
import com.projectos.marketplace.model.ApplicationManifest;

public record DiscoverAppView(
        String id,
        ApplicationManifest app,
        String name,
        String image,
        String summary,
        String description,
        String categoryLabel,
        String serviceKindLabel,
        String estimatedInstallTime,
        String difficulty,
        AppOwnershipState state,
        String stateLabel,
        String stateDescription,
        String statusTone,
        String cardTone,
        boolean installed,
        boolean ownedByCurrentInstance,
        boolean installCopyWarningRequired,
        String reviewExistingHref,
        AppOwnershipAction primaryAction,
        List<AppOwnershipAction> availableActions,
        DiscoverInstalledAppSummary installedApp,
        ObservedServiceView observedService,
        DiscoverSetupSchema setupSchema) {
}
