package com.universidad.redes.domain.model;

import java.util.Arrays;

public enum TransportType {
    TCP("TCP"),
    UDP("UDP"),
    TCP_UDP("TCP/UDP"),
    NOT_APPLICABLE("N/A");

    private final String value;

    TransportType(String value) {
        this.value = value;
    }

    public String value() {
        return value;
    }

    public static TransportType fromValue(String value) {
        return Arrays.stream(values())
                .filter(type -> type.value.equalsIgnoreCase(value))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException(
                        "Tipo de transporte no soportado: " + value
                ));
    }
}
