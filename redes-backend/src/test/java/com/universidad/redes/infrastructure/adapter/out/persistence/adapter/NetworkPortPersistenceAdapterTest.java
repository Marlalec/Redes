package com.universidad.redes.infrastructure.adapter.out.persistence.adapter;

import com.universidad.redes.domain.model.NetworkPort;
import com.universidad.redes.domain.model.TransportType;
import com.universidad.redes.infrastructure.adapter.out.persistence.entity.NetworkPortJpaEntity;
import com.universidad.redes.infrastructure.adapter.out.persistence.entity.OsiLayerJpaEntity;
import com.universidad.redes.infrastructure.adapter.out.persistence.entity.ProtocolJpaEntity;
import com.universidad.redes.infrastructure.adapter.out.persistence.repository.NetworkPortJpaRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class NetworkPortPersistenceAdapterTest {

    @Mock
    private NetworkPortJpaRepository repository;

    @Test
    void shouldMapJpaEntityToDomain() {
        OsiLayerJpaEntity layerEntity = new OsiLayerJpaEntity(
                (byte) 7,
                (byte) 7,
                "Aplicación",
                "Servicios de aplicación",
                "React consume una API REST"
        );

        ProtocolJpaEntity protocolEntity = new ProtocolJpaEntity(
                6,
                "HTTPS",
                "HTTP protegido mediante TLS",
                "TCP",
                layerEntity,
                "Comunicación segura entre React y Spring Boot"
        );

        NetworkPortJpaEntity portEntity = new NetworkPortJpaEntity(
                9,
                443,
                "HTTPS",
                protocolEntity,
                "Comunicación web segura",
                "IIS publica HTTPS"
        );

        when(repository.findByPortNumber(443)).thenReturn(Optional.of(portEntity));

        NetworkPortPersistenceAdapter adapter = new NetworkPortPersistenceAdapter(repository);
        Optional<NetworkPort> result = adapter.findByPortNumber(443);

        assertThat(result).isPresent();
        assertThat(result.orElseThrow().portNumber()).isEqualTo(443);
        assertThat(result.orElseThrow().protocol().name()).isEqualTo("HTTPS");
        assertThat(result.orElseThrow().transportProtocol()).isEqualTo(TransportType.TCP);
        assertThat(result.orElseThrow().osiLayer().layerNumber()).isEqualTo(7);
    }
}
