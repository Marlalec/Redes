package com.universidad.redes.infrastructure.adapter.in.rest.dto.response;

public record OsiLayerResponse(
        Integer id,
        int layerNumber,
        String name,
        String description,
        String developmentExample
) {
}
