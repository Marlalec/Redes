package com.universidad.redes.infrastructure.adapter.in.rest.dto.response;

public record PasswordLoginResponse(
        String status,
        AuthSessionResponse user,
        String message,
        Long expiresInSeconds
) {
}
