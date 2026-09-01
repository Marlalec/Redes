#!/usr/bin/env bash
set -Eeuo pipefail

DB_HOST="${DB_HOST:-sqlserver}"

if [[ -x /opt/mssql-tools18/bin/sqlcmd ]]; then
    SQLCMD=/opt/mssql-tools18/bin/sqlcmd
elif [[ -x /opt/mssql-tools/bin/sqlcmd ]]; then
    SQLCMD=/opt/mssql-tools/bin/sqlcmd
else
    echo "ERROR: sqlcmd no esta disponible en la imagen de SQL Server." >&2
    exit 1
fi

: "${MSSQL_SA_PASSWORD:?MSSQL_SA_PASSWORD es obligatoria}"
: "${DB_PASSWORD:?DB_PASSWORD es obligatoria}"

if [[ "$MSSQL_SA_PASSWORD" == CAMBIAR_* || "$DB_PASSWORD" == CAMBIAR_* ]]; then
    echo "ERROR: reemplaza las contrasenas de ejemplo o ejecuta iniciar-docker.cmd." >&2
    exit 1
fi

if (( ${#MSSQL_SA_PASSWORD} < 12 || ${#DB_PASSWORD} < 12 )); then
    echo "ERROR: las contrasenas deben tener al menos 12 caracteres." >&2
    exit 1
fi

if [[ ! "$DB_PASSWORD" =~ ^[A-Za-z0-9@%_+=.!-]+$ ]]; then
    echo "ERROR: DB_PASSWORD contiene caracteres no admitidos por el inicializador." >&2
    echo "Usa letras, numeros y alguno de estos simbolos: @ % _ + = . ! -" >&2
    exit 1
fi

COMMON_ARGS=(-S "$DB_HOST" -U sa -C -b -r 1)

run_as_sa() {
    SQLCMDPASSWORD="$MSSQL_SA_PASSWORD" "$SQLCMD" "${COMMON_ARGS[@]}" "$@"
}

echo "Esperando a que SQL Server acepte conexiones..."
for attempt in {1..60}; do
    if run_as_sa -Q "SELECT 1" -o /dev/null 2>/dev/null; then
        break
    fi

    if [[ "$attempt" -eq 60 ]]; then
        echo "ERROR: SQL Server no estuvo disponible dentro del tiempo esperado." >&2
        exit 1
    fi

    sleep 2
done

run_script() {
    local script="$1"
    echo "Ejecutando $(basename "$script")..."
    run_as_sa -i "$script"
}

run_script /database/01-create-database.sql
run_script /database/02-create-tables.sql
run_script /database/03-insert-initial-data.sql

echo "Creando o actualizando el login de solo lectura redes_app..."
run_as_sa \
    -v "AppPassword=$DB_PASSWORD" \
    -i /docker-init/04-create-app-login.docker.sql

echo "Ejecutando validaciones funcionales de la base..."
run_script /database/05-queries-demo.sql

echo "Verificando la conexion con el usuario de la aplicacion..."
SQLCMDPASSWORD="$DB_PASSWORD" "$SQLCMD" \
    -S "$DB_HOST" -U redes_app -d RedesDB -C -b -r 1 \
    -Q "SET NOCOUNT ON; SELECT COUNT(*) AS osi_layer_count FROM dbo.OSI_LAYER;" \
    -o /tmp/redes-app-validation.txt

cat /tmp/redes-app-validation.txt
echo "BASE DE DATOS INICIALIZADA Y VALIDADA CORRECTAMENTE"
