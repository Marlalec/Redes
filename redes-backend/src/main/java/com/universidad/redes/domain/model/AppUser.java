package com.universidad.redes.domain.model;

import java.util.Locale;

public record AppUser(
        Integer id,
        String email,
        String displayName,
        String passwordHash,
        UserRole role,
        boolean active
) {

    public AppUser {
        if (id != null && id <= 0) {
            throw new IllegalArgumentException("El identificador del usuario debe ser positivo");
        }
        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("El correo del usuario es obligatorio");
        }
        if (displayName == null || displayName.isBlank()) {
            throw new IllegalArgumentException("El nombre del usuario es obligatorio");
        }
        if (passwordHash == null || passwordHash.isBlank()) {
            throw new IllegalArgumentException("La contraseña cifrada del usuario es obligatoria");
        }
        if (role == null) {
            throw new IllegalArgumentException("El rol del usuario es obligatorio");
        }

        email = email.trim().toLowerCase(Locale.ROOT);
        displayName = displayName.trim();
    }
}
