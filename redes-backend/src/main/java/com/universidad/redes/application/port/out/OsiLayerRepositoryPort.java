package com.universidad.redes.application.port.out;

import com.universidad.redes.domain.model.OsiLayer;

import java.util.List;
import java.util.Optional;

public interface OsiLayerRepositoryPort {

    List<OsiLayer> findAll();

    Optional<OsiLayer> findById(Integer id);
}
