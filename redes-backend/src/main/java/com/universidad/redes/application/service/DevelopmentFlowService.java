package com.universidad.redes.application.service;

import com.universidad.redes.application.port.in.GetDevelopmentFlowUseCase;
import com.universidad.redes.domain.model.DevelopmentFlow;

import java.util.List;

public final class DevelopmentFlowService implements GetDevelopmentFlowUseCase {

    @Override
    public DevelopmentFlow getFlow() {
        return new DevelopmentFlow(
                "OSI Dev Explorer",
                "Flujo real de comunicación de la aplicación desde el usuario hasta SQL Server.",
                buildSteps(),
                buildOsiParticipation(),
                buildPorts(),
                List.of(
                        "El modelo OSI es conceptual y las implementaciones TCP/IP no separan siempre sus capas de forma estricta.",
                        "REST es un estilo arquitectónico y JSON es un formato de datos; no son protocolos de transporte.",
                        "JDBC es una API de Java. El driver de SQL Server utiliza TDS sobre TCP para comunicarse con la base de datos.",
                        "En producción IIS es el único punto de entrada público; los puertos 8080 y 1433 deben permanecer internos o restringidos."
                )
        );
    }

    private List<DevelopmentFlow.Step> buildSteps() {
        return List.of(
                new DevelopmentFlow.Step(1, "Usuario",
                        "Abre la dirección publicada del proyecto.",
                        "Interacción con el navegador", null),
                new DevelopmentFlow.Step(2, "Navegador",
                        "Resuelve la IP y solicita la aplicación web.",
                        "HTTP o HTTPS sobre TCP/IP", 80),
                new DevelopmentFlow.Step(3, "IIS",
                        "Entrega los archivos de React y recibe las solicitudes dirigidas a /api.",
                        "Servidor web y reverse proxy", 80),
                new DevelopmentFlow.Step(4, "React",
                        "Ejecuta la interfaz y solicita información educativa sin conectarse directamente a SQL Server.",
                        "Fetch mediante REST y JSON", null),
                new DevelopmentFlow.Step(5, "HTTP / REST / JSON",
                        "Define la solicitud, la ruta, el método GET y la representación de los datos.",
                        "Comunicación de aplicación", null),
                new DevelopmentFlow.Step(6, "Spring Boot",
                        "Recibe la solicitud, ejecuta el caso de uso y consulta a través de un puerto de salida.",
                        "API REST interna", 8080),
                new DevelopmentFlow.Step(7, "JDBC / TDS / TCP",
                        "El adaptador JPA usa el driver JDBC de Microsoft para intercambiar consultas y resultados.",
                        "TDS sobre TCP", 1433),
                new DevelopmentFlow.Step(8, "SQL Server",
                        "Consulta RedesDB y devuelve las capas, protocolos o puertos solicitados.",
                        "Respuesta por la conexión existente", 1433)
        );
    }

    private List<DevelopmentFlow.OsiParticipation> buildOsiParticipation() {
        return List.of(
                new DevelopmentFlow.OsiParticipation(7, "Aplicación",
                        "HTTP, HTTPS, DNS y TDS prestan servicios utilizados por las aplicaciones.",
                        "REST es un estilo aplicado sobre HTTP."),
                new DevelopmentFlow.OsiParticipation(6, "Presentación",
                        "JSON representa los datos y TLS puede aportar cifrado e integridad.",
                        "JSON y TLS no quedan confinados físicamente a una única capa en una implementación real."),
                new DevelopmentFlow.OsiParticipation(5, "Sesión",
                        "Los clientes HTTP, IIS, el pool JDBC y SQL Server mantienen el ciclo lógico de las comunicaciones.",
                        "TCP/IP no implementa una capa de sesión independiente equivalente a OSI."),
                new DevelopmentFlow.OsiParticipation(4, "Transporte",
                        "TCP proporciona conexiones confiables e identifica servicios mediante puertos lógicos.",
                        "Participan los puertos 80, 443, 8080 y 1433."),
                new DevelopmentFlow.OsiParticipation(3, "Red",
                        "IPv4 direcciona y enruta paquetes entre el navegador y Windows Server.",
                        "La IP identifica el servidor; el puerto identifica el servicio."),
                new DevelopmentFlow.OsiParticipation(2, "Enlace de datos",
                        "Ethernet o Wi-Fi transportan tramas dentro de cada red local.",
                        "Las direcciones MAC tienen alcance local y pueden cambiar en cada salto."),
                new DevelopmentFlow.OsiParticipation(1, "Física",
                        "Cableado, radio, interfaces y señales transportan los bits.",
                        "Es la infraestructura material sobre la cual funcionan las capas superiores.")
        );
    }

    private List<DevelopmentFlow.LogicalPort> buildPorts() {
        return List.of(
                new DevelopmentFlow.LogicalPort(80, "IIS / HTTP", "Público",
                        "Punto de entrada HTTP y publicación del frontend."),
                new DevelopmentFlow.LogicalPort(443, "IIS / HTTPS", "Público opcional",
                        "Punto de entrada cifrado cuando se configura TLS."),
                new DevelopmentFlow.LogicalPort(8080, "Spring Boot", "Interno",
                        "IIS reenvía las solicitudes /api hacia la API."),
                new DevelopmentFlow.LogicalPort(1433, "SQL Server", "Local o restringido",
                        "El backend consulta RedesDB mediante JDBC y TDS sobre TCP.")
        );
    }
}
