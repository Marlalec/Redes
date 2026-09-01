/*
    Variante para Docker del script 04-create-app-login.template.sql.
    La contraseña llega como variable sqlcmd AppPassword desde el contenedor
    db-init; nunca se almacena en este archivo.
*/

USE [master];
GO

SET NOCOUNT ON;
GO

DECLARE @Password NVARCHAR(128) = N'$(AppPassword)';

IF LEN(@Password) < 12
    THROW 51010, N'La contraseña de redes_app debe tener al menos 12 caracteres.', 1;

DECLARE @LoginSql NVARCHAR(MAX);

IF SUSER_ID(N'redes_app') IS NULL
BEGIN
    SET @LoginSql =
        N'CREATE LOGIN [redes_app] WITH PASSWORD = N'''
        + REPLACE(@Password, N'''', N'''''' )
        + N''', CHECK_POLICY = ON, CHECK_EXPIRATION = OFF;';

    EXEC sys.sp_executesql @LoginSql;
    PRINT N'Login redes_app creado correctamente.';
END
ELSE
BEGIN
    SET @LoginSql =
        N'ALTER LOGIN [redes_app] WITH PASSWORD = N'''
        + REPLACE(@Password, N'''', N'''''' )
        + N''', CHECK_POLICY = ON, CHECK_EXPIRATION = OFF;';

    EXEC sys.sp_executesql @LoginSql;
    PRINT N'Login redes_app actualizado correctamente.';
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
    PRINT N'Usuario redes_app asociado al login existente.';
END;
GO

GRANT CONNECT TO [redes_app];
GRANT SELECT ON dbo.OSI_LAYER TO [redes_app];
GRANT SELECT ON dbo.PROTOCOL TO [redes_app];
GRANT SELECT ON dbo.NETWORK_PORT TO [redes_app];
GO

PRINT N'Permisos de solo lectura asignados a redes_app.';
GO
