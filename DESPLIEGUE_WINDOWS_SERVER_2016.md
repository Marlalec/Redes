# Despliegue recomendado en Windows Server 2016

Para la red interna se recomienda un despliegue híbrido nativo:

| Capa | Instalación recomendada |
|---|---|
| Frontend | build de React publicado como sitio estático en IIS |
| Proxy | IIS URL Rewrite + Application Request Routing para `/api` |
| Backend | JRE 17 y el JAR como servicio de Windows mediante WinSW o NSSM |
| Facial | Python 3.12 y Uvicorn como servicio local de Windows |
| Base | SQL Server instalado en el servidor o en un host interno dedicado |
| Cámara | IP fija/reserva DHCP, RTSP permitido solo desde el servidor |

Docker Desktop está orientado a Windows cliente. Windows Server 2016 tampoco ofrece el
mismo camino sencillo para ejecutar estos contenedores Linux, por eso IIS y servicios
nativos reducen incompatibilidades en este caso.

## Topología interna

- Los clientes acceden únicamente a IIS mediante HTTPS `443`.
- IIS entrega React y reenvía `/api` a `127.0.0.1:8080`.
- Spring Boot llama al servicio facial en `127.0.0.1:8090`.
- Solo el servicio facial puede llegar a `CAMERA_IP:554`.
- Spring Boot llega a SQL Server en `1433`.
- No se publican `8080`, `8090`, `1433` ni `554` hacia otras redes.

## Software necesario

1. IIS con Static Content, URL Rewrite y ARR.
2. Java 17 JRE de 64 bits.
3. Python 3.12 de 64 bits.
4. SQL Server y el controlador JDBC incluido en el JAR.
5. WinSW o NSSM para mantener Java y Uvicorn como servicios.
6. Certificado TLS emitido por la autoridad interna de la organización.

## Variables secretas

Configura fuera de la carpeta pública de IIS:

- `DB_PASSWORD`
- `APP_ADMIN_PASSWORD`
- `CAMERA_USERNAME`
- `CAMERA_PASSWORD`
- `FACE_INTERNAL_TOKEN`
- `FACE_DATA_KEY`

La cuenta que ejecuta el servicio facial debe tener acceso de lectura a los modelos y
lectura/escritura solo al directorio de plantillas. Haz respaldo conjunto de la clave y
las plantillas: perder la clave vuelve inutilizables los vectores cifrados.

## Validación previa

Antes de abrir el sistema a usuarios, valida desde el propio servidor:

```powershell
Test-NetConnection 127.0.0.1 -Port 8080
Test-NetConnection 127.0.0.1 -Port 8090
Test-NetConnection 192.168.1.27 -Port 554
Test-NetConnection SQL_SERVER_INTERNO -Port 1433
```

Después verifica en un cliente de la LAN que solo el puerto HTTPS de IIS sea accesible.
