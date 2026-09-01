# OSI Dev Explorer — Base de datos

Proyecto independiente de SQL Server para la aplicación universitaria **OSI Dev Explorer**.

La base de datos contiene información educativa sobre:

- Las siete capas del modelo OSI.
- Protocolos de red y su asociación pedagógica con el modelo OSI.
- Puertos lógicos y servicios relacionados.
- Ejemplos aplicados al flujo React → IIS → Spring Boot → SQL Server.

## Modelo

```text
OSI_LAYER
    1
    └── N PROTOCOL
              1
              └── N NETWORK_PORT
```

La información del transporte de un puerto se obtiene mediante la relación:

```text
NETWORK_PORT → PROTOCOL.transport_type
```

Esto evita almacenar valores duplicados y potencialmente inconsistentes.

## Archivos

| Orden | Archivo | Función |
|---:|---|---|
| 1 | `01-create-database.sql` | Crea `RedesDB` si todavía no existe |
| 2 | `02-create-tables.sql` | Crea tablas, restricciones, llaves e índices |
| 3 | `03-insert-initial-data.sql` | Inserta o actualiza capas, protocolos y puertos |
| 4 | `04-create-app-login.template.sql` | Plantilla para crear `redes_app` con solo lectura |
| 5 | `05-queries-demo.sql` | Consultas de exposición y validaciones automáticas |

Los tres primeros scripts son seguros para reejecución: no duplican datos ni vuelven a crear objetos existentes.

## Prerrequisitos

- Microsoft SQL Server 2022 Express o una edición superior.
- SQL Server Management Studio compatible, Azure Data Studio existente o `sqlcmd`.
- Una cuenta con permisos para crear bases de datos y logins.
- SQL Server Database Engine en ejecución.

## Ejecución recomendada con SSMS

1. Abrir SQL Server Management Studio.
2. Conectarse a `localhost\SQLEXPRESS` utilizando autenticación de Windows.
3. Abrir `01-create-database.sql` y ejecutarlo.
4. Ejecutar `02-create-tables.sql`.
5. Ejecutar `03-insert-initial-data.sql`.
6. Confirmar que SQL Server utiliza autenticación mixta.
7. Preparar y ejecutar el script del usuario de aplicación.
8. Ejecutar `05-queries-demo.sql`.

Cada archivo contiene `USE` y `GO`, por lo que no es necesario seleccionar manualmente la base antes de ejecutarlo.

## Ejecución desde PowerShell o CMD

Desde la carpeta `redes-database`:

```cmd
sqlcmd -S ".\SQLEXPRESS" -E -C -b -i "01-create-database.sql"
sqlcmd -S ".\SQLEXPRESS" -E -C -b -i "02-create-tables.sql"
sqlcmd -S ".\SQLEXPRESS" -E -C -b -i "03-insert-initial-data.sql"
sqlcmd -S ".\SQLEXPRESS" -E -C -b -i "05-queries-demo.sql"
```

Parámetros utilizados:

- `-S`: instancia de SQL Server.
- `-E`: autenticación integrada de Windows.
- `-C`: confiar en el certificado del servidor para este entorno académico.
- `-b`: devolver un código de error si falla un script.
- `-i`: archivo que se ejecutará.

Si la instancia tiene otro nombre, reemplazar `.\SQLEXPRESS` por el nombre real.

## Creación segura del usuario de aplicación

El archivo original es una plantilla y no contiene credenciales reales.

En PowerShell:

```powershell
Copy-Item .\04-create-app-login.template.sql .\04-create-app-login.local.sql
```

Abrir `04-create-app-login.local.sql` y reemplazar:

```text
<REPLACE_WITH_STRONG_PASSWORD>
```

por una contraseña de al menos 12 caracteres que cumpla la política de Windows. Después ejecutar la copia local:

```cmd
sqlcmd -S ".\SQLEXPRESS" -E -C -b -i "04-create-app-login.local.sql"
```

La copia local está excluida por `.gitignore`. Después de guardar la contraseña en la configuración segura del servidor, se recomienda eliminarla.

El usuario `redes_app` recibe únicamente:

```text
CONNECT en RedesDB
SELECT sobre dbo.OSI_LAYER
SELECT sobre dbo.PROTOCOL
SELECT sobre dbo.NETWORK_PORT
```

No tiene permisos de inserción, actualización, eliminación ni modificación del esquema.

### Habilitar autenticación mixta

El backend utilizará un login de SQL Server, por lo que la instancia debe aceptar autenticación de Windows y de SQL Server:

1. En SSMS, hacer clic derecho sobre la instancia y seleccionar **Properties**.
2. Abrir la sección **Security**.
3. Seleccionar **SQL Server and Windows Authentication mode**.
4. Guardar los cambios.
5. Reiniciar el servicio **SQL Server (SQLEXPRESS)**.

Si se seleccionó **Mixed Mode** durante la instalación de SQL Server Express, solamente es necesario verificar la configuración.

## Configurar TCP/IP y el puerto 1433

SQL Server Express suele utilizar puertos dinámicos. Para que Spring Boot se conecte explícitamente por TCP `1433`:

1. Abrir **SQL Server Configuration Manager**.
2. Ir a **SQL Server Network Configuration**.
3. Abrir **Protocols for SQLEXPRESS**.
4. Habilitar **TCP/IP**.
5. Abrir las propiedades de **TCP/IP**.
6. Ir a **IP Addresses**.
7. En **IPAll**, dejar **TCP Dynamic Ports** vacío.
8. En **TCP Port**, escribir `1433`.
9. Reiniciar el servicio **SQL Server (SQLEXPRESS)**.

Verificar desde PowerShell:

```powershell
Test-NetConnection 127.0.0.1 -Port 1433
```

El resultado esperado es:

```text
TcpTestSucceeded : True
```

Si SQL Server estará en la misma máquina que Spring Boot, no se debe abrir `1433` al resto de la red. La comunicación puede permanecer local.

## Connection string para Spring Boot

```text
jdbc:sqlserver://localhost:1433;databaseName=RedesDB;encrypt=true;trustServerCertificate=true
```

Las credenciales se suministrarán mediante variables de entorno:

```text
DB_URL
DB_USERNAME=redes_app
DB_PASSWORD
```

No se debe escribir la contraseña en `application.properties` ni subirla a Git.

## Resultado esperado

Después de ejecutar los scripts deben existir:

| Elemento | Cantidad mínima |
|---|---:|
| Capas OSI | 7 |
| Protocolos | 15 |
| Puertos | 13 |

Los protocolos adicionales `Ethernet`, `IPv4`, `TLS`, `TDS`, `MySQL Protocol` y `PostgreSQL Wire Protocol` permiten explicar correctamente las capas y los puertos de infraestructura.

## Verificación final

Ejecutar:

```text
05-queries-demo.sql
```

La última consulta debe devolver:

```text
validation_status | validation_message
OK                | Las tablas, relaciones, datos y permisos mínimos son consistentes.
```

También debe aparecer un registro para el puerto `443` con:

```text
service: HTTPS
transport_type: TCP
osi_layer_number: 7
osi_layer_name: Aplicación
```

## Criterio de finalización de la Fase 2

La fase se considera aprobada cuando:

- Los cinco scripts terminan sin errores.
- `05-queries-demo.sql` devuelve estado `OK`.
- `Test-NetConnection 127.0.0.1 -Port 1433` es exitoso.
- El usuario `redes_app` puede ejecutar `SELECT`.
- El usuario `redes_app` no puede modificar las tablas.
