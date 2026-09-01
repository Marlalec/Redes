package com.universidad.redes.infrastructure.adapter.out.persistence.adapter;

import com.universidad.redes.application.port.out.OsiLayerRepositoryPort;
import com.universidad.redes.domain.model.OsiLayer;
import com.universidad.redes.infrastructure.adapter.out.persistence.mapper.PersistenceMapper;
import com.universidad.redes.infrastructure.adapter.out.persistence.repository.OsiLayerJpaRepository;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

@Component
public class OsiLayerPersistenceAdapter implements OsiLayerRepositoryPort {

    private final OsiLayerJpaRepository repository;

    public OsiLayerPersistenceAdapter(OsiLayerJpaRepository repository) {
        this.repository = repository;
    }

    @Override
    public List<OsiLayer> findAll() {
        return repository.findAllByOrderByLayerNumberDesc().stream()
                .map(PersistenceMapper::toDomain)
                .toList();
    }

    @Override
    public Optional<OsiLayer> findById(Integer id) {
        if (id == null || id < 1 || id > 255) {
            return Optional.empty();
        }

        return repository.findById((byte) id.intValue())
                .map(PersistenceMapper::toDomain);
    }
}
