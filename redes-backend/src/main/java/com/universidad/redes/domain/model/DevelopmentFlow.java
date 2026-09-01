package com.universidad.redes.domain.model;

import java.util.List;

public record DevelopmentFlow(
        String applicationName,
        String description,
        List<Step> steps,
        List<OsiParticipation> osiLayers,
        List<LogicalPort> ports,
        List<String> technicalNotes
) {

    public DevelopmentFlow {
        if (applicationName == null || applicationName.isBlank()) {
            throw new IllegalArgumentException("El nombre de la aplicación es obligatorio");
        }
        if (description == null || description.isBlank()) {
            throw new IllegalArgumentException("La descripción del flujo es obligatoria");
        }
        steps = List.copyOf(steps);
        osiLayers = List.copyOf(osiLayers);
        ports = List.copyOf(ports);
        technicalNotes = List.copyOf(technicalNotes);
    }

    public record Step(
            int order,
            String component,
            String description,
            String communication,
            Integer port
    ) {
    }

    public record OsiParticipation(
            int layerNumber,
            String layerName,
            String participation,
            String clarification
    ) {
    }

    public record LogicalPort(
            int number,
            String service,
            String scope,
            String purpose
    ) {
    }
}
