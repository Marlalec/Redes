package com.universidad.redes.domain.model;

public record DevelopmentExample(String description) {

    public DevelopmentExample {
        if (description == null || description.isBlank()) {
            throw new IllegalArgumentException("El ejemplo de desarrollo es obligatorio");
        }
    }
}
