@echo off
setlocal

if "%DB_PASSWORD%"=="" (
    echo ERROR: Debe definir DB_PASSWORD antes de ejecutar el backend.
    echo Ejemplo: set "DB_PASSWORD=SU_PASSWORD_LOCAL"
    exit /b 1
)

if "%DB_USERNAME%"=="" set "DB_USERNAME=redes_app"
if "%DB_URL%"=="" set "DB_URL=jdbc:sqlserver://127.0.0.1:1433;databaseName=RedesDB;encrypt=true;trustServerCertificate=true;applicationName=OSI-Dev-Explorer"

if not exist "target\redes-backend.jar" (
    echo ERROR: No existe target\redes-backend.jar.
    echo Ejecute primero: mvn clean package
    exit /b 1
)

java -jar "target\redes-backend.jar"
