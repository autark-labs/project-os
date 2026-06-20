package com.projectos.jobs;

import java.util.Map;

public record ProjectOsJobError(
        String code,
        String message,
        Map<String, String> advancedDetails) {
}
