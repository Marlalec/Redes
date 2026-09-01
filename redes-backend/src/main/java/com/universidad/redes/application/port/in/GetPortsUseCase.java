package com.universidad.redes.application.port.in;

import com.universidad.redes.domain.model.NetworkPort;

import java.util.List;

public interface GetPortsUseCase {

    List<NetworkPort> getAll();

    NetworkPort getByNumber(int portNumber);
}
