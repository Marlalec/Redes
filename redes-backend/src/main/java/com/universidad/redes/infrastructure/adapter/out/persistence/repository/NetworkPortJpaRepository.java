package com.universidad.redes.infrastructure.adapter.out.persistence.repository;

import com.universidad.redes.infrastructure.adapter.out.persistence.entity.NetworkPortJpaEntity;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface NetworkPortJpaRepository extends JpaRepository<NetworkPortJpaEntity, Integer> {

    @EntityGraph(attributePaths = {"protocol", "protocol.osiLayer"})
    List<NetworkPortJpaEntity> findAllByOrderByPortNumberAsc();

    @EntityGraph(attributePaths = {"protocol", "protocol.osiLayer"})
    Optional<NetworkPortJpaEntity> findByPortNumber(Integer portNumber);
}
