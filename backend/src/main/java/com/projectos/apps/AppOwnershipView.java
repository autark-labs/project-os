package com.projectos.apps;

import java.util.List;

import com.projectos.discover.DiscoverInstalledAppSummary;
import com.projectos.host.ExternalService;
import com.projectos.host.HostInventoryResource;

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
        boolean installed,
        boolean ownedByCurrentInstance,
        boolean installCopyWarningRequired,
        String reviewExistingHref,
        AppOwnershipAction primaryAction,
        List<AppOwnershipAction> availableActions,
        DiscoverInstalledAppSummary installedApp,
        HostInventoryResource foundResource,
        ExternalService linkedService) {
}
