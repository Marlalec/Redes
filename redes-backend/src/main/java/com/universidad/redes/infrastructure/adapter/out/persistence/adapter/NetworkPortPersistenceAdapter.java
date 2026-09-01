package com.universidad.redes.infrastructure.adapter.out.persistence.adapter;

import com.universidad.redes.application.port.out.NetworkPortRepositoryPort;
import com.universidad.redes.domain.model.NetworkPort;
import com.universidad.redes.infrastructure.adapter.out.persistence.mapper.PersistenceMapper;
import com.universidad.redes.infrastructure.adapter.out.persistence.repository.NetworkPortJpaRepository;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

@Component
public class NetworkPortPersistenceAdapter implements NetworkPortRepositoryPort {

    private final NetworkPortJpaRepository repository;

    public NetworkPortPersistenceAdapter(NetworkPortJpaRepository repository) {
        this.repository = repository;
    }

    @Override
    public List<NetworkPort> findAll() {
        return repository.findAllByOrderByPortNumberAsc().stream()
                .map(PersistenceMapper::toDomain)
                .toList();
    }

    @Override
    public Optional<NetworkPort> findByPortNumber(int portNumber) {
        return repository.findByPortNumber(portNumber)
                .map(PersistenceMapper::toDomain);
    }
}
