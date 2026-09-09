package com.universidad.redes.infrastructure.adapter.in.rest.dto.response;

public record CsrfTokenResponse(
        String token,
        String headerName
) {
}
