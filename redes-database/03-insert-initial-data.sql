/*
    Proyecto: OSI Dev Explorer
    Script: 03-insert-initial-data.sql
    Objetivo: cargar o actualizar los datos educativos iniciales.

    El script es idempotente: puede ejecutarse nuevamente sin duplicar filas.
*/

USE [RedesDB];
GO

SET NOCOUNT ON;
SET XACT_ABORT ON;
GO

BEGIN TRY
    BEGIN TRANSACTION;

    DECLARE @OsiLayerSeed TABLE
    (
        layer_number        TINYINT PRIMARY KEY,
        name                NVARCHAR(50) NOT NULL,
        description         NVARCHAR(1000) NOT NULL,
        development_example NVARCHAR(1000) NOT NULL
    );

    INSERT INTO @OsiLayerSeed
        (layer_number, name, description, development_example)
    VALUES
        (1, N'Física',
         N'Transmite bits mediante señales eléctricas, ópticas o de radio a través del medio físico.',
         N'El cable de red, la señal Wi-Fi y las interfaces de red permiten comunicar el equipo cliente con Windows Server.'),
        (2, N'Enlace de datos',
         N'Organiza los bits en tramas y gestiona el direccionamiento físico y la comunicación dentro de la red local.',
         N'Ethernet transporta las tramas entre el equipo del usuario, el switch y la interfaz de red del servidor.'),
        (3, N'Red',
         N'Gestiona el direccionamiento lógico y el enrutamiento de paquetes entre redes mediante IP.',
         N'La dirección IP permite que el navegador encuentre el Windows Server donde está publicado IIS.'),
        (4, N'Transporte',
         N'Proporciona comunicación extremo a extremo y utiliza puertos para identificar servicios. TCP ofrece entrega confiable y UDP prioriza menor sobrecarga.',
         N'TCP comunica el navegador con IIS por el puerto 80, IIS con Spring Boot por el 8080 y Java con SQL Server por el 1433.'),
        (5, N'Sesión',
         N'Representa de manera conceptual el establecimiento, mantenimiento y cierre de conversaciones entre aplicaciones.',
         N'Las bibliotecas HTTP, el pool JDBC y los servidores coordinan el ciclo de vida de las comunicaciones, aunque TCP/IP no expone una capa de sesión independiente.'),
        (6, N'Presentación',
         N'Representa el formato, la codificación, la compresión y el cifrado de la información intercambiada.',
         N'Spring Boot serializa objetos como JSON y TLS puede cifrar la comunicación HTTPS entre el navegador e IIS.'),
        (7, N'Aplicación',
         N'Ofrece servicios de red directamente utilizados por aplicaciones y usuarios, como HTTP, DNS, FTP, SSH y SMTP.',
         N'React consume una API REST mediante HTTP y Spring Boot devuelve los datos educativos en formato JSON.');

    UPDATE target
       SET target.name = source.name,
           target.description = source.description,
           target.development_example = source.development_example
    FROM dbo.OSI_LAYER AS target
    INNER JOIN @OsiLayerSeed AS source
        ON source.layer_number = target.layer_number;

    INSERT INTO dbo.OSI_LAYER
        (layer_number, name, description, development_example)
    SELECT source.layer_number,
           source.name,
           source.description,
           source.development_example
    FROM @OsiLayerSeed AS source
    WHERE NOT EXISTS
    (
        SELECT 1
        FROM dbo.OSI_LAYER AS target
        WHERE target.layer_number = source.layer_number
    );

    DECLARE @ProtocolSeed TABLE
    (
        name                NVARCHAR(50) PRIMARY KEY,
        description         NVARCHAR(1000) NOT NULL,
        transport_type      VARCHAR(10) NOT NULL,
        osi_layer_number    TINYINT NOT NULL,
        development_example NVARCHAR(1000) NOT NULL
    );

    INSERT INTO @ProtocolSeed
        (name, description, transport_type, osi_layer_number, development_example)
    VALUES
        (N'Ethernet',
         N'Familia de tecnologías de red local que define el formato de las tramas y el acceso al medio cableado.',
         'N/A', 2,
         N'Las tramas Ethernet llevan el tráfico entre el cliente, el switch y Windows Server dentro de una red cableada.'),
        (N'IPv4',
         N'Protocolo de red que identifica equipos mediante direcciones lógicas y permite enrutar paquetes.',
         'N/A', 3,
         N'El navegador utiliza la dirección IPv4 del servidor para enviar solicitudes hacia IIS.'),
        (N'TCP',
         N'Protocolo de transporte orientado a conexión que proporciona entrega ordenada, control de errores y retransmisión.',
         'TCP', 4,
         N'HTTP, TDS y otros protocolos del proyecto utilizan TCP para una comunicación confiable.'),
        (N'UDP',
         N'Protocolo de transporte sin conexión y con baja sobrecarga que no garantiza entrega ni orden.',
         'UDP', 4,
         N'DNS y DHCP pueden intercambiar mensajes rápidamente mediante datagramas UDP.'),
        (N'TLS',
         N'Protocolo criptográfico que aporta cifrado, integridad y autenticación a comunicaciones de aplicación.',
         'TCP', 6,
         N'Al configurar HTTPS, TLS protege la información intercambiada entre el navegador e IIS.'),
        (N'HTTP',
         N'Protocolo de aplicación utilizado para transferir recursos web y consumir APIs. En este alcance se considera HTTP/1.1 y HTTP/2 sobre TCP.',
         'TCP', 7,
         N'IIS publica React por el puerto 80 y redirige las solicitudes de la ruta /api hacia Spring Boot en el puerto 8080.'),
        (N'HTTPS',
         N'HTTP protegido mediante TLS. En este alcance académico se representa sobre TCP, como ocurre con HTTP/1.1 y HTTP/2.',
         'TCP', 7,
         N'El mismo sitio puede publicarse por el puerto 443 para cifrar las solicitudes del frontend y las respuestas de la API.'),
        (N'DNS',
         N'Sistema distribuido que traduce nombres de dominio a direcciones IP. Usa UDP para consultas habituales y TCP en casos como respuestas grandes o transferencias de zona.',
         'TCP/UDP', 7,
         N'Un nombre como osi-dev.local podría resolverse a la dirección IP del Windows Server antes de abrir la aplicación.'),
        (N'FTP',
         N'Protocolo de transferencia de archivos que utiliza conexiones TCP separadas para control y datos.',
         'TCP', 7,
         N'Permite estudiar por qué el control suele asociarse al puerto 21 y los datos activos al puerto 20.'),
        (N'SSH',
         N'Protocolo de aplicación que proporciona acceso remoto seguro, ejecución de comandos y túneles cifrados.',
         'TCP', 7,
         N'En servidores compatibles se utiliza para administración remota segura mediante el puerto 22.'),
        (N'SMTP',
         N'Protocolo de aplicación utilizado para transferir correo electrónico entre clientes y servidores de correo.',
         'TCP', 7,
         N'Una aplicación podría entregar notificaciones a un servidor SMTP; el puerto histórico entre servidores es el 25.'),
        (N'DHCP',
         N'Protocolo que asigna automáticamente parámetros de red como dirección IP, puerta de enlace y servidores DNS.',
         'UDP', 7,
         N'El equipo cliente puede recibir su configuración de red antes de conectarse a la IP de OSI Dev Explorer.'),
        (N'TDS',
         N'Tabular Data Stream es el protocolo de aplicación utilizado por SQL Server para intercambiar solicitudes y resultados.',
         'TCP', 7,
         N'El driver JDBC de Microsoft usa TDS sobre TCP para consultar RedesDB en el puerto 1433.'),
        (N'MySQL Protocol',
         N'Protocolo de comunicación cliente-servidor utilizado por MySQL para autenticación, consultas y resultados.',
         'TCP', 7,
         N'Permite comparar el puerto 3306 de MySQL con el 1433 utilizado por SQL Server.'),
        (N'PostgreSQL Wire Protocol',
         N'Protocolo cliente-servidor utilizado por PostgreSQL para intercambiar mensajes, consultas y resultados.',
         'TCP', 7,
         N'Permite comparar el puerto 5432 de PostgreSQL con otros puertos lógicos de bases de datos.');

    UPDATE target
       SET target.description = source.description,
           target.transport_type = source.transport_type,
           target.osi_layer_id = layer_row.id,
           target.development_example = source.development_example
    FROM dbo.PROTOCOL AS target
    INNER JOIN @ProtocolSeed AS source
        ON source.name = target.name
    INNER JOIN dbo.OSI_LAYER AS layer_row
        ON layer_row.layer_number = source.osi_layer_number;

    INSERT INTO dbo.PROTOCOL
        (name, description, transport_type, osi_layer_id, development_example)
    SELECT source.name,
           source.description,
           source.transport_type,
           layer_row.id,
           source.development_example
    FROM @ProtocolSeed AS source
    INNER JOIN dbo.OSI_LAYER AS layer_row
        ON layer_row.layer_number = source.osi_layer_number
    WHERE NOT EXISTS
    (
        SELECT 1
        FROM dbo.PROTOCOL AS target
        WHERE target.name = source.name
    );

    DECLARE @NetworkPortSeed TABLE
    (
        port_number         INT PRIMARY KEY,
        service             NVARCHAR(80) NOT NULL,
        protocol_name       NVARCHAR(50) NOT NULL,
        description         NVARCHAR(1000) NOT NULL,
        development_example NVARCHAR(1000) NOT NULL
    );

    INSERT INTO @NetworkPortSeed
        (port_number, service, protocol_name, description, development_example)
    VALUES
        (20, N'FTP Data', N'FTP',
         N'Canal de datos utilizado por FTP en modo activo.',
         N'Muestra que un mismo protocolo puede utilizar un puerto para control y otro para transferir información.'),
        (21, N'FTP Control', N'FTP',
         N'Canal de control utilizado para comandos y respuestas FTP.',
         N'Un cliente FTP establece la comunicación de control con el servidor mediante TCP 21.'),
        (22, N'SSH', N'SSH',
         N'Puerto estándar para acceso remoto y transferencia segura mediante SSH.',
         N'Un administrador puede conectarse de forma segura a un servidor compatible usando TCP 22.'),
        (25, N'SMTP', N'SMTP',
         N'Puerto histórico utilizado para la transferencia de correo entre servidores SMTP.',
         N'Una aplicación puede entregar un mensaje a un servidor de correo mediante TCP 25.'),
        (53, N'DNS', N'DNS',
         N'Puerto utilizado para resolución de nombres mediante UDP y, cuando corresponde, TCP.',
         N'El navegador puede resolver el nombre del servidor antes de solicitar OSI Dev Explorer.'),
        (67, N'DHCP Server', N'DHCP',
         N'Puerto UDP en el que un servidor DHCP recibe solicitudes de los clientes.',
         N'El servidor DHCP escucha solicitudes de configuración de red en UDP 67.'),
        (68, N'DHCP Client', N'DHCP',
         N'Puerto UDP utilizado por los clientes DHCP para recibir respuestas del servidor.',
         N'El equipo cliente recibe su dirección IP y puerta de enlace por UDP 68.'),
        (80, N'HTTP', N'HTTP',
         N'Puerto estándar de comunicación web sin cifrado.',
         N'IIS recibe en TCP 80 la solicitud inicial y las llamadas /api realizadas por React.'),
        (443, N'HTTPS', N'HTTPS',
         N'Puerto estándar para comunicación web cifrada mediante HTTP sobre TLS.',
         N'IIS puede proteger la comunicación entre React y la API publicando el sitio mediante HTTPS.'),
        (1433, N'SQL Server', N'TDS',
         N'Puerto TCP predeterminado de una instancia estándar de SQL Server.',
         N'Spring Boot utiliza el driver JDBC y TDS sobre TCP para consultar RedesDB por el puerto 1433.'),
        (3306, N'MySQL', N'MySQL Protocol',
         N'Puerto TCP predeterminado del servicio MySQL.',
         N'Se incluye para comparar los puertos lógicos utilizados por diferentes motores de base de datos.'),
        (5432, N'PostgreSQL', N'PostgreSQL Wire Protocol',
         N'Puerto TCP predeterminado del servicio PostgreSQL.',
         N'Se incluye para comparar PostgreSQL con SQL Server y MySQL.'),
        (8080, N'Spring Boot Backend', N'HTTP',
         N'Puerto alternativo utilizado internamente por la API Spring Boot de OSI Dev Explorer.',
         N'IIS recibe /api por el puerto 80 y actúa como reverse proxy hacia 127.0.0.1:8080.');

    UPDATE target
       SET target.service = source.service,
           target.protocol_id = protocol_row.id,
           target.description = source.description,
           target.development_example = source.development_example
    FROM dbo.NETWORK_PORT AS target
    INNER JOIN @NetworkPortSeed AS source
        ON source.port_number = target.port_number
    INNER JOIN dbo.PROTOCOL AS protocol_row
        ON protocol_row.name = source.protocol_name;

    INSERT INTO dbo.NETWORK_PORT
        (port_number, service, protocol_id, description, development_example)
    SELECT source.port_number,
           source.service,
           protocol_row.id,
           source.description,
           source.development_example
    FROM @NetworkPortSeed AS source
    INNER JOIN dbo.PROTOCOL AS protocol_row
        ON protocol_row.name = source.protocol_name
    WHERE NOT EXISTS
    (
        SELECT 1
        FROM dbo.NETWORK_PORT AS target
        WHERE target.port_number = source.port_number
    );

    IF (SELECT COUNT(*) FROM dbo.OSI_LAYER) <> 7
        THROW 51001, N'La carga debe dejar exactamente las siete capas OSI.', 1;

    IF EXISTS
    (
        SELECT 1
        FROM @ProtocolSeed AS source
        WHERE NOT EXISTS
        (
            SELECT 1
            FROM dbo.PROTOCOL AS target
            WHERE target.name = source.name
        )
    )
        THROW 51002, N'No fue posible cargar todos los protocolos iniciales.', 1;

    IF EXISTS
    (
        SELECT 1
        FROM @NetworkPortSeed AS source
        WHERE NOT EXISTS
        (
            SELECT 1
            FROM dbo.NETWORK_PORT AS target
            WHERE target.port_number = source.port_number
        )
    )
        THROW 51003, N'No fue posible cargar todos los puertos iniciales.', 1;

    COMMIT TRANSACTION;
    PRINT N'Datos iniciales cargados y validados correctamente.';
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
        ROLLBACK TRANSACTION;

    THROW;
END CATCH;
GO

