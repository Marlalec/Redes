package com.universidad.redes.infrastructure.adapter.in.rest.dto.response;

public record FacePreviewStatusResponse(
        boolean active,
        int samples,
        int required,
        boolean faceDetected,
        boolean livenessVerified,
        String message
) {
}
