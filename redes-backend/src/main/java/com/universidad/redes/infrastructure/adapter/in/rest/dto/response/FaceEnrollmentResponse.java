package com.universidad.redes.infrastructure.adapter.in.rest.dto.response;

public record FaceEnrollmentResponse(
        boolean enrolled,
        int samples,
        boolean livenessVerified,
        String message
) {
}
