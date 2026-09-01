package com.universidad.redes.infrastructure.adapter.in.rest.dto.response;

public record ProtocolResponse(
        Integer id,
        String name,
        String description,
        String transportType,
        OsiLayerSummaryResponse osiLayer,
        String developmentExample
) {
}
