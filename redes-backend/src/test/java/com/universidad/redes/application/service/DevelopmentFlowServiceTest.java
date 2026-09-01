package com.universidad.redes.application.service;

import com.universidad.redes.domain.model.DevelopmentFlow;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class DevelopmentFlowServiceTest {

    @Test
    void shouldDescribeTheRealApplicationFlow() {
        DevelopmentFlow flow = new DevelopmentFlowService().getFlow();

        assertThat(flow.steps())
                .extracting(DevelopmentFlow.Step::component)
                .containsExactly(
                        "Usuario",
                        "Navegador",
                        "IIS",
                        "React",
                        "HTTP / REST / JSON",
                        "Spring Boot",
                        "JDBC / TDS / TCP",
                        "SQL Server"
                );

        assertThat(flow.osiLayers()).hasSize(7);
        assertThat(flow.ports())
                .extracting(DevelopmentFlow.LogicalPort::number)
                .containsExactly(80, 443, 8080, 1433);
    }
}
