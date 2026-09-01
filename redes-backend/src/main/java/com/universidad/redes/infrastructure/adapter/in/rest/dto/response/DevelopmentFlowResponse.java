package com.universidad.redes.infrastructure.adapter.in.rest.dto.response;

import java.util.List;

public record DevelopmentFlowResponse(
        String applicationName,
        String description,
        List<StepResponse> steps,
        List<OsiParticipationResponse> osiLayers,
        List<LogicalPortResponse> ports,
        List<String> technicalNotes
) {

    public record StepResponse(
            int order,
            String component,
            String description,
            String communication,
            Integer port
    ) {
    }

    public record OsiParticipationResponse(
            int layerNumber,
            String layerName,
            String participation,
            String clarification
    ) {
    }

    public record LogicalPortResponse(
            int number,
            String service,
            String scope,
            String purpose
    ) {
    }
}
