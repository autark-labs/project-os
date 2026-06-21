package com.projectos.host;

public record ObservedServiceAdoptionRequest(boolean confirmed, boolean takeControlConfirmed, String confirmation) {
}
