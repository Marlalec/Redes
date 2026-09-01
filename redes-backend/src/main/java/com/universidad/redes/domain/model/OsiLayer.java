package com.universidad.redes.domain.model;

public record OsiLayer(
        Integer id,
        int layerNumber,
        String name,
        String description,
        DevelopmentExample developmentExample
) {

    public OsiLayer {
        if (id == null || id <= 0) {
            throw new IllegalArgumentException("El identificador de la capa OSI debe ser positivo");
        }
        if (layerNumber < 1 || layerNumber > 7) {
            throw new IllegalArgumentException("El número de capa OSI debe estar entre 1 y 7");
        }
        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException("El nombre de la capa OSI es obligatorio");
        }
        if (description == null || description.isBlank()) {
            throw new IllegalArgumentException("La descripción de la capa OSI es obligatoria");
        }
        if (developmentExample == null) {
            throw new IllegalArgumentException("El ejemplo de desarrollo de la capa OSI es obligatorio");
        }
    }
}
