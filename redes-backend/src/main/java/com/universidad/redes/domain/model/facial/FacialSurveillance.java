package com.universidad.redes.domain.model.facial;

public record FacialSurveillance(
        boolean active,
        boolean faceDetected,
        String message
) {
}
