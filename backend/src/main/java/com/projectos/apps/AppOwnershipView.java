package com.projectos.apps;

import java.util.List;

import com.projectos.discover.DiscoverInstalledAppSummary;
import com.projectos.host.HostInventoryResource;
import com.projectos.host.ObservedServiceView;

public record AppOwnershipView(
        String catalogAppId,
        String name,
        String category,
        String image,
        String summary,
        String description,
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
        HostInventoryResource foundResource,
        ObservedServiceView observedService) {
}
