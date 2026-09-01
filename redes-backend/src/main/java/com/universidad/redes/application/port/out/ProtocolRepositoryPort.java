package com.universidad.redes.application.port.out;

import com.universidad.redes.domain.model.Protocol;

import java.util.List;
import java.util.Optional;

public interface ProtocolRepositoryPort {

    List<Protocol> findAll();

    Optional<Protocol> findById(Integer id);
}
