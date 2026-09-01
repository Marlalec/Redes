[CmdletBinding()]
param(
    [switch]$NoBuild
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$EnvFile = Join-Path $ProjectRoot ".env"
Set-Location $ProjectRoot

function New-StrongPassword {
    return "Aa1!" + [Guid]::NewGuid().ToString("N")
}

function Get-DotEnvValue {
    param(
        [Parameter(Mandatory = $true)][string]$Path,
        [Parameter(Mandatory = $true)][string]$Name,
        [string]$DefaultValue
    )

    $pattern = "^\s*" + [Regex]::Escape($Name) + "\s*=\s*(.*)\s*$"

    foreach ($line in Get-Content -LiteralPath $Path) {
        if ($line -match $pattern) {
            return $Matches[1].Trim().Trim('"').Trim("'")
        }
    }

    return $DefaultValue
}

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    throw "Docker no esta instalado o no aparece en PATH. Instala Docker Desktop y abre una PowerShell nueva."
}

& docker info *> $null
if ($LASTEXITCODE -ne 0) {
    throw "Docker Desktop no esta iniciado. Abre Docker Desktop, espera a que indique Engine running y vuelve a ejecutar este archivo."
}

& docker compose version *> $null
if ($LASTEXITCODE -ne 0) {
    throw "Docker Compose no esta disponible. Actualiza Docker Desktop y vuelve a intentarlo."
}

if (-not (Test-Path -LiteralPath $EnvFile)) {
    $saPassword = New-StrongPassword
    $appPassword = New-StrongPassword
    $content = @(
        "# Generado automaticamente por iniciar-docker.ps1. No compartir ni subir a Git."
        "MSSQL_SA_PASSWORD=$saPassword"
        "DB_PASSWORD=$appPassword"
        "FRONTEND_PORT=5173"
        "BACKEND_PORT=8080"
        "SQLSERVER_PORT=14330"
    )

    $utf8WithoutBom = New-Object System.Text.UTF8Encoding($false)
    [System.IO.File]::WriteAllLines($EnvFile, $content, $utf8WithoutBom)
    Write-Host "Configuracion local creada de forma segura en .env." -ForegroundColor Green
}

& docker compose config --quiet
if ($LASTEXITCODE -ne 0) {
    throw "La configuracion de Compose no es valida. Revisa el archivo .env y el mensaje anterior."
}

$composeArguments = @("compose", "up", "--detach")
if (-not $NoBuild) {
    $composeArguments += "--build"
}

Write-Host "Iniciando SQL Server, base de datos, backend y frontend..." -ForegroundColor Cyan
& docker @composeArguments
if ($LASTEXITCODE -ne 0) {
    throw "Docker no pudo iniciar el ambiente. Ejecuta: docker compose logs --tail 120"
}

$frontendPort = Get-DotEnvValue -Path $EnvFile -Name "FRONTEND_PORT" -DefaultValue "5173"
$backendPort = Get-DotEnvValue -Path $EnvFile -Name "BACKEND_PORT" -DefaultValue "8080"
$sqlServerPort = Get-DotEnvValue -Path $EnvFile -Name "SQLSERVER_PORT" -DefaultValue "14330"
$frontendUrl = "http://127.0.0.1:$frontendPort"
$deadline = [DateTime]::UtcNow.AddMinutes(6)
$ready = $false

do {
    try {
        $layers = Invoke-RestMethod -Uri "$frontendUrl/api/osi-layers" -Method Get -TimeoutSec 5
        if (@($layers).Count -eq 7) {
            $ready = $true
            break
        }
    }
    catch {
        # El servicio todavia puede estar compilando o iniciando.
    }

    Start-Sleep -Seconds 5
} while ([DateTime]::UtcNow -lt $deadline)

if (-not $ready) {
    Write-Host "El ambiente no quedo saludable dentro del tiempo esperado." -ForegroundColor Red
    & docker compose ps
    & docker compose logs --tail 120
    throw "Revisa los logs anteriores."
}

Write-Host ""
Write-Host "AMBIENTE INICIADO CORRECTAMENTE" -ForegroundColor Green
Write-Host "Web:        $frontendUrl" -ForegroundColor Green
Write-Host "API:        http://127.0.0.1:$backendPort/api/osi-layers"
Write-Host "SQL Server: 127.0.0.1,$sqlServerPort"
Write-Host ""
Write-Host "Para detenerlo: docker compose down"
