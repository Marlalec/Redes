# OSI Dev Explorer — Backend

API REST de solo lectura construida con Java 17, Spring Boot, Maven, Spring
Data JPA y Microsoft SQL Server. Es el proyecto independiente
`redes-backend` de OSI Dev Explorer.

## Estado de la Fase 3

Incluye:

- Arquitectura hexagonal con dominio Java independiente de Spring.
- Endpoints de capas OSI, protocolos, puertos y flujo de desarrollo.
- Persistencia JPA adaptada al esquema creado en `redes-database`.
- DTOs REST y mapeos manuales.
- Validación de parámetros y manejo global de errores.
- CORS limitado al frontend Vite durante desarrollo.
- Credenciales mediante variables de entorno.
- Pruebas de caso de uso, controladores y adaptador de persistencia.
- Script PowerShell de smoke test.

## Prerrequisitos

- Java JDK 17.
- Apache Maven 3.9 o superior.
- `RedesDB` creada y validada mediante los scripts de la Fase 2.
- Autenticación mixta de SQL Server habilitada.
- Login `redes_app` con permiso de consulta.
- TCP/IP habilitado para SQL Server en el puerto fijo 1433.

Verificar Java y Maven desde CMD:

```cmd
java -version
mvn -version
```

## Verificar SQL Server en el puerto 1433

Desde PowerShell:

```powershell
Test-NetConnection 127.0.0.1 -Port 1433
```

Debe mostrar:

```text
TcpTestSucceeded : True
```

Si aparece `False`, abrir `SQLServerManager17.msc` y configurar:

1. **SQL Server Network Configuration**.
2. **Protocols for MSSQLSERVER**, porque la instancia actual es la instancia
   predeterminada accesible como `localhost`.
3. Habilitar **TCP/IP**.
4. En las propiedades de TCP/IP abrir **IP Addresses**.
5. En `IPAll`, dejar `TCP Dynamic Ports` vacío.
6. En `TCP Port`, escribir `1433`.
7. Reiniciar `SQL Server (MSSQLSERVER)`.

## Variables de entorno

La contraseña no está en el repositorio. Desde una ventana nueva de CMD situada
en `redes-backend`, definir las variables solo para esa sesión:

```cmd
set "DB_URL=jdbc:sqlserver://127.0.0.1:1433;databaseName=RedesDB;encrypt=true;trustServerCertificate=true;applicationName=OSI-Dev-Explorer"
set "DB_USERNAME=redes_app"
set "DB_PASSWORD=SU_CONTRASENA_LOCAL"
```

No escribir ni compartir la contraseña real en capturas, commits o mensajes.

## Compilar y probar

Desde la raíz `redes-backend`:

```cmd
mvn clean test
mvn clean package
```

El segundo comando genera:

```text
redes-backend/target/redes-backend.jar
```

## Ejecutar

Opción directa:

```cmd
java -jar target\redes-backend.jar
```

Opción con validaciones previas:

```cmd
scripts\run-local.cmd
```

El inicio correcto contiene mensajes equivalentes a:

```text
Tomcat started on port 8080
Started RedesApplication
```

La API escucha únicamente en `127.0.0.1:8080` por defecto. Esto cumple el
despliegue donde IIS es el punto de entrada público.

## Probar la API

Con el backend en ejecución, abrir otra ventana de CMD:

```cmd
curl.exe http://127.0.0.1:8080/api/osi-layers
curl.exe http://127.0.0.1:8080/api/protocols
curl.exe http://127.0.0.1:8080/api/ports
curl.exe http://127.0.0.1:8080/api/ports/443
curl.exe http://127.0.0.1:8080/api/development-flow
```

También puede ejecutarse la validación automática desde PowerShell:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\smoke-test.ps1
```

El último mensaje esperado es:

```text
SMOKE TEST COMPLETADO CORRECTAMENTE
```

## Configuración para React local

Vite se ejecutará en `http://localhost:5173`. Ese origen ya está permitido.
Si se utiliza otro origen durante desarrollo:

```cmd
set "CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173"
```

En producción IIS entrega React y redirige `/api` bajo el mismo origen. Por
ello no se necesita abrir CORS hacia direcciones arbitrarias.

## Manejo de errores

Ejemplo:

```cmd
curl.exe http://127.0.0.1:8080/api/ports/9999
```

Respuesta esperada:

```json
{
  "status": 404,
  "message": "No se encontró el puerto 9999"
}
```

La respuesta real añade `timestamp`, `error` y `path` para facilitar el
diagnóstico sin exponer información interna.

## Solución de errores comunes

### `Connection refused` o espera agotada

SQL Server no escucha en TCP 1433. Ejecutar `Test-NetConnection` y revisar
TCP/IP en SQL Server Configuration Manager.

### `Login failed for user 'redes_app'` o error 18456

Verificar la contraseña, que el modo mixto esté habilitado y que SQL Server se
haya reiniciado después del cambio.

### Error de certificado

La URL local incluye `encrypt=true;trustServerCertificate=true`, apropiado para
el certificado autofirmado de desarrollo. En un despliegue con certificado
válido debe configurarse la confianza real y retirar esa excepción.

### `Schema-validation` al iniciar

No cambiar a `ddl-auto=update`. Ejecutar y validar nuevamente los scripts de
`redes-database`; el backend no debe alterar el esquema.

### Puerto 8080 ocupado

Identificar el proceso:

```cmd
netstat -ano | findstr :8080
```

No cambiar el puerto definitivo sin actualizar también la regla de reverse
proxy de IIS.

## Documentación

- `docs/ARCHITECTURE.md`: límites y flujo de la arquitectura hexagonal.
- `docs/API.md`: contrato JSON y estados HTTP.
- `docs/VALIDATION.md`: pruebas ejecutadas y validación pendiente en Windows.

## Criterio de finalización

La Fase 3 se aprueba cuando:

1. `mvn clean package` termina con `BUILD SUCCESS`.
2. La aplicación inicia conectada a `RedesDB`.
3. Los cinco endpoints devuelven HTTP 200.
4. `/api/ports/443` devuelve HTTPS, TCP y la capa Aplicación.
5. `/api/ports/9999` devuelve HTTP 404 con un mensaje claro.
6. El smoke test termina correctamente.
