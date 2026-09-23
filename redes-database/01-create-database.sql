USE [master];
GO

SET NOCOUNT ON;
GO

IF DB_ID(N'RedesDB') IS NULL
BEGIN
    PRINT N'Creando la base de datos RedesDB...';
    CREATE DATABASE [RedesDB];
    PRINT N'Base de datos RedesDB creada correctamente.';
END
ELSE
BEGIN
    PRINT N'La base de datos RedesDB ya existe. No se realizaron cambios.';
END;
GO
