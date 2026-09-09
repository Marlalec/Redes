# Validación del backend

## Validación base existente

Comando ejecutado sobre una copia limpia del proyecto:

```text
mvn clean package
```

Resultado:

```text
Compilación principal: 44 archivos Java
Compilación de pruebas: 4 archivos Java
Pruebas ejecutadas: 10
Fallos: 0
Errores: 0
Omitidas: 0
Estado Maven: BUILD SUCCESS
Artefacto: target/redes-backend.jar
Java: 17
Spring Boot: 3.5.16
```

## Cobertura funcional mínima

Las pruebas existentes verifican:

- Caso de uso para consultar el puerto 443.
- Excepción de dominio para un puerto inexistente.
- Flujo Usuario → SQL Server y sus puertos.
- Adaptador JPA y conversión entidad → dominio.
- `GET /api/osi-layers`.
- `GET /api/protocols`.
- `GET /api/ports`.
- `GET /api/ports/443`.
- Respuesta 404 estructurada.
- `GET /api/development-flow`.

La incorporación del inicio de sesión añade además:

- Usuario web persistido en `APP_USER`.
- Contraseña almacenada exclusivamente como hash BCrypt.
- Sesión del servidor mediante cookie `HttpOnly`.
- Token CSRF obligatorio para los `POST` de acceso y cierre de sesión.
- Respuesta `401` para recursos educativos solicitados sin sesión.
- Endpoint público `GET /api/health` para Docker y diagnóstico.
- Pruebas unitarias de creación BCrypt del administrador y carga de su rol.

## Límite verificado de arquitectura

Los paquetes `domain` y `application` compilaron de forma aislada y no
contienen imports de Spring, JPA, Jakarta Servlet ni SQL Server.

## Validación pendiente en el equipo de destino

La prueba contra `RedesDB` requiere la instancia SQL Server del usuario. Debe
ejecutarse en Windows después de confirmar:

```powershell
Test-NetConnection 127.0.0.1 -Port 1433
```

Luego se inicia el JAR con `DB_URL`, `DB_USERNAME`, `DB_PASSWORD` y una
`APP_ADMIN_PASSWORD` de al menos 12 caracteres. Para ejecutar la prueba
autenticada:

```powershell
$env:APP_ADMIN_EMAIL = "admin@osidev.local"
$env:APP_ADMIN_PASSWORD = "SU_CONTRASENA_WEB"
powershell -ExecutionPolicy Bypass -File .\scripts\smoke-test.ps1
```

Ese smoke test valida la comunicación real:

```text
Login + sesión → HTTP → Spring Boot → JPA/JDBC → SQL Server
```

## Validación recomendada con Docker

Desde la raíz del repositorio:

```powershell
.\iniciar-docker.cmd
```

El `Dockerfile` del backend ejecuta las pruebas Maven durante la construcción.
El script espera la salud pública, obtiene el token CSRF, inicia sesión con el
administrador generado y confirma que `/api/osi-layers` devuelve siete capas.
