# Contrato REST

Base local:

```text
http://127.0.0.1:8080
```

En producción el consumidor utiliza el mismo origen publicado por IIS:

```text
http://IP-SERVIDOR/api
```

## Endpoints

| Método | Ruta | Resultado |
|---|---|---|
| GET | `/api/health` | Diagnóstico público del backend |
| GET | `/api/auth/csrf` | Token CSRF para operaciones POST |
| POST | `/api/auth/login` | Valida credenciales e inicia la sesión |
| GET | `/api/auth/session` | Usuario de la sesión actual |
| POST | `/api/auth/logout` | Cierra e invalida la sesión |
| GET | `/api/osi-layers` | Siete capas, ordenadas de 7 a 1 |
| GET | `/api/osi-layers/{id}` | Capa identificada por su llave primaria |
| GET | `/api/protocols` | Protocolos ordenados alfabéticamente |
| GET | `/api/protocols/{id}` | Protocolo identificado por su llave primaria |
| GET | `/api/ports` | Puertos ordenados ascendentemente |
| GET | `/api/ports/{number}` | Puerto consultado por número lógico |
| GET | `/api/development-flow` | Flujo y aplicación académica del modelo OSI |

Los endpoints educativos requieren autenticación. Solo `/api/health`,
`/api/auth/csrf` y `/api/auth/login` son públicos. Las consultas educativas
siguen siendo de solo lectura.

## Inicio de sesión

Antes de un `POST`, consulta `/api/auth/csrf` y envía el valor recibido en el
encabezado indicado por `headerName`. El login recibe:

```json
{
  "email": "admin@osidev.local",
  "password": "contraseña configurada en APP_ADMIN_PASSWORD"
}
```

La respuesta devuelve `id`, `email`, `displayName` y `role`. La cookie de
sesión es `HttpOnly`, por lo que JavaScript no accede a su contenido.

## Ejemplo: puerto 443

Solicitud:

```http
GET /api/ports/443
Accept: application/json
```

Respuesta representativa:

```json
{
  "id": 9,
  "port": 443,
  "service": "HTTPS",
  "transportProtocol": "TCP",
  "osiLayer": {
    "id": 7,
    "number": 7,
    "name": "Aplicación"
  },
  "description": "Puerto estándar para comunicación web cifrada mediante HTTP sobre TLS.",
  "protocol": {
    "id": 6,
    "name": "HTTPS"
  },
  "developmentExample": "IIS puede proteger la comunicación entre React y la API publicando el sitio mediante HTTPS."
}
```

Los identificadores dependen de la base creada; el contrato no depende de que
un protocolo tenga un identificador numérico específico.

## Códigos HTTP

| Estado | Uso |
|---:|---|
| 200 | Consulta exitosa |
| 204 | Cierre de sesión exitoso |
| 400 | Parámetro inválido, por ejemplo un puerto fuera de 1–65535 |
| 401 | No existe sesión o las credenciales no son correctas |
| 403 | La operación no está permitida o falta un CSRF válido |
| 404 | Capa, protocolo, puerto o ruta inexistente |
| 503 | SQL Server no está disponible o la consulta falló |
| 500 | Error interno no esperado |

Ejemplo de recurso inexistente:

```json
{
  "timestamp": "2026-08-23T20:00:00Z",
  "status": 404,
  "error": "Not Found",
  "message": "No se encontró el puerto 9999",
  "path": "/api/ports/9999"
}
```

## Flujo de desarrollo

`GET /api/development-flow` devuelve:

- `steps`: Usuario → Navegador → IIS → React → HTTP/REST/JSON → Spring Boot → JDBC/TDS/TCP → SQL Server.
- `osiLayers`: participación y aclaraciones de las siete capas.
- `ports`: 80, 443, 8080 y 1433 con su alcance.
- `technicalNotes`: precisiones para no presentar REST, JSON, JDBC o TCP/IP de manera incorrecta.
