package com.universidad.redes.infrastructure.adapter.in.rest.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record LoginRequest(
        @NotBlank(message = "El correo es obligatorio")
        @Email(message = "Escribe un correo válido")
        @Size(max = 150, message = "El correo no puede superar 150 caracteres")
        String email,

        @NotBlank(message = "La contraseña es obligatoria")
        @Size(max = 200, message = "La contraseña no puede superar 200 caracteres")
        String password
) {
}
