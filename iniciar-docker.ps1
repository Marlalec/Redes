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

function New-InternalToken {
    return [Guid]::NewGuid().ToString("N") + [Guid]::NewGuid().ToString("N")
}

function New-FernetKey {
    $bytes = New-Object byte[] 32
    $generator = [System.Security.Cryptography.RandomNumberGenerator]::Create()
    try {
        $generator.GetBytes($bytes)
    }
    finally {
        $generator.Dispose()
    }

    return [Convert]::ToBase64String($bytes).Replace("+", "-").Replace("/", "_")
}

function ConvertTo-DotEnvLiteral {
    param([Parameter(Mandatory = $true)][string]$Value)

    if ($Value.Contains("`r") -or $Value.Contains("`n") -or $Value.Contains("'")) {
        throw "Las credenciales RTSP no pueden contener saltos de linea ni comillas simples."
    }

    return "'$Value'"
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

function Set-DotEnvValue {
    param(
        [Parameter(Mandatory = $true)][string]$Path,
        [Parameter(Mandatory = $true)][string]$Name,
        [Parameter(Mandatory = $true)][string]$Value
    )

    $lines = @(Get-Content -LiteralPath $Path)
    $pattern = "^\s*" + [Regex]::Escape($Name) + "\s*="
    $updated = $false

    for ($index = 0; $index -lt $lines.Count; $index++) {
        if ($lines[$index] -match $pattern) {
            $lines[$index] = "$Name=$Value"
            $updated = $true
            break
        }
    }

    if (-not $updated) {
        $lines += "$Name=$Value"
    }

    $utf8WithoutBom = New-Object System.Text.UTF8Encoding($false)
    [System.IO.File]::WriteAllLines($Path, $lines, $utf8WithoutBom)
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
    $webPassword = New-StrongPassword
    $content = @(
        "# Generado automaticamente por iniciar-docker.ps1. No compartir ni subir a Git."
        "MSSQL_SA_PASSWORD=$saPassword"
        "DB_PASSWORD=$appPassword"
        "APP_ADMIN_EMAIL=admin@osidev.local"
        "APP_ADMIN_NAME=Administrador OSI"
        "APP_ADMIN_PASSWORD=$webPassword"
        "SESSION_COOKIE_SECURE=false"
        "CAMERA_HOST=192.168.1.27"
        "CAMERA_PORT=554"
        "CAMERA_RTSP_PATH=/live/ch00_0"
        "FACE_INTERNAL_TOKEN=$(New-InternalToken)"
        "FACE_DATA_KEY=$(New-FernetKey)"
        "FACIAL_SERVICE_ENABLED=true"
        "FACE_LIVENESS_ENABLED=true"
        "FACE_DETECTION_THRESHOLD=0.70"
        "FACE_MATCH_THRESHOLD=0.45"
        "FACE_REQUIRED_SAMPLES=8"
        "FACE_CAPTURE_TIMEOUT_SECONDS=14"
        "FACE_SAMPLE_INTERVAL_MS=300"
        "FACE_MIN_FACE_PIXELS=120"
        "FACE_MIN_BLUR_VARIANCE=30"
        "FACE_LIVENESS_MIN_MOVEMENT=0.035"
        "FRONTEND_PORT=5173"
        "BACKEND_PORT=8080"
        "SQLSERVER_PORT=14330"
    )

    $utf8WithoutBom = New-Object System.Text.UTF8Encoding($false)
    [System.IO.File]::WriteAllLines($EnvFile, $content, $utf8WithoutBom)
    Write-Host "Configuracion local creada de forma segura en .env." -ForegroundColor Green
}

$adminEmail = Get-DotEnvValue -Path $EnvFile -Name "APP_ADMIN_EMAIL" -DefaultValue ""
if ([string]::IsNullOrWhiteSpace($adminEmail)) {
    $adminEmail = "admin@osidev.local"
    Set-DotEnvValue -Path $EnvFile -Name "APP_ADMIN_EMAIL" -Value $adminEmail
}

$adminName = Get-DotEnvValue -Path $EnvFile -Name "APP_ADMIN_NAME" -DefaultValue ""
if ([string]::IsNullOrWhiteSpace($adminName)) {
    $adminName = "Administrador OSI"
    Set-DotEnvValue -Path $EnvFile -Name "APP_ADMIN_NAME" -Value $adminName
}

$adminPassword = Get-DotEnvValue -Path $EnvFile -Name "APP_ADMIN_PASSWORD" -DefaultValue ""
if ([string]::IsNullOrWhiteSpace($adminPassword) -or $adminPassword.StartsWith("CAMBIAR_")) {
    $adminPassword = New-StrongPassword
    Set-DotEnvValue -Path $EnvFile -Name "APP_ADMIN_PASSWORD" -Value $adminPassword
    Write-Host "Se agregaron credenciales de acceso web al archivo .env." -ForegroundColor Green
}

$faceToken = Get-DotEnvValue -Path $EnvFile -Name "FACE_INTERNAL_TOKEN" -DefaultValue ""
if ([string]::IsNullOrWhiteSpace($faceToken) -or $faceToken.StartsWith("CAMBIAR_")) {
    Set-DotEnvValue -Path $EnvFile -Name "FACE_INTERNAL_TOKEN" -Value (New-InternalToken)
    Write-Host "Se genero el token privado del servicio facial." -ForegroundColor Green
}

$faceDataKey = Get-DotEnvValue -Path $EnvFile -Name "FACE_DATA_KEY" -DefaultValue ""
if ([string]::IsNullOrWhiteSpace($faceDataKey) -or $faceDataKey.StartsWith("CAMBIAR_")) {
    Set-DotEnvValue -Path $EnvFile -Name "FACE_DATA_KEY" -Value (New-FernetKey)
    Write-Host "Se genero la clave local de cifrado biometrico." -ForegroundColor Green
}

$cameraDefaults = @{
    "CAMERA_HOST" = "192.168.1.27"
    "CAMERA_PORT" = "554"
    "CAMERA_RTSP_PATH" = "/live/ch00_0"
    "FACIAL_SERVICE_ENABLED" = "true"
    "FACE_LIVENESS_ENABLED" = "true"
    "FACE_DETECTION_THRESHOLD" = "0.70"
    "FACE_MATCH_THRESHOLD" = "0.45"
    "FACE_REQUIRED_SAMPLES" = "8"
    "FACE_CAPTURE_TIMEOUT_SECONDS" = "14"
    "FACE_SAMPLE_INTERVAL_MS" = "300"
    "FACE_MIN_FACE_PIXELS" = "120"
    "FACE_MIN_BLUR_VARIANCE" = "30"
    "FACE_LIVENESS_MIN_MOVEMENT" = "0.035"
}

foreach ($entry in $cameraDefaults.GetEnumerator()) {
    $currentValue = Get-DotEnvValue -Path $EnvFile -Name $entry.Key -DefaultValue ""
    if ([string]::IsNullOrWhiteSpace($currentValue)) {
        Set-DotEnvValue -Path $EnvFile -Name $entry.Key -Value $entry.Value
    }
}

$cameraUsername = Get-DotEnvValue -Path $EnvFile -Name "CAMERA_USERNAME" -DefaultValue ""
if ([string]::IsNullOrWhiteSpace($cameraUsername) -or $cameraUsername.StartsWith("CAMBIAR_")) {
    $cameraUsername = Read-Host "Usuario RTSP de la camara JOOAN"
    if ([string]::IsNullOrWhiteSpace($cameraUsername)) {
        throw "El usuario RTSP es obligatorio para iniciar el servicio facial."
    }
    Set-DotEnvValue -Path $EnvFile -Name "CAMERA_USERNAME" -Value (ConvertTo-DotEnvLiteral $cameraUsername)
}

$cameraPassword = Get-DotEnvValue -Path $EnvFile -Name "CAMERA_PASSWORD" -DefaultValue ""
if ([string]::IsNullOrWhiteSpace($cameraPassword) -or $cameraPassword.StartsWith("CAMBIAR_")) {
    $secureCameraPassword = Read-Host "Contrasena RTSP de la camara JOOAN" -AsSecureString
    $cameraCredential = New-Object System.Management.Automation.PSCredential($cameraUsername, $secureCameraPassword)
    $cameraPassword = $cameraCredential.GetNetworkCredential().Password
    if ([string]::IsNullOrWhiteSpace($cameraPassword)) {
        throw "La contrasena RTSP es obligatoria para iniciar el servicio facial."
    }
    Set-DotEnvValue -Path $EnvFile -Name "CAMERA_PASSWORD" -Value (ConvertTo-DotEnvLiteral $cameraPassword)
}

& docker compose config --quiet
if ($LASTEXITCODE -ne 0) {
    throw "La configuracion de Compose no es valida. Revisa el archivo .env y el mensaje anterior."
}

$composeArguments = @("compose", "up", "--detach")
if (-not $NoBuild) {
    $composeArguments += "--build"
}

Write-Host "Iniciando SQL Server, servicio facial, backend y frontend..." -ForegroundColor Cyan
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
$faceRequired = $false

do {
    try {
        $health = Invoke-RestMethod -Uri "$frontendUrl/api/health" -Method Get -TimeoutSec 5
        if ($health.status -ne "UP") {
            throw "La API todavía no está lista."
        }

        $webSession = New-Object Microsoft.PowerShell.Commands.WebRequestSession
        $csrf = Invoke-RestMethod -Uri "$frontendUrl/api/auth/csrf" -Method Get -WebSession $webSession -TimeoutSec 5
        $csrfHeaders = @{}
        $csrfHeaders[$csrf.headerName] = $csrf.token
        $loginBody = @{
            email = $adminEmail
            password = $adminPassword
        } | ConvertTo-Json

        $loginResponse = Invoke-RestMethod -Uri "$frontendUrl/api/auth/login" -Method Post `
            -WebSession $webSession -Headers $csrfHeaders `
            -ContentType "application/json" -Body $loginBody -TimeoutSec 8

        if ($loginResponse.status -eq "FACE_REQUIRED") {
            $faceRequired = $true
            $ready = $true
            break
        }

        if ($loginResponse.status -eq "AUTHENTICATED") {
            $layers = Invoke-RestMethod -Uri "$frontendUrl/api/osi-layers" -Method Get `
                -WebSession $webSession -TimeoutSec 5
            if (@($layers).Count -eq 7) {
                $ready = $true
                break
            }
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
Write-Host "Camara RTSP: configurada en la red interna" -ForegroundColor Cyan
Write-Host "Usuario web: $adminEmail" -ForegroundColor Cyan
Write-Host "Contrasena:  $adminPassword" -ForegroundColor Cyan
Write-Host "Estas credenciales tambien quedan guardadas localmente en .env."
if ($faceRequired) {
    Write-Host "Este usuario ya tiene rostro registrado: completa el segundo factor en el navegador." -ForegroundColor Yellow
}
Write-Host ""
Write-Host "Para detenerlo: docker compose down"
