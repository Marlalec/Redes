package com.universidad.redes.domain.model;

public record NetworkPort(
        Integer id,
        int portNumber,
        String service,
        Protocol protocol,
        String description,
        DevelopmentExample developmentExample
) {

    public NetworkPort {
        if (id == null || id <= 0) {
            throw new IllegalArgumentException("El identificador del puerto debe ser positivo");
        }
        if (portNumber < 1 || portNumber > 65_535) {
            throw new IllegalArgumentException("El número de puerto debe estar entre 1 y 65535");
        }
        if (service == null || service.isBlank()) {
            throw new IllegalArgumentException("El servicio del puerto es obligatorio");
        }
        if (protocol == null) {
            throw new IllegalArgumentException("El protocolo asociado al puerto es obligatorio");
        }
        if (description == null || description.isBlank()) {
            throw new IllegalArgumentException("La descripción del puerto es obligatoria");
        }
        if (developmentExample == null) {
            throw new IllegalArgumentException("El ejemplo de desarrollo del puerto es obligatorio");
        }
    }

    public TransportType transportProtocol() {
        return protocol.transportType();
    }

    public OsiLayer osiLayer() {
        return protocol.osiLayer();
    }
}
