package com.universidad.redes.infrastructure.adapter.out.persistence.adapter;

import com.universidad.redes.application.port.out.AppUserRepositoryPort;
import com.universidad.redes.domain.model.AppUser;
import com.universidad.redes.infrastructure.adapter.out.persistence.entity.AppUserJpaEntity;
import com.universidad.redes.infrastructure.adapter.out.persistence.mapper.PersistenceMapper;
import com.universidad.redes.infrastructure.adapter.out.persistence.repository.AppUserJpaRepository;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
public class AppUserPersistenceAdapter implements AppUserRepositoryPort {

    private final AppUserJpaRepository repository;

    public AppUserPersistenceAdapter(AppUserJpaRepository repository) {
        this.repository = repository;
    }

    @Override
    public Optional<AppUser> findByEmail(String email) {
        if (email == null || email.isBlank()) {
            return Optional.empty();
        }

        return repository.findByEmailIgnoreCase(email.trim())
                .map(PersistenceMapper::toDomain);
    }

    @Override
    public AppUser save(AppUser user) {
        AppUserJpaEntity savedUser = repository.save(PersistenceMapper.toEntity(user));
        return PersistenceMapper.toDomain(savedUser);
    }
}
