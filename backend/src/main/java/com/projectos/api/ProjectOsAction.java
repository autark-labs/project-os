package com.projectos.api;

import java.util.Optional;

public record ProjectOsAction(
        String id,
        String label,
        Optional<String> method,
        Optional<String> href,
        Optional<String> route,
        boolean confirmationRequired,
        boolean danger) {

    public static ProjectOsAction post(String id, String label, String href, boolean confirmationRequired, boolean danger) {
        return new ProjectOsAction(id, label, Optional.of("POST"), Optional.of(href), Optional.empty(), confirmationRequired, danger);
    }

    public static ProjectOsAction get(String id, String label, String href) {
        return new ProjectOsAction(id, label, Optional.of("GET"), Optional.of(href), Optional.empty(), false, false);
    }

    public static ProjectOsAction route(String id, String label, String route) {
        return new ProjectOsAction(id, label, Optional.empty(), Optional.empty(), Optional.of(route), false, false);
    }
}
