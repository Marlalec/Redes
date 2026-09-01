package com.universidad.redes.infrastructure.adapter.out.persistence.repository;

import com.universidad.redes.infrastructure.adapter.out.persistence.entity.ProtocolJpaEntity;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ProtocolJpaRepository extends JpaRepository<ProtocolJpaEntity, Integer> {

    @EntityGraph(attributePaths = "osiLayer")
    List<ProtocolJpaEntity> findAllByOrderByNameAsc();

    @Override
    @EntityGraph(attributePaths = "osiLayer")
    Optional<ProtocolJpaEntity> findById(Integer id);
}
