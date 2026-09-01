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
| `/` | Presentación y estado de conexión con la API |
| `/modelo-osi` | Capas OSI y protocolos relacionados |
| `/protocolos` | Catálogo, búsqueda, detalle y puertos relacionados |
| `/puertos` | Tabla, búsqueda y detalle de puertos lógicos |
| `/osi-en-desarrollo` | Flujo real React → Spring Boot → SQL Server |

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
2. Ejecutar `npm run dev`.
3. Abrir las cinco rutas desde la barra de navegación.
4. Buscar `HTTP` en Protocolos.
5. Buscar `443` en Puertos y revisar su detalle.
6. Verificar que Modelo OSI muestre siete capas.
7. Verificar que OSI en desarrollo muestre ocho pasos y los puertos 80, 443,
   8080 y 1433.
8. Detener Vite con `Ctrl + C`.
