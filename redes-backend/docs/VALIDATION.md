# Validación de la Fase 3

## Resultado automatizado

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

Las pruebas verifican:

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

## Límite verificado de arquitectura

Los paquetes `domain` y `application` compilaron de forma aislada y no
contienen imports de Spring, JPA, Jakarta Servlet ni SQL Server.

## Validación pendiente en el equipo de destino

La prueba contra `RedesDB` requiere la instancia SQL Server del usuario. Debe
ejecutarse en Windows después de confirmar:

```powershell
Test-NetConnection 127.0.0.1 -Port 1433
```

Luego se inicia el JAR con las variables `DB_URL`, `DB_USERNAME` y
`DB_PASSWORD`, y se ejecuta:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\smoke-test.ps1
```

Ese smoke test valida la comunicación real:

```text
HTTP → Spring Boot → JPA/JDBC → SQL Server
```
