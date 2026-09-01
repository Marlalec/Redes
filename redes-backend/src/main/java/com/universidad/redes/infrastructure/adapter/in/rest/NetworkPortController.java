package com.universidad.redes.infrastructure.adapter.in.rest;

import com.universidad.redes.application.port.in.GetPortsUseCase;
import com.universidad.redes.infrastructure.adapter.in.rest.dto.response.NetworkPortResponse;
import com.universidad.redes.infrastructure.adapter.in.rest.mapper.RestResponseMapper;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@Validated
@RestController
@RequestMapping("/api/ports")
public class NetworkPortController {

    private final GetPortsUseCase useCase;

    public NetworkPortController(GetPortsUseCase useCase) {
        this.useCase = useCase;
    }

    @GetMapping
    public List<NetworkPortResponse> getAll() {
        return useCase.getAll().stream()
                .map(RestResponseMapper::toResponse)
                .toList();
    }

    @GetMapping("/{number}")
    public NetworkPortResponse getByNumber(
            @PathVariable("number")
            @Min(value = 1, message = "El puerto debe ser mayor o igual a 1")
            @Max(value = 65_535, message = "El puerto debe ser menor o igual a 65535")
            int portNumber
    ) {
        return RestResponseMapper.toResponse(useCase.getByNumber(portNumber));
    }
}
