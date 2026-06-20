package com.projectos.marketplace.install;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Instant;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.Test;

import com.projectos.system.ProjectOsIdentity;

class DockerOwnershipServiceTests {

    private final ProjectOsIdentity identity = new ProjectOsIdentity(
            "pos_abcdef1234567890",
            "homelab-box",
            "/var/lib/project-os",
            "sha256:runtimehash",
            Instant.parse("2026-06-20T12:00:00Z"),
            1);

    @Test
    void buildsInstanceScopedComposeProjectNames() {
        DockerOwnershipService service = new DockerOwnershipService(() -> identity, () -> "0.2.0", false);

        assertThat(service.composeProject("vaultwarden")).isEqualTo("projectos_homelab-box_vaultwarden");
    }

    @Test
    void buildsDevComposeProjectNamesWithShortInstanceId() {
        DockerOwnershipService service = new DockerOwnershipService(() -> identity, () -> "0.2.0", true);

        assertThat(service.composeProject("vaultwarden")).isEqualTo("projectos_dev_abcdef12_vaultwarden");
    }

    @Test
    void createsRequiredDockerLabels() {
        DockerOwnershipService service = new DockerOwnershipService(() -> identity, () -> "0.2.0", false);

        Map<String, String> labels = service.labels("vaultwarden", "appinst_123", "projectos_homelab-box_vaultwarden");

        assertThat(labels).containsEntry("project-os.managed", "true")
                .containsEntry("project-os.instance-id", "pos_abcdef1234567890")
                .containsEntry("project-os.runtime-root-hash", "sha256:runtimehash")
                .containsEntry("project-os.app-id", "vaultwarden")
                .containsEntry("project-os.app-instance-id", "appinst_123")
                .containsEntry("project-os.compose-project", "projectos_homelab-box_vaultwarden")
                .containsEntry("project-os.version", "0.2.0");
    }

    @Test
    void convertsLabelsToComposeYamlEntries() {
        DockerOwnershipService service = new DockerOwnershipService(() -> identity, () -> "0.2.0", false);

        assertThat(service.composeLabelEntries("vaultwarden", "appinst_123", "projectos_homelab-box_vaultwarden"))
                .contains("project-os.managed=true")
                .contains("project-os.instance-id=pos_abcdef1234567890")
                .contains("project-os.app-id=vaultwarden");
    }

    @Test
    void classifiesOwnedForeignLegacyAndUnmanagedContainers() {
        DockerOwnershipService service = new DockerOwnershipService(() -> identity, () -> "0.2.0", false);

        assertThat(service.classify("projectos_homelab-box_vaultwarden_1", service.labels("vaultwarden", "appinst_123", "projectos_homelab-box_vaultwarden")).ownership())
                .isEqualTo(DockerResourceOwnership.OWNED);
        assertThat(service.classify("projectos_other_vaultwarden_1", Map.of(
                "project-os.managed", "true",
                "project-os.instance-id", "pos_other",
                "project-os.runtime-root-hash", "sha256:runtimehash",
                "project-os.app-id", "vaultwarden")).ownership())
                .isEqualTo(DockerResourceOwnership.FOREIGN);
        assertThat(service.classify("project-os-vaultwarden", Map.of("project-os.managed", "true", "project-os.app-id", "vaultwarden")).ownership())
                .isEqualTo(DockerResourceOwnership.LEGACY_UNSCOPED);
        assertThat(service.classify("redis", Map.of()).ownership())
                .isEqualTo(DockerResourceOwnership.UNMANAGED);
    }

    @Test
    void parsesDockerLabelOutput() {
        DockerOwnershipService service = new DockerOwnershipService(() -> identity, () -> "0.2.0", false);

        Map<String, String> labels = service.parseLabels(List.of(
                "project-os.managed=true",
                "project-os.instance-id=pos_abcdef1234567890",
                "project-os.app-id=vaultwarden"));

        assertThat(labels).containsEntry("project-os.managed", "true")
                .containsEntry("project-os.instance-id", "pos_abcdef1234567890")
                .containsEntry("project-os.app-id", "vaultwarden");
    }
}
