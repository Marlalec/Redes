package com.universidad.redes.infrastructure.adapter.out.persistence.mapper;

import com.universidad.redes.domain.model.DevelopmentExample;
import com.universidad.redes.domain.model.NetworkPort;
import com.universidad.redes.domain.model.OsiLayer;
import com.universidad.redes.domain.model.Protocol;
import com.universidad.redes.domain.model.TransportType;
import com.universidad.redes.infrastructure.adapter.out.persistence.entity.NetworkPortJpaEntity;
import com.universidad.redes.infrastructure.adapter.out.persistence.entity.OsiLayerJpaEntity;
import com.universidad.redes.infrastructure.adapter.out.persistence.entity.ProtocolJpaEntity;

public final class PersistenceMapper {

    private PersistenceMapper() {
    }

    public static OsiLayer toDomain(OsiLayerJpaEntity entity) {
        return new OsiLayer(
                Byte.toUnsignedInt(entity.getId()),
                Byte.toUnsignedInt(entity.getLayerNumber()),
                entity.getName(),
                entity.getDescription(),
                new DevelopmentExample(entity.getDevelopmentExample())
        );
    }

    public static Protocol toDomain(ProtocolJpaEntity entity) {
        return new Protocol(
                entity.getId(),
                entity.getName(),
                entity.getDescription(),
                TransportType.fromValue(entity.getTransportType()),
                toDomain(entity.getOsiLayer()),
                new DevelopmentExample(entity.getDevelopmentExample())
        );
    }

    public static NetworkPort toDomain(NetworkPortJpaEntity entity) {
        return new NetworkPort(
                entity.getId(),
                entity.getPortNumber(),
                entity.getService(),
                toDomain(entity.getProtocol()),
                entity.getDescription(),
                new DevelopmentExample(entity.getDevelopmentExample())
        );
    }
}
