param(
    [string]$BaseUrl = "http://127.0.0.1:8080",
    [string]$Email = $env:APP_ADMIN_EMAIL,
    [string]$Password = $env:APP_ADMIN_PASSWORD
)

$ErrorActionPreference = "Stop"

if ([string]::IsNullOrWhiteSpace($Email)) {
    $Email = "admin@osidev.local"
}

if ([string]::IsNullOrWhiteSpace($Password)) {
    throw "Define APP_ADMIN_PASSWORD o envía el parámetro -Password para ejecutar la prueba."
}

$webSession = New-Object Microsoft.PowerShell.Commands.WebRequestSession
$csrf = Invoke-RestMethod -Method Get -Uri ($BaseUrl + "/api/auth/csrf") -WebSession $webSession
$csrfHeaders = @{}
$csrfHeaders[$csrf.headerName] = $csrf.token
$loginBody = @{ email = $Email; password = $Password } | ConvertTo-Json
$authenticatedUser = Invoke-RestMethod -Method Post -Uri ($BaseUrl + "/api/auth/login") `
    -WebSession $webSession -Headers $csrfHeaders -ContentType "application/json" -Body $loginBody

Write-Host "OK - Sesión iniciada: $($authenticatedUser.email)"

$tests = @(
    @{ Name = "Capas OSI"; Path = "/api/osi-layers"; MinimumCount = 7 },
    @{ Name = "Protocolos"; Path = "/api/protocols"; MinimumCount = 15 },
    @{ Name = "Puertos"; Path = "/api/ports"; MinimumCount = 13 }
)

foreach ($test in $tests) {
    $response = Invoke-RestMethod -Method Get -Uri ($BaseUrl + $test.Path) -WebSession $webSession
    $count = @($response).Count

    if ($count -lt $test.MinimumCount) {
        throw "$($test.Name): se esperaban al menos $($test.MinimumCount) elementos y llegaron $count."
    }

    Write-Host "OK - $($test.Name): $count elementos"
}

$httpsPort = Invoke-RestMethod -Method Get -Uri ($BaseUrl + "/api/ports/443") -WebSession $webSession

if ($httpsPort.port -ne 443 -or $httpsPort.service -ne "HTTPS" -or $httpsPort.transportProtocol -ne "TCP") {
    throw "La respuesta del puerto 443 no coincide con el contrato esperado."
}

Write-Host "OK - Puerto 443: HTTPS sobre TCP"
Write-Host "SMOKE TEST COMPLETADO CORRECTAMENTE"
