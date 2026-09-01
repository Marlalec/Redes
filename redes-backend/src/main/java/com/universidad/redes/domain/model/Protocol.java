package com.universidad.redes.domain.model;

public record Protocol(
        Integer id,
        String name,
        String description,
        TransportType transportType,
        OsiLayer osiLayer,
        DevelopmentExample developmentExample
) {

    public Protocol {
        if (id == null || id <= 0) {
            throw new IllegalArgumentException("El identificador del protocolo debe ser positivo");
        }
        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException("El nombre del protocolo es obligatorio");
        }
        if (description == null || description.isBlank()) {
            throw new IllegalArgumentException("La descripción del protocolo es obligatoria");
        }
        if (transportType == null) {
            throw new IllegalArgumentException("El tipo de transporte del protocolo es obligatorio");
        }
        if (osiLayer == null) {
            throw new IllegalArgumentException("La capa OSI del protocolo es obligatoria");
        }
        if (developmentExample == null) {
            throw new IllegalArgumentException("El ejemplo de desarrollo del protocolo es obligatorio");
        }
    }
}
