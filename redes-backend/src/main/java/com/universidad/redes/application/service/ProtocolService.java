package com.universidad.redes.application.service;

import com.universidad.redes.application.port.in.GetProtocolsUseCase;
import com.universidad.redes.application.port.out.ProtocolRepositoryPort;
import com.universidad.redes.domain.exception.ResourceNotFoundException;
import com.universidad.redes.domain.model.Protocol;

import java.util.List;
import java.util.Objects;

public final class ProtocolService implements GetProtocolsUseCase {

    private final ProtocolRepositoryPort repositoryPort;

    public ProtocolService(ProtocolRepositoryPort repositoryPort) {
        this.repositoryPort = Objects.requireNonNull(repositoryPort);
    }

    @Override
    public List<Protocol> getAll() {
        return List.copyOf(repositoryPort.findAll());
    }

    @Override
    public Protocol getById(Integer id) {
        return repositoryPort.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "No se encontró el protocolo con id " + id
                ));
    }
}
