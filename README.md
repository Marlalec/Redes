# OSI Dev Explorer — ambiente completo con Docker

El proyecto puede levantarse completo con un solo comando. Docker ejecuta:

1. SQL Server 2025 Developer.
2. La creación y carga automática de `RedesDB`.
3. La creación del usuario `redes_app` con permisos de solo lectura.
4. La API Spring Boot en Java 17.
5. El frontend React compilado y publicado con Nginx.

No necesitas instalar Java, Maven, Node.js ni SQL Server para usar esta modalidad.

## Requisitos

- Windows 10/11 de 64 bits.
- Docker Desktop con contenedores Linux y WSL 2.
- Al menos 4 GB de memoria asignada a Docker.
- Puertos `5173` y `8080` disponibles.

Verifica desde PowerShell:

```powershell
docker --version
docker compose version
docker info
```

## Inicio rápido

Abre PowerShell en la carpeta `Redes` y ejecuta:

```powershell
.\iniciar-docker.cmd
```

En la primera ejecución el script:

- crea `.env` con dos contraseñas aleatorias fuertes;
- construye frontend y backend;
- descarga las imágenes oficiales;
- espera a que SQL Server esté listo;
- crea tablas y datos de prueba;
- valida los 7 registros de capas, 15 protocolos y 13 puertos;
- espera hasta que la aplicación responda correctamente.

La primera construcción puede tardar varios minutos. Las siguientes son más rápidas.

Cuando aparezca `AMBIENTE INICIADO CORRECTAMENTE`, abre:

```text
http://127.0.0.1:5173
```

## Servicios y puertos

| Servicio | Puerto en Windows | Puerto en Docker | Uso |
|---|---:|---:|---|
| React + Nginx | `5173` | `80` | Aplicación web y proxy de `/api` |
| Spring Boot | `8080` | `8080` | Acceso directo para diagnóstico |
| SQL Server | `14330` | `1433` | Acceso opcional desde SSMS |

SQL Server se publica en `14330` para no chocar con una instalación local que ya utilice `1433`. Dentro de Docker, Spring Boot siempre se conecta a `sqlserver:1433`.

## Flujo del ambiente

```text
Navegador :5173
    → Nginx :80
        → /api → Spring Boot :8080
            → JDBC/TDS → SQL Server :1433
```

El navegador utiliza una sola dirección. Nginx entrega React y reenvía internamente las solicitudes `/api`, por lo que el frontend no conoce credenciales ni se conecta directamente a la base.

## Comandos útiles

Ver el estado:

```powershell
docker compose ps
```

Ver todos los logs:

```powershell
docker compose logs -f
```

Ver solo un servicio:

```powershell
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f sqlserver
docker compose logs db-init
```

Detener y eliminar los contenedores, conservando la base:

```powershell
docker compose down
```

Volver a iniciar sin reconstruir imágenes:

```powershell
.\iniciar-docker.cmd -NoBuild
```

Reconstruir después de modificar código:

```powershell
.\iniciar-docker.cmd
```

## Validación rápida

Con el ambiente iniciado:

```powershell
(Invoke-RestMethod http://127.0.0.1:5173/api/osi-layers).Count
(Invoke-RestMethod http://127.0.0.1:5173/api/protocols).Count
(Invoke-RestMethod http://127.0.0.1:5173/api/ports).Count
```

Debe devolver, en orden:

```text
7
15
13
```

También puedes abrir directamente:

```text
http://127.0.0.1:8080/api/ports/443
```

## Conexión opcional desde SSMS

Usa:

```text
Servidor: 127.0.0.1,14330
Autenticación: SQL Server
Usuario: sa
Contraseña: valor MSSQL_SA_PASSWORD del archivo .env
```

El backend no utiliza `sa`; se conecta con `redes_app`, que solo puede consultar las tres tablas educativas.

## Credenciales

El archivo `.env` se genera únicamente en tu equipo y está excluido por `.gitignore`. No lo subas a Git ni lo compartas.

Si necesitas definir valores manuales, copia `.env.example` como `.env`, cambia las dos contraseñas y conserva al menos 12 caracteres con mayúscula, minúscula, número y símbolo.

## Cambiar puertos

Si `5173` u `8080` están ocupados por la ejecución local anterior, detén esas terminales con `Ctrl + C` o cambia en `.env`:

```properties
FRONTEND_PORT=5174
BACKEND_PORT=8081
SQLSERVER_PORT=14330
```

Luego ejecuta nuevamente `iniciar-docker.cmd` y abre el nuevo puerto del frontend.

## Reiniciar completamente la base

Esta operación elimina los datos persistidos del SQL Server Docker:

```powershell
docker compose down --volumes
.\iniciar-docker.cmd
```

Los scripts son idempotentes y volverán a crear `RedesDB` con sus datos iniciales.

## Estructura Docker agregada

| Archivo | Responsabilidad |
|---|---|
| `compose.yaml` | Orquesta los cuatro servicios y el volumen persistente |
| `iniciar-docker.cmd` | Entrada de un comando para Windows |
| `iniciar-docker.ps1` | Genera secretos, inicia y valida el ambiente |
| `redes-backend/Dockerfile` | Compila, prueba y ejecuta Spring Boot |
| `redes-frontend/Dockerfile` | Compila React y genera la imagen Nginx |
| `redes-frontend/nginx.conf` | SPA, proxy `/api` y endpoint de salud |
| `docker/sqlserver/init-db.sh` | Ejecuta los scripts SQL en orden |

La ejecución local tradicional con Java, npm y el SQL Server instalado en Windows sigue disponible; Docker es una modalidad adicional.
