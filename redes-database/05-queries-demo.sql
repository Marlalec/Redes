/*
    Proyecto: OSI Dev Explorer
    Script: 05-queries-demo.sql
    Objetivo: verificar el modelo y mostrar consultas útiles para la exposición.

    Este script es de solo lectura.
*/

USE [RedesDB];
GO

SET NOCOUNT ON;
GO

-- 1. Resumen del ambiente y cantidad de registros.
SELECT
    @@SERVERNAME AS server_name,
    DB_NAME() AS database_name,
    (SELECT COUNT(*) FROM dbo.OSI_LAYER) AS osi_layer_count,
    (SELECT COUNT(*) FROM dbo.PROTOCOL) AS protocol_count,
    (SELECT COUNT(*) FROM dbo.NETWORK_PORT) AS network_port_count;

-- 2. Las siete capas en el orden visual utilizado por el frontend.
SELECT
    id,
    layer_number,
    name,
    description,
    development_example
FROM dbo.OSI_LAYER
ORDER BY layer_number DESC;

-- 3. Protocolos con su capa OSI y tipo de transporte.
SELECT
    protocol_row.id,
    protocol_row.name AS protocol_name,
    protocol_row.transport_type,
    layer_row.layer_number,
    layer_row.name AS osi_layer_name,
    protocol_row.description,
    protocol_row.development_example
FROM dbo.PROTOCOL AS protocol_row
INNER JOIN dbo.OSI_LAYER AS layer_row
    ON layer_row.id = protocol_row.osi_layer_id
ORDER BY protocol_row.name;

-- 4. Puertos con su protocolo, transporte y capa OSI.
SELECT
    port_row.id,
    port_row.port_number,
    port_row.service,
    protocol_row.name AS protocol_name,
    protocol_row.transport_type,
    layer_row.layer_number AS osi_layer_number,
    layer_row.name AS osi_layer_name,
    port_row.description,
    port_row.development_example
FROM dbo.NETWORK_PORT AS port_row
INNER JOIN dbo.PROTOCOL AS protocol_row
    ON protocol_row.id = port_row.protocol_id
INNER JOIN dbo.OSI_LAYER AS layer_row
    ON layer_row.id = protocol_row.osi_layer_id
ORDER BY port_row.port_number;

-- 5. Respuesta de datos esperada para GET /api/ports/443.
SELECT
    port_row.id,
    port_row.port_number,
    port_row.service,
    protocol_row.transport_type,
    port_row.description,
    protocol_row.id AS protocol_id,
    protocol_row.name AS protocol_name,
    layer_row.id AS osi_layer_id,
    layer_row.layer_number AS osi_layer_number,
    layer_row.name AS osi_layer_name,
    port_row.development_example
FROM dbo.NETWORK_PORT AS port_row
INNER JOIN dbo.PROTOCOL AS protocol_row
    ON protocol_row.id = port_row.protocol_id
INNER JOIN dbo.OSI_LAYER AS layer_row
    ON layer_row.id = protocol_row.osi_layer_id
WHERE port_row.port_number = 443;

-- 6. Puertos utilizados por la arquitectura de OSI Dev Explorer.
SELECT
    port_row.port_number,
    port_row.service,
    protocol_row.name AS protocol_name,
    protocol_row.transport_type
FROM dbo.NETWORK_PORT AS port_row
INNER JOIN dbo.PROTOCOL AS protocol_row
    ON protocol_row.id = port_row.protocol_id
WHERE port_row.port_number IN (80, 443, 8080, 1433)
ORDER BY port_row.port_number;

-- 7. Permisos directos asignados al usuario utilizado por Spring Boot.
SELECT
    database_principal.name AS database_user,
    database_permission.state_desc,
    database_permission.permission_name,
    OBJECT_SCHEMA_NAME(database_permission.major_id) AS schema_name,
    OBJECT_NAME(database_permission.major_id) AS object_name
FROM sys.database_principals AS database_principal
INNER JOIN sys.database_permissions AS database_permission
    ON database_permission.grantee_principal_id = database_principal.principal_id
WHERE database_principal.name = N'redes_app'
ORDER BY database_permission.permission_name,
         object_name;

