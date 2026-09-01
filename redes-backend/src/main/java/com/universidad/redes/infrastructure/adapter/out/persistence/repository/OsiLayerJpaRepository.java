package com.universidad.redes.infrastructure.adapter.out.persistence.repository;

import com.universidad.redes.infrastructure.adapter.out.persistence.entity.OsiLayerJpaEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface OsiLayerJpaRepository extends JpaRepository<OsiLayerJpaEntity, Byte> {

    List<OsiLayerJpaEntity> findAllByOrderByLayerNumberDesc();
}
