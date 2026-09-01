/*
    Proyecto: OSI Dev Explorer
    Script: 04-create-app-login.template.sql
    Objetivo: crear un login de solo lectura para Spring Boot.

    IMPORTANTE
    1. Copie este archivo como 04-create-app-login.local.sql.
    2. Reemplace <REPLACE_WITH_STRONG_PASSWORD> solo en la copia local.
    3. No suba la copia local al repositorio.
*/

USE [master];
GO

SET NOCOUNT ON;
GO

IF SUSER_ID(N'redes_app') IS NULL
BEGIN
    DECLARE @Password NVARCHAR(128) = N'<REPLACE_WITH_STRONG_PASSWORD>';

    IF @Password = N'<REPLACE_WITH_STRONG_PASSWORD>' OR LEN(@Password) < 12
        THROW 51010, N'Defina una contraseña fuerte de al menos 12 caracteres en la copia local del script.', 1;

    DECLARE @CreateLoginSql NVARCHAR(MAX);

    SET @CreateLoginSql =
        N'CREATE LOGIN [redes_app] WITH PASSWORD = N'''
        + REPLACE(@Password, N'''', N'''''' )
        + N''', CHECK_POLICY = ON, CHECK_EXPIRATION = OFF;';

    EXEC sys.sp_executesql @CreateLoginSql;
    PRINT N'Login redes_app creado correctamente.';
END
ELSE
BEGIN
    PRINT N'El login redes_app ya existe.';
END;
GO

USE [RedesDB];
GO

IF USER_ID(N'redes_app') IS NULL
BEGIN
    CREATE USER [redes_app] FOR LOGIN [redes_app];
    PRINT N'Usuario redes_app creado en RedesDB.';
END
ELSE
BEGIN
    ALTER USER [redes_app] WITH LOGIN = [redes_app];
    PRINT N'El usuario redes_app ya existía y quedó asociado al login.';
END;
GO

GRANT CONNECT TO [redes_app];
GRANT SELECT ON dbo.OSI_LAYER TO [redes_app];
GRANT SELECT ON dbo.PROTOCOL TO [redes_app];
GRANT SELECT ON dbo.NETWORK_PORT TO [redes_app];
GO

PRINT N'Permisos de solo lectura asignados a redes_app.';
GO

