package com.projectos.marketplace.api;

import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.Test;

class LegacyMarketplaceApiDeletionTests {

    @Test
    void legacyMarketplaceControllerIsDeletedAfterDiscoverTakesOverInstallFlow() {
        assertThatThrownBy(() -> Class.forName("com.projectos.marketplace.api.MarketplaceController"))
                .isInstanceOf(ClassNotFoundException.class);
    }
}
