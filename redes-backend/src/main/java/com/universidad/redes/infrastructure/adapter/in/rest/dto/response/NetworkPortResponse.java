package com.universidad.redes.infrastructure.adapter.in.rest.dto.response;

public record NetworkPortResponse(
        Integer id,
        int port,
        String service,
        String transportProtocol,
        OsiLayerSummaryResponse osiLayer,
        String description,
        ProtocolSummaryResponse protocol,
        String developmentExample
) {
}
