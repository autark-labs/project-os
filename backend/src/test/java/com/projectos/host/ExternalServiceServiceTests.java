package com.projectos.host;

import static org.assertj.core.api.Assertions.assertThat;

import java.nio.file.Path;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import com.projectos.marketplace.runtime.ProjectOsRuntimeProperties;
import com.projectos.marketplace.runtime.RuntimeLayout;

class ExternalServiceServiceTests {

    @TempDir
    Path runtimeRoot;

    @Test
    void linkedServicesCanBeAddedListedAndRemovedWithoutManagingRuntime() {
        ExternalServiceService service = new ExternalServiceService(repository());

        ExternalService serviceView = service.add(new ExternalServiceRequest("Router", "http://192.168.1.1", "Network", "LAN", true, "homepage"));

        assertThat(serviceView.id()).isNotBlank();
        assertThat(service.list()).singleElement().satisfies(linked -> {
            assertThat(linked.name()).isEqualTo("Router");
            assertThat(linked.url()).isEqualTo("http://192.168.1.1");
            assertThat(linked.managementMode()).isEqualTo("linked");
            assertThat(linked.catalogAppId()).isEqualTo("homepage");
        });

        ActionResult result = service.remove(serviceView.id());

        assertThat(result.ok()).isTrue();
        assertThat(service.list()).isEmpty();
    }

    private ExternalServiceRepository repository() {
        ProjectOsRuntimeProperties properties = new ProjectOsRuntimeProperties();
        properties.setRuntimeRoot(runtimeRoot.toString());
        return new ExternalServiceRepository(new RuntimeLayout(properties));
    }
}
