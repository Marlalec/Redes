package com.universidad.redes.infrastructure.adapter.in.rest.dto.request;

import jakarta.validation.constraints.AssertTrue;

public record FaceEnrollmentRequest(
        @AssertTrue(message = "Debes aceptar el tratamiento de la plantilla facial")
        boolean consent
) {
}
