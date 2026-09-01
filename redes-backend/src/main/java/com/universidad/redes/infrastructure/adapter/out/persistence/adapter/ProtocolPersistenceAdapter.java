package com.universidad.redes.infrastructure.adapter.out.persistence.adapter;

import com.universidad.redes.application.port.out.ProtocolRepositoryPort;
import com.universidad.redes.domain.model.Protocol;
import com.universidad.redes.infrastructure.adapter.out.persistence.mapper.PersistenceMapper;
import com.universidad.redes.infrastructure.adapter.out.persistence.repository.ProtocolJpaRepository;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

@Component
public class ProtocolPersistenceAdapter implements ProtocolRepositoryPort {

    private final ProtocolJpaRepository repository;

    public ProtocolPersistenceAdapter(ProtocolJpaRepository repository) {
        this.repository = repository;
    }

    @Override
    public List<Protocol> findAll() {
        return repository.findAllByOrderByNameAsc().stream()
                .map(PersistenceMapper::toDomain)
                .toList();
    }

    @Override
    public Optional<Protocol> findById(Integer id) {
        return repository.findById(id)
                .map(PersistenceMapper::toDomain);
    }
}
