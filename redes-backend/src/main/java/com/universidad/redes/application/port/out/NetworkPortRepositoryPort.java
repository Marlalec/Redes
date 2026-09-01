package com.universidad.redes.application.port.out;

import com.universidad.redes.domain.model.NetworkPort;

import java.util.List;
import java.util.Optional;

public interface NetworkPortRepositoryPort {

    List<NetworkPort> findAll();

    Optional<NetworkPort> findByPortNumber(int portNumber);
}
