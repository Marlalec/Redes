package com.universidad.redes.infrastructure.adapter.in.rest.dto.response;

public record FaceEnrollmentStatusResponse(
        boolean enrolled,
        boolean livenessRequired,
        String description
) {
}