-- 8. Validaciones automáticas de consistencia.
IF (SELECT COUNT(*) FROM dbo.OSI_LAYER) <> 7
    THROW 51020, N'Validación fallida: deben existir exactamente siete capas OSI.', 1;

IF (SELECT COUNT(*) FROM dbo.PROTOCOL) < 15
    THROW 51021, N'Validación fallida: faltan protocolos iniciales.', 1;

IF (SELECT COUNT(*) FROM dbo.NETWORK_PORT) < 13
    THROW 51022, N'Validación fallida: faltan puertos iniciales.', 1;

IF EXISTS
(
    SELECT port_number
    FROM dbo.NETWORK_PORT
    GROUP BY port_number
    HAVING COUNT(*) > 1
)
    THROW 51023, N'Validación fallida: existen números de puerto duplicados.', 1;

IF EXISTS
(
    SELECT 1
    FROM dbo.PROTOCOL AS protocol_row
    LEFT JOIN dbo.OSI_LAYER AS layer_row
        ON layer_row.id = protocol_row.osi_layer_id
    WHERE layer_row.id IS NULL
)
    THROW 51024, N'Validación fallida: existe un protocolo sin capa OSI válida.', 1;

IF EXISTS
(
    SELECT 1
    FROM dbo.NETWORK_PORT AS port_row
    LEFT JOIN dbo.PROTOCOL AS protocol_row
        ON protocol_row.id = port_row.protocol_id
    WHERE protocol_row.id IS NULL
)
    THROW 51025, N'Validación fallida: existe un puerto sin protocolo válido.', 1;

IF NOT EXISTS
(
    SELECT 1
    FROM dbo.NETWORK_PORT AS port_row
    INNER JOIN dbo.PROTOCOL AS protocol_row
        ON protocol_row.id = port_row.protocol_id
    INNER JOIN dbo.OSI_LAYER AS layer_row
        ON layer_row.id = protocol_row.osi_layer_id
    WHERE port_row.port_number = 443
      AND port_row.service = N'HTTPS'
      AND protocol_row.transport_type = 'TCP'
      AND layer_row.layer_number = 7
)
    THROW 51026, N'Validación fallida: la configuración educativa del puerto HTTPS 443 es incorrecta.', 1;

IF SUSER_ID(N'redes_app') IS NULL OR USER_ID(N'redes_app') IS NULL
    THROW 51027, N'Validación fallida: el login o el usuario redes_app no existe.', 1;

IF CONVERT(INT, SERVERPROPERTY('IsIntegratedSecurityOnly')) = 1
    THROW 51028, N'Validación fallida: SQL Server debe permitir autenticación mixta para utilizar el login redes_app.', 1;

IF
(
    SELECT COUNT(*)
    FROM sys.database_permissions AS database_permission
    INNER JOIN sys.database_principals AS database_principal
        ON database_principal.principal_id = database_permission.grantee_principal_id
    WHERE database_principal.name = N'redes_app'
      AND database_permission.state IN ('G', 'W')
      AND database_permission.permission_name = N'SELECT'
      AND database_permission.major_id IN
          (
              OBJECT_ID(N'dbo.OSI_LAYER'),
              OBJECT_ID(N'dbo.PROTOCOL'),
              OBJECT_ID(N'dbo.NETWORK_PORT')
          )
) <> 3
    THROW 51029, N'Validación fallida: redes_app no tiene SELECT sobre las tres tablas requeridas.', 1;

IF EXISTS
(
    SELECT 1
    FROM sys.database_permissions AS database_permission
    INNER JOIN sys.database_principals AS database_principal
        ON database_principal.principal_id = database_permission.grantee_principal_id
    WHERE database_principal.name = N'redes_app'
      AND database_permission.state IN ('G', 'W')
      AND database_permission.permission_name IN
          (N'INSERT', N'UPDATE', N'DELETE', N'ALTER', N'CONTROL')
)
    THROW 51030, N'Validación fallida: redes_app tiene permisos de escritura o administración no permitidos.', 1;

SELECT
    N'OK' AS validation_status,
    N'Las tablas, relaciones, datos y permisos mínimos son consistentes.' AS validation_message;
GO
