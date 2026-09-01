package com.universidad.redes.infrastructure.adapter.in.rest.mapper;

import com.universidad.redes.domain.model.DevelopmentFlow;
import com.universidad.redes.domain.model.NetworkPort;
import com.universidad.redes.domain.model.OsiLayer;
import com.universidad.redes.domain.model.Protocol;
import com.universidad.redes.infrastructure.adapter.in.rest.dto.response.DevelopmentFlowResponse;
import com.universidad.redes.infrastructure.adapter.in.rest.dto.response.NetworkPortResponse;
import com.universidad.redes.infrastructure.adapter.in.rest.dto.response.OsiLayerResponse;
import com.universidad.redes.infrastructure.adapter.in.rest.dto.response.OsiLayerSummaryResponse;
import com.universidad.redes.infrastructure.adapter.in.rest.dto.response.ProtocolResponse;
import com.universidad.redes.infrastructure.adapter.in.rest.dto.response.ProtocolSummaryResponse;

public final class RestResponseMapper {

    private RestResponseMapper() {
    }

    public static OsiLayerResponse toResponse(OsiLayer layer) {
        return new OsiLayerResponse(
                layer.id(),
                layer.layerNumber(),
                layer.name(),
                layer.description(),
                layer.developmentExample().description()
        );
    }

    public static ProtocolResponse toResponse(Protocol protocol) {
        return new ProtocolResponse(
                protocol.id(),
                protocol.name(),
                protocol.description(),
                protocol.transportType().value(),
                toSummary(protocol.osiLayer()),
                protocol.developmentExample().description()
        );
    }

    public static NetworkPortResponse toResponse(NetworkPort networkPort) {
        return new NetworkPortResponse(
                networkPort.id(),
                networkPort.portNumber(),
                networkPort.service(),
                networkPort.transportProtocol().value(),
                toSummary(networkPort.osiLayer()),
                networkPort.description(),
                new ProtocolSummaryResponse(
                        networkPort.protocol().id(),
                        networkPort.protocol().name()
                ),
                networkPort.developmentExample().description()
        );
    }

    public static DevelopmentFlowResponse toResponse(DevelopmentFlow flow) {
        return new DevelopmentFlowResponse(
                flow.applicationName(),
                flow.description(),
                flow.steps().stream()
                        .map(step -> new DevelopmentFlowResponse.StepResponse(
                                step.order(),
                                step.component(),
                                step.description(),
                                step.communication(),
                                step.port()
                        ))
                        .toList(),
                flow.osiLayers().stream()
                        .map(layer -> new DevelopmentFlowResponse.OsiParticipationResponse(
                                layer.layerNumber(),
                                layer.layerName(),
                                layer.participation(),
                                layer.clarification()
                        ))
                        .toList(),
                flow.ports().stream()
                        .map(port -> new DevelopmentFlowResponse.LogicalPortResponse(
                                port.number(),
                                port.service(),
                                port.scope(),
                                port.purpose()
                        ))
                        .toList(),
                flow.technicalNotes()
        );
    }

    private static OsiLayerSummaryResponse toSummary(OsiLayer layer) {
        return new OsiLayerSummaryResponse(
                layer.id(),
                layer.layerNumber(),
                layer.name()
        );
    }
}
