/*
    Proyecto: OSI Dev Explorer
    Script: 02-create-tables.sql
    Objetivo: crear las tablas, restricciones e indices del modelo relacional.
*/

USE [RedesDB];
GO

SET NOCOUNT ON;
SET XACT_ABORT ON;
GO

BEGIN TRY
    BEGIN TRANSACTION;

    IF OBJECT_ID(N'dbo.OSI_LAYER', N'U') IS NULL
    BEGIN
        CREATE TABLE dbo.OSI_LAYER
        (
            id                  TINYINT IDENTITY(1,1) NOT NULL,
            layer_number        TINYINT NOT NULL,
            name                NVARCHAR(50) NOT NULL,
            description         NVARCHAR(1000) NOT NULL,
            development_example NVARCHAR(1000) NOT NULL,

            CONSTRAINT PK_OSI_LAYER
                PRIMARY KEY CLUSTERED (id),
            CONSTRAINT UQ_OSI_LAYER_LAYER_NUMBER
                UNIQUE (layer_number),
            CONSTRAINT UQ_OSI_LAYER_NAME
                UNIQUE (name),
            CONSTRAINT CK_OSI_LAYER_LAYER_NUMBER
                CHECK (layer_number BETWEEN 1 AND 7)
        );

        PRINT N'Tabla dbo.OSI_LAYER creada.';
    END
    ELSE
    BEGIN
        PRINT N'La tabla dbo.OSI_LAYER ya existe.';
    END;

    IF OBJECT_ID(N'dbo.PROTOCOL', N'U') IS NULL
    BEGIN
        CREATE TABLE dbo.PROTOCOL
        (
            id                  INT IDENTITY(1,1) NOT NULL,
            name                NVARCHAR(50) NOT NULL,
            description         NVARCHAR(1000) NOT NULL,
            transport_type      VARCHAR(10) NOT NULL,
            osi_layer_id        TINYINT NOT NULL,
            development_example NVARCHAR(1000) NOT NULL,

            CONSTRAINT PK_PROTOCOL
                PRIMARY KEY CLUSTERED (id),
            CONSTRAINT UQ_PROTOCOL_NAME
                UNIQUE (name),
            CONSTRAINT CK_PROTOCOL_TRANSPORT_TYPE
                CHECK (transport_type IN ('TCP', 'UDP', 'TCP/UDP', 'N/A')),
            CONSTRAINT FK_PROTOCOL_OSI_LAYER
                FOREIGN KEY (osi_layer_id)
                REFERENCES dbo.OSI_LAYER (id)
                ON DELETE NO ACTION
                ON UPDATE NO ACTION
        );

        PRINT N'Tabla dbo.PROTOCOL creada.';
    END
    ELSE
    BEGIN
        PRINT N'La tabla dbo.PROTOCOL ya existe.';
    END;

    IF OBJECT_ID(N'dbo.NETWORK_PORT', N'U') IS NULL
    BEGIN
        CREATE TABLE dbo.NETWORK_PORT
        (
            id                  INT IDENTITY(1,1) NOT NULL,
            port_number         INT NOT NULL,
            service             NVARCHAR(80) NOT NULL,
            protocol_id         INT NOT NULL,
            description         NVARCHAR(1000) NOT NULL,
            development_example NVARCHAR(1000) NOT NULL,

            CONSTRAINT PK_NETWORK_PORT
                PRIMARY KEY CLUSTERED (id),
            CONSTRAINT UQ_NETWORK_PORT_PORT_NUMBER
                UNIQUE (port_number),
            CONSTRAINT CK_NETWORK_PORT_PORT_NUMBER
                CHECK (port_number BETWEEN 1 AND 65535),
            CONSTRAINT FK_NETWORK_PORT_PROTOCOL
                FOREIGN KEY (protocol_id)
                REFERENCES dbo.PROTOCOL (id)
                ON DELETE NO ACTION
                ON UPDATE NO ACTION
        );

        PRINT N'Tabla dbo.NETWORK_PORT creada.';
    END
    ELSE
    BEGIN
        PRINT N'La tabla dbo.NETWORK_PORT ya existe.';
    END;

    IF NOT EXISTS
    (
        SELECT 1
        FROM sys.indexes
        WHERE name = N'IX_PROTOCOL_OSI_LAYER_ID'
          AND object_id = OBJECT_ID(N'dbo.PROTOCOL')
    )
    BEGIN
        CREATE NONCLUSTERED INDEX IX_PROTOCOL_OSI_LAYER_ID
            ON dbo.PROTOCOL (osi_layer_id);
    END;

    IF NOT EXISTS
    (
        SELECT 1
        FROM sys.indexes
        WHERE name = N'IX_NETWORK_PORT_PROTOCOL_ID'
          AND object_id = OBJECT_ID(N'dbo.NETWORK_PORT')
    )
    BEGIN
        CREATE NONCLUSTERED INDEX IX_NETWORK_PORT_PROTOCOL_ID
            ON dbo.NETWORK_PORT (protocol_id);
    END;

    COMMIT TRANSACTION;
    PRINT N'Modelo relacional creado correctamente.';
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
        ROLLBACK TRANSACTION;

    THROW;
END CATCH;
GO

