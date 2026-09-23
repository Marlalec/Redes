package com.universidad.redes.infrastructure.adapter.in.rest.dto.response;

public record FaceVerificationResponse(
        AuthSessionResponse user,
        boolean livenessVerified,
        String message
) {
}
