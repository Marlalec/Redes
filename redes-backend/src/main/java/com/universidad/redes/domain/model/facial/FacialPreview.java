package com.universidad.redes.domain.model.facial;

public record FacialPreview(
        boolean active,
        int samples,
        int required,
        boolean faceDetected,
        boolean livenessVerified,
        String message
) {
}
