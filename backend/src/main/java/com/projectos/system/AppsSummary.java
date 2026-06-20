package com.projectos.system;

import java.util.List;

public record AppsSummary(
        int installed,
        int running,
        int needsAttention,
        List<ReadyAppSummary> readyToOpen) {
}
