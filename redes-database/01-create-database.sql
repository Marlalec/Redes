/*
    Proyecto: OSI Dev Explorer
    Script: 01-create-database.sql
    Objetivo: crear la base de datos RedesDB de forma segura para reejecucion.

    Ejecutar con una cuenta que tenga permiso CREATE DATABASE.
*/

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

