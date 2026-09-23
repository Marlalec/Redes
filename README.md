# OSI Dev Explorer

Aplicación educativa de redes con React, Spring Boot, SQL Server y verificación facial 1:1 mediante una cámara JOOAN por RTSP.

## Componentes

| Componente | Tecnología | Acceso local |
|---|---|---|
| Frontend | React y Nginx | `http://127.0.0.1:5173` |
| Backend | Spring Boot y Java 17 | `http://127.0.0.1:8080` |
| Reconocimiento facial | Python, FastAPI y OpenCV | red interna Docker, puerto `8090` |
| Base de datos | SQL Server Developer | `127.0.0.1,14330` |
| Cámara | RTSP | host y puerto configurados en `.env` |

## Ejecución con Docker

Requisitos:

- Windows 10 u 11 de 64 bits.
- Docker Desktop con contenedores Linux.
- Cámara y computador conectados a la misma red.
- Puertos `5173`, `8080` y `14330` disponibles.

Desde la carpeta raíz ejecuta:

```powershell
.\iniciar-docker.cmd
```

El script crea `.env`, solicita las credenciales RTSP, construye los servicios y muestra las credenciales del administrador.

Para detener el ambiente:

```powershell
docker compose down
```

Para consultar el estado y los registros:

```powershell
docker compose ps
docker compose logs --tail 120
```

## Frontend para IIS

Genera el frontend estático:

```powershell
Set-Location .\redes-frontend
npm ci
npm run build
```

Copia el contenido de `redes-frontend\dist` al directorio físico configurado en IIS. El archivo `public\web.config` se incorpora al build y permite resolver las rutas de React mediante IIS URL Rewrite.

El frontend estático no requiere Node.js, Java, Python, SQL Server ni Docker en el servidor IIS. Las funciones de autenticación, datos, vigilancia y reconocimiento facial requieren acceso al backend mediante `/api`.

## Validación del código

Frontend:

```powershell
Set-Location .\redes-frontend
npm ci
npm run build
```

Backend:

```powershell
Set-Location .\redes-backend
mvn clean verify
```

Servicio facial:

```powershell
Set-Location .\facial-service
python -m unittest discover -s tests -v
```

## Configuración privada

Los archivos `.env`, las credenciales RTSP, las contraseñas, las claves biométricas y las plantillas faciales no forman parte del repositorio. `.env.example` contiene únicamente valores de referencia.
