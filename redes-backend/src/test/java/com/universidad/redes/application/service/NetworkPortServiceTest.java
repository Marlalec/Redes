package com.universidad.redes.application.service;

import com.universidad.redes.application.port.out.NetworkPortRepositoryPort;
import com.universidad.redes.domain.exception.ResourceNotFoundException;
import com.universidad.redes.domain.model.DevelopmentExample;
import com.universidad.redes.domain.model.NetworkPort;
import com.universidad.redes.domain.model.OsiLayer;
import com.universidad.redes.domain.model.Protocol;
import com.universidad.redes.domain.model.TransportType;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class NetworkPortServiceTest {

    @Mock
    private NetworkPortRepositoryPort repositoryPort;

    @Test
    void shouldReturnPortByNumber() {
        NetworkPort expectedPort = createHttpsPort();
        when(repositoryPort.findByPortNumber(443)).thenReturn(Optional.of(expectedPort));

        NetworkPortService service = new NetworkPortService(repositoryPort);

        NetworkPort result = service.getByNumber(443);

        assertThat(result).isEqualTo(expectedPort);
        assertThat(result.transportProtocol()).isEqualTo(TransportType.TCP);
        assertThat(result.osiLayer().layerNumber()).isEqualTo(7);
    }

    @Test
    void shouldThrowNotFoundWhenPortDoesNotExist() {
        when(repositoryPort.findByPortNumber(9999)).thenReturn(Optional.empty());

        NetworkPortService service = new NetworkPortService(repositoryPort);

        assertThatThrownBy(() -> service.getByNumber(9999))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("No se encontró el puerto 9999");
    }

    private NetworkPort createHttpsPort() {
        OsiLayer applicationLayer = new OsiLayer(
                7,
                7,
                "Aplicación",
                "Servicios de aplicación",
                new DevelopmentExample("React consume HTTP")
        );

        Protocol https = new Protocol(
                6,
                "HTTPS",
                "HTTP protegido con TLS",
                TransportType.TCP,
                applicationLayer,
                new DevelopmentExample("React se comunica de forma segura con Spring Boot")
        );

        return new NetworkPort(
                9,
                443,
                "HTTPS",
                https,
                "Comunicación web segura",
                new DevelopmentExample("IIS recibe HTTPS en el puerto 443")
        );
    }
}
