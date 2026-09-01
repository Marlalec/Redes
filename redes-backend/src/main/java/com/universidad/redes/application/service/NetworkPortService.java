package com.universidad.redes.application.service;

import com.universidad.redes.application.port.in.GetPortsUseCase;
import com.universidad.redes.application.port.out.NetworkPortRepositoryPort;
import com.universidad.redes.domain.exception.ResourceNotFoundException;
import com.universidad.redes.domain.model.NetworkPort;

import java.util.List;
import java.util.Objects;

public final class NetworkPortService implements GetPortsUseCase {

    private final NetworkPortRepositoryPort repositoryPort;

    public NetworkPortService(NetworkPortRepositoryPort repositoryPort) {
        this.repositoryPort = Objects.requireNonNull(repositoryPort);
    }

    @Override
    public List<NetworkPort> getAll() {
        return List.copyOf(repositoryPort.findAll());
    }

    @Override
    public NetworkPort getByNumber(int portNumber) {
        return repositoryPort.findByPortNumber(portNumber)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "No se encontró el puerto " + portNumber
                ));
    }
}
