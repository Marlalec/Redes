package com.universidad.redes.infrastructure.adapter.in.rest;

import com.universidad.redes.application.port.in.GetDevelopmentFlowUseCase;
import com.universidad.redes.infrastructure.adapter.in.rest.dto.response.DevelopmentFlowResponse;
import com.universidad.redes.infrastructure.adapter.in.rest.mapper.RestResponseMapper;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/development-flow")
public class DevelopmentFlowController {

    private final GetDevelopmentFlowUseCase useCase;

    public DevelopmentFlowController(GetDevelopmentFlowUseCase useCase) {
        this.useCase = useCase;
    }

    @GetMapping
    public DevelopmentFlowResponse getFlow() {
        return RestResponseMapper.toResponse(useCase.getFlow());
    }
}
