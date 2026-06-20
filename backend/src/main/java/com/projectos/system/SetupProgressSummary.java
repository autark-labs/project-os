package com.projectos.system;

public record SetupProgressSummary(
        boolean complete,
        String status,
        String nextStep,
        String summary) {
}
