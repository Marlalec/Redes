package com.universidad.redes.application.port.in;

import com.universidad.redes.domain.model.Protocol;

import java.util.List;

public interface GetProtocolsUseCase {

    List<Protocol> getAll();

    Protocol getById(Integer id);
}
