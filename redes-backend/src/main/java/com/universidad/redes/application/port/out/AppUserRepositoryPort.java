package com.universidad.redes.application.port.out;

import com.universidad.redes.domain.model.AppUser;

import java.util.Optional;

public interface AppUserRepositoryPort {

    Optional<AppUser> findByEmail(String email);

    AppUser save(AppUser user);
}
