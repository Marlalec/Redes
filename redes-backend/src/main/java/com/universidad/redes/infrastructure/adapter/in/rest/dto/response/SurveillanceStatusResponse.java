package com.universidad.redes.infrastructure.adapter.in.rest.dto.response;

public record SurveillanceStatusResponse(
        boolean active,
        boolean faceDetected,
        String message
) {
}
