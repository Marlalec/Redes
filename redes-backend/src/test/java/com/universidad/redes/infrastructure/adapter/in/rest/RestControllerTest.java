package com.universidad.redes.infrastructure.adapter.in.rest;

import com.universidad.redes.application.port.in.GetDevelopmentFlowUseCase;
import com.universidad.redes.application.port.in.GetOsiLayersUseCase;
import com.universidad.redes.application.port.in.GetPortsUseCase;
import com.universidad.redes.application.port.in.GetProtocolsUseCase;
import com.universidad.redes.application.service.DevelopmentFlowService;
import com.universidad.redes.domain.exception.ResourceNotFoundException;
import com.universidad.redes.domain.model.DevelopmentExample;
import com.universidad.redes.domain.model.DevelopmentFlow;
import com.universidad.redes.domain.model.NetworkPort;
import com.universidad.redes.domain.model.OsiLayer;
import com.universidad.redes.domain.model.Protocol;
import com.universidad.redes.domain.model.TransportType;
import com.universidad.redes.infrastructure.adapter.in.rest.error.GlobalExceptionHandler;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class RestControllerTest {

    @Mock
    private GetOsiLayersUseCase osiLayersUseCase;

    @Mock
    private GetProtocolsUseCase protocolsUseCase;

    @Mock
    private GetPortsUseCase portsUseCase;

    @Mock
    private GetDevelopmentFlowUseCase developmentFlowUseCase;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(
                        new OsiLayerController(osiLayersUseCase),
                        new ProtocolController(protocolsUseCase),
                        new NetworkPortController(portsUseCase),
                        new DevelopmentFlowController(developmentFlowUseCase)
                )
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    void shouldReturnOsiLayers() throws Exception {
        when(osiLayersUseCase.getAll()).thenReturn(List.of(applicationLayer()));

        mockMvc.perform(get("/api/osi-layers"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].layerNumber").value(7))
                .andExpect(jsonPath("$[0].name").value("Aplicación"));
    }

    @Test
    void shouldReturnProtocols() throws Exception {
        when(protocolsUseCase.getAll()).thenReturn(List.of(httpsProtocol()));

        mockMvc.perform(get("/api/protocols"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("HTTPS"))
                .andExpect(jsonPath("$[0].transportType").value("TCP"))
                .andExpect(jsonPath("$[0].osiLayer.number").value(7));
    }

    @Test
    void shouldReturnPorts() throws Exception {
        when(portsUseCase.getAll()).thenReturn(List.of(httpsPort()));

        mockMvc.perform(get("/api/ports"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].port").value(443))
                .andExpect(jsonPath("$[0].service").value("HTTPS"));
    }

    @Test
    void shouldReturnPort443ByNumber() throws Exception {
        when(portsUseCase.getByNumber(443)).thenReturn(httpsPort());

        mockMvc.perform(get("/api/ports/443"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.port").value(443))
                .andExpect(jsonPath("$.service").value("HTTPS"))
                .andExpect(jsonPath("$.transportProtocol").value("TCP"))
                .andExpect(jsonPath("$.osiLayer.number").value(7))
                .andExpect(jsonPath("$.osiLayer.name").value("Aplicación"));
    }

    @Test
    void shouldReturnClearNotFoundError() throws Exception {
        when(portsUseCase.getByNumber(9999))
                .thenThrow(new ResourceNotFoundException("No se encontró el puerto 9999"));

        mockMvc.perform(get("/api/ports/9999"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.message").value("No se encontró el puerto 9999"))
                .andExpect(jsonPath("$.path").value("/api/ports/9999"));
    }

    @Test
    void shouldReturnDevelopmentFlow() throws Exception {
        when(developmentFlowUseCase.getFlow()).thenReturn(new DevelopmentFlowService().getFlow());

        mockMvc.perform(get("/api/development-flow"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.applicationName").value("OSI Dev Explorer"))
                .andExpect(jsonPath("$.steps[2].component").value("IIS"))
                .andExpect(jsonPath("$.ports[2].number").value(8080));
    }

    private OsiLayer applicationLayer() {
        return new OsiLayer(
                7,
                7,
                "Aplicación",
                "Servicios utilizados por aplicaciones",
                new DevelopmentExample("React consume una API REST")
        );
    }

    private Protocol httpsProtocol() {
        return new Protocol(
                6,
                "HTTPS",
                "HTTP protegido mediante TLS",
                TransportType.TCP,
                applicationLayer(),
                new DevelopmentExample("React se comunica de forma segura con Spring Boot")
        );
    }

    private NetworkPort httpsPort() {
        return new NetworkPort(
                9,
                443,
                "HTTPS",
                httpsProtocol(),
                "Comunicación web segura",
                new DevelopmentExample("IIS recibe HTTPS en el puerto 443")
        );
    }
}
