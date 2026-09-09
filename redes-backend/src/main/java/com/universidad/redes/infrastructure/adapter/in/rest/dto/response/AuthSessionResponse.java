package com.universidad.redes.infrastructure.adapter.in.rest.dto.response;

public record AuthSessionResponse(
        Integer id,
        String email,
        String displayName,
        String role
) {
}
