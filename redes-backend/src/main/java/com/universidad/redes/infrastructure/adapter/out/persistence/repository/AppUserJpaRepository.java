package com.universidad.redes.infrastructure.adapter.out.persistence.repository;

import com.universidad.redes.infrastructure.adapter.out.persistence.entity.AppUserJpaEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface AppUserJpaRepository extends JpaRepository<AppUserJpaEntity, Integer> {

    Optional<AppUserJpaEntity> findByEmailIgnoreCase(String email);
}
