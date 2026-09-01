package com.universidad.redes.application.port.in;

import com.universidad.redes.domain.model.OsiLayer;

import java.util.List;

public interface GetOsiLayersUseCase {

    List<OsiLayer> getAll();

    OsiLayer getById(Integer id);
}
