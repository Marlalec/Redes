package com.universidad.redes.infrastructure.adapter.in.rest;

import com.universidad.redes.application.port.in.GetOsiLayersUseCase;
import com.universidad.redes.infrastructure.adapter.in.rest.dto.response.OsiLayerResponse;
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
@RequestMapping("/api/osi-layers")
public class OsiLayerController {

    private final GetOsiLayersUseCase useCase;

    public OsiLayerController(GetOsiLayersUseCase useCase) {
        this.useCase = useCase;
    }

    @GetMapping
    public List<OsiLayerResponse> getAll() {
        return useCase.getAll().stream()
                .map(RestResponseMapper::toResponse)
                .toList();
    }

    @GetMapping("/{id}")
    public OsiLayerResponse getById(
            @PathVariable("id") @Positive(message = "El id debe ser positivo") Integer id
    ) {
        return RestResponseMapper.toResponse(useCase.getById(id));
    }
}
