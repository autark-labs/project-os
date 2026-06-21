package com.projectos.apps;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;

import org.junit.jupiter.api.Test;

class AppOwnershipControllerTests {

    @Test
    void returnsCanonicalAppOwnershipPayload() {
        AppOwnershipView view = new AppOwnershipView(
                "vaultwarden",
                "Vaultwarden",
                "Security",
                "",
                "Password manager",
                "Password manager",
                AppOwnershipState.AVAILABLE,
                "Available",
                "Ready to review before install.",
                "neutral",
                "neutral",
                false,
                false,
                false,
                null,
                new AppOwnershipAction("review_setup", "Review setup", "route", "/discover/apps/vaultwarden", null, false, ""),
                List.of(new AppOwnershipAction("review_setup", "Review setup", "route", "/discover/apps/vaultwarden", null, false, "")),
                null,
                null,
                null);

        AppOwnershipController controller = new AppOwnershipController(() -> List.of(view));

        assertThat(controller.apps()).containsExactly(view);
    }
}
