package com.universidad.redes.domain.model.facial;

public record FacialEnrollment(
        boolean enrolled,
        int samples,
        boolean livenessVerified,
        String message
) {
}
