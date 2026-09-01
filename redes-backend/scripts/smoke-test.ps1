param(
    [string]$BaseUrl = "http://127.0.0.1:8080"
)

$ErrorActionPreference = "Stop"

$tests = @(
    @{ Name = "Capas OSI"; Path = "/api/osi-layers"; MinimumCount = 7 },
    @{ Name = "Protocolos"; Path = "/api/protocols"; MinimumCount = 15 },
    @{ Name = "Puertos"; Path = "/api/ports"; MinimumCount = 13 }
)

foreach ($test in $tests) {
    $response = Invoke-RestMethod -Method Get -Uri ($BaseUrl + $test.Path)
    $count = @($response).Count

    if ($count -lt $test.MinimumCount) {
        throw "$($test.Name): se esperaban al menos $($test.MinimumCount) elementos y llegaron $count."
    }

    Write-Host "OK - $($test.Name): $count elementos"
}

$httpsPort = Invoke-RestMethod -Method Get -Uri ($BaseUrl + "/api/ports/443")

if ($httpsPort.port -ne 443 -or $httpsPort.service -ne "HTTPS" -or $httpsPort.transportProtocol -ne "TCP") {
    throw "La respuesta del puerto 443 no coincide con el contrato esperado."
}

Write-Host "OK - Puerto 443: HTTPS sobre TCP"
Write-Host "SMOKE TEST COMPLETADO CORRECTAMENTE"
