# OSI Dev Explorer — Frontend

Aplicación educativa construida con React, TypeScript y Vite. Consume
exclusivamente la API REST de `redes-backend`; nunca se conecta directamente a
SQL Server.

## Requisitos

- Node.js 20.19+, 22.13+ o una versión posterior compatible con Vite 8.
- npm 10 o superior.
- `redes-backend` ejecutándose en `127.0.0.1:8080`.
- SQL Server disponible para el backend en `127.0.0.1:1433`.

## Ejecución local

Desde PowerShell:

```powershell
Set-Location "C:\Users\marlo\Documents\Redes\redes-frontend"
npm install
npm run dev
```

Abrir:

```text
http://127.0.0.1:5173
```

Vite recibe las llamadas `/api/*` y las reenvía durante el desarrollo hacia:

```text
http://127.0.0.1:8080
```

Esto permite que el frontend utilice siempre rutas relativas. En producción,
IIS realizará el mismo trabajo como reverse proxy.

## Compilación

```powershell
npm run build
```

La salida estática se genera en:

```text
dist\
```

El contenido de `dist` será publicado en IIS durante la Fase 6.

## Rutas de la interfaz

| Ruta | Función |
|---|---|
| `/login` | Inicio de sesión con el usuario almacenado en SQL Server |
| `/` | Flujo real React → Spring Boot → SQL Server |
| `/modelo-osi` | Capas OSI y protocolos relacionados |
| `/protocolos` | Catálogo, búsqueda por nombre y detalle desplegable |
| `/puertos` | Tabla paginada, búsqueda por servicio y detalle desplegable |

Salvo `/login`, las rutas requieren una sesión válida. El backend conserva la
sesión en una cookie `HttpOnly` y el frontend envía un token CSRF en las
operaciones `POST` de acceso y cierre de sesión.

## Separación de responsabilidades

```text
pages/components → services → /api → Spring Boot
```

- `models`: contratos TypeScript equivalentes a los DTO del backend.
- `services`: todas las operaciones HTTP.
- `hooks`: estado reutilizable de carga, error y reintento.
- `components`: elementos visuales reutilizables.
- `pages`: composición de cada pantalla.
- `routes`: navegación de la SPA.

## Configuración opcional de API

El valor normal es `/api`. Solo si el backend se expone en otra dirección se
puede crear un archivo `.env.local`:

```properties
VITE_API_BASE_URL=http://127.0.0.1:8080/api
```

No se deben guardar contraseñas ni credenciales en archivos `.env` del
frontend.

## Verificación manual

1. Confirmar que Spring Boot continúa ejecutándose en el puerto 8080.
2. Definir `APP_ADMIN_PASSWORD` al arrancar el backend.
3. Ejecutar `npm run dev` e iniciar sesión.
4. Abrir las cuatro rutas desde la barra de navegación.
5. Buscar `HTTP` en Protocolos.
6. Buscar `HTTPS` en Puertos y revisar su detalle.
7. Verificar que Modelo OSI muestre siete capas.
8. Verificar que Inicio muestre ocho pasos y los puertos 80, 443,
   8080 y 1433.
9. Cerrar sesión y confirmar el regreso a `/login`.
10. Detener Vite con `Ctrl + C`.
