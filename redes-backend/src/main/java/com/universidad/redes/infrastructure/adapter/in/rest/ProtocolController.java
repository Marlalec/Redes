package com.universidad.redes.infrastructure.adapter.in.rest;

import com.universidad.redes.application.port.in.GetProtocolsUseCase;
import com.universidad.redes.infrastructure.adapter.in.rest.dto.response.ProtocolResponse;
import com.universidad.redes.infrastructure.adapter.in.rest.mapper.RestResponseMapper;
import jakarta.validation.constraints.Positive;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@Validated
@RestController
@RequestMapping("/api/protocols")
public class ProtocolController {

    private final GetProtocolsUseCase useCase;

    public ProtocolController(GetProtocolsUseCase useCase) {
        this.useCase = useCase;
    }

    @GetMapping
    public List<ProtocolResponse> getAll() {
        return useCase.getAll().stream()
                .map(RestResponseMapper::toResponse)
                .toList();
    }

    @GetMapping("/{id}")
    public ProtocolResponse getById(
            @PathVariable("id") @Positive(message = "El id debe ser positivo") Integer id
    ) {
        return RestResponseMapper.toResponse(useCase.getById(id));
    }
}
