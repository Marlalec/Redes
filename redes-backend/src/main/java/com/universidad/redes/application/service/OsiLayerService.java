package com.universidad.redes.application.service;

import com.universidad.redes.application.port.in.GetOsiLayersUseCase;
import com.universidad.redes.application.port.out.OsiLayerRepositoryPort;
import com.universidad.redes.domain.exception.ResourceNotFoundException;
import com.universidad.redes.domain.model.OsiLayer;

import java.util.List;
import java.util.Objects;

public final class OsiLayerService implements GetOsiLayersUseCase {

    private final OsiLayerRepositoryPort repositoryPort;

    public OsiLayerService(OsiLayerRepositoryPort repositoryPort) {
        this.repositoryPort = Objects.requireNonNull(repositoryPort);
    }

    @Override
    public List<OsiLayer> getAll() {
        return List.copyOf(repositoryPort.findAll());
    }

    @Override
    public OsiLayer getById(Integer id) {
        return repositoryPort.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "No se encontró la capa OSI con id " + id
                ));
    }
}
