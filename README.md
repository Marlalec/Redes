# OSI Dev Explorer — fase de autenticación facial

Aplicación educativa de redes con React, Spring Boot, SQL Server y verificación
facial 1:1 mediante una cámara JOOAN conectada por RTSP a la red interna.

## Qué quedó integrado

- Inicio de sesión con correo y contraseña.
- Registro facial voluntario desde **Seguridad facial**.
- Segundo factor automático para las cuentas que ya tengan una plantilla.
- Vista RTSP en vivo durante el segundo factor y progreso visual del escaneo.
- Detección YuNet, representación SFace y comparación 1:1.
- Captura de varias muestras, filtro de nitidez y un control básico de movimiento.
- Máximo de tres no coincidencias por desafío y expiración a los cinco minutos.
- Plantillas matemáticas cifradas en un volumen local; no se guardan fotografías.
- Servicio facial aislado: el navegador nunca recibe la URL ni las credenciales RTSP.

La primera entrada de un usuario que todavía no tenga plantilla se completa solo con
contraseña. Esto permite entrar, abrir **Seguridad facial** y realizar el registro. A
partir de ese momento, los accesos posteriores solicitan ambos factores.

## Arquitectura

| Componente | Tecnología | Acceso |
|---|---|---|
| Web | React + Nginx | `http://127.0.0.1:5173` |
| API y sesiones | Spring Boot 3 + Java 17 | `http://127.0.0.1:8080` |
| Reconocimiento | Python 3.12 + OpenCV | solo red Docker, puerto `8090` |
| Datos educativos | SQL Server Developer | `127.0.0.1,14330` |
| Cámara | JOOAN RTSP | IP definida en `CAMERA_HOST`, puerto `554` |

Flujo de acceso protegido:

```text
React → contraseña → Spring Security → usuario con plantilla
      → verificación interna → Python/OpenCV → RTSP/JOOAN
      → coincidencia 1:1 → creación de la sesión autenticada
```

## Requisitos locales

- Windows 10/11 de 64 bits.
- Docker Desktop iniciado, con contenedores Linux y WSL 2.
- PC y cámara conectados a la misma red interna.
- La cámara debe responder en RTSP; el proyecto usa por defecto `/live/ch00_0`.
- Al menos 4 GB de memoria para Docker.
- Puertos `5173`, `8080` y `14330` disponibles en Windows.

No se necesita tarjeta microSD: el reconocimiento procesa la transmisión en vivo.

Comprueba Docker:

```powershell
docker --version
docker compose version
docker info
```

La conectividad con la JOOAN puede validarse así:

```powershell
Test-Connection 192.168.1.27 -Count 2
Test-NetConnection 192.168.1.27 -Port 554
```

## Inicio en un solo comando

Abre PowerShell en la carpeta `Redes` y ejecuta:

```powershell
.\iniciar-docker.cmd
```

En la primera ejecución, el script:

1. crea un `.env` local excluido de Git;
2. genera contraseñas y claves aleatorias;
3. solicita el usuario y la contraseña RTSP sin mostrar esta última;
4. inicia SQL Server, el inicializador, el servicio facial, Spring Boot y React;
5. comprueba la salud de la aplicación;
6. muestra las credenciales del administrador web.

Cuando aparezca `AMBIENTE INICIADO CORRECTAMENTE`, abre:

```text
http://127.0.0.1:5173
```

El correo predeterminado es `admin@osidev.local`. La contraseña real se muestra al
terminar y queda únicamente en el archivo local `.env`.

## Registrar el primer rostro

1. Inicia sesión con el correo y la contraseña.
2. Abre **Seguridad facial** en la navegación.
3. Ubícate frente a la cámara con un solo rostro visible y buena luz.
4. Acepta el consentimiento de tratamiento biométrico.
5. Presiona **Registrar mi rostro**.
6. Mira al frente y mueve lentamente la cabeza hacia ambos lados.

La operación tarda normalmente entre 3 y 14 segundos. Al cerrar sesión y volver a
entrar, la web mostrará el segundo paso facial después de validar la contraseña. En
ese paso muestra la vista en vivo únicamente después de pulsar **Verificar mi
rostro**, junto con el avance de las muestras procesadas.

## Privacidad y seguridad

- La comparación es 1:1: nunca se busca una cara entre todas las personas.
- Los fotogramas no se escriben a disco. La vista web recibe imágenes JPEG efímeras
  solamente durante una sesión o desafío autorizado y las descarta al cerrar la vista.
- La plantilla SFace se cifra con Fernet antes de guardarse.
- La clave, el token interno y las credenciales RTSP viven en `.env`, nunca en Git.
- El servicio facial no publica su puerto en Windows.
- El usuario puede reemplazar o eliminar su plantilla desde la aplicación.

El control de movimiento incluido es una demostración y no constituye detección de
vida certificada. Para control de acceso real se requiere PAD/anti-spoofing evaluado,
HTTPS, una política de retención, consentimiento conforme a la legislación aplicable
y un método de recuperación que no dependa del rostro.

## Comandos útiles

Estado de todos los servicios:

```powershell
docker compose ps
```

Logs relevantes:

```powershell
docker compose logs -f facial-service
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f sqlserver
```

Reconstruir después de cambiar código:

```powershell
.\iniciar-docker.cmd
```

Reiniciar sin construir imágenes:

```powershell
.\iniciar-docker.cmd -NoBuild
```

Detener conservando base y plantillas:

```powershell
docker compose down
```

## Recuperación si la cámara queda fuera de servicio

Un administrador del servidor puede desactivar temporalmente el segundo factor
cambiando en `.env`:

```properties
FACIAL_SERVICE_ENABLED=false
```

Después debe reconstruir el backend:

```powershell
docker compose up -d --build backend frontend
```

Esto es un mecanismo de recuperación administrativa y reduce la cuenta a contraseña;
debe volver a `true` tan pronto se recupere la cámara.

Para borrar **todas** las plantillas de forma irreversible:

```powershell
docker compose down
docker volume rm osi-dev-explorer-facial-templates
.\iniciar-docker.cmd
```

El volumen de SQL Server no se elimina con esos comandos.

## Pruebas

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

Servicio facial nativo:

```powershell
Set-Location .\facial-service
.\.venv\Scripts\Activate.ps1
python -m unittest discover -s tests -v
```

El smoke test de la API funciona para un usuario sin plantilla. Si ya existe segundo
factor, se detiene deliberadamente porque no intenta automatizar ni evadir biometría.

## Windows Server 2016

El Compose incluido es ideal para desarrollo en Windows 10/11. Para el servidor 2016
de la red interna se recomienda el despliegue híbrido descrito en
[`DESPLIEGUE_WINDOWS_SERVER_2016.md`](DESPLIEGUE_WINDOWS_SERVER_2016.md), porque Docker
Desktop y los contenedores Linux no son una base soportada equivalente en ese sistema.
