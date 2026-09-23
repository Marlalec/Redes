package com.universidad.redes.domain.model.facial;

public record FacialVerification(
        boolean matched,
        double score,
        boolean livenessVerified,
        String message
) {
}
