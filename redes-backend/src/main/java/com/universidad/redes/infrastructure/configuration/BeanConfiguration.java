package com.universidad.redes.infrastructure.configuration;

import com.universidad.redes.application.port.in.GetDevelopmentFlowUseCase;
import com.universidad.redes.application.port.in.GetOsiLayersUseCase;
import com.universidad.redes.application.port.in.GetPortsUseCase;
import com.universidad.redes.application.port.in.GetProtocolsUseCase;
import com.universidad.redes.application.port.out.NetworkPortRepositoryPort;
import com.universidad.redes.application.port.out.OsiLayerRepositoryPort;
import com.universidad.redes.application.port.out.ProtocolRepositoryPort;
import com.universidad.redes.application.service.DevelopmentFlowService;
import com.universidad.redes.application.service.NetworkPortService;
import com.universidad.redes.application.service.OsiLayerService;
import com.universidad.redes.application.service.ProtocolService;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class BeanConfiguration {

    @Bean
    public GetOsiLayersUseCase getOsiLayersUseCase(OsiLayerRepositoryPort repositoryPort) {
        return new OsiLayerService(repositoryPort);
    }

    @Bean
    public GetProtocolsUseCase getProtocolsUseCase(ProtocolRepositoryPort repositoryPort) {
        return new ProtocolService(repositoryPort);
    }

    @Bean
    public GetPortsUseCase getPortsUseCase(NetworkPortRepositoryPort repositoryPort) {
        return new NetworkPortService(repositoryPort);
    }

    @Bean
    public GetDevelopmentFlowUseCase getDevelopmentFlowUseCase() {
        return new DevelopmentFlowService();
    }
}
