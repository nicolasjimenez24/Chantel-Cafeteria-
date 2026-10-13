# Ícono del escritorio: asegura que el servidor esté corriendo y abre la app en su propia ventana.

$url  = "http://localhost:3001"
$logs = Join-Path (Split-Path -Parent (Split-Path -Parent $PSScriptRoot)) "logs"

& (Join-Path $PSScriptRoot "iniciar-servidor.ps1")

# Espera a que la API responda; un 401 también cuenta, significa que ya está arriba.
$listo = $false
for ($i = 0; $i -lt 45; $i++) {
    try {
        Invoke-WebRequest -Uri "$url/api/auth/yo" -UseBasicParsing -TimeoutSec 2 | Out-Null
        $listo = $true
    } catch {
        if ($_.Exception.Response) { $listo = $true }
    }
    if ($listo) { break }
    Start-Sleep -Seconds 1
}

if ($listo) {
    # Ventana propia, sin barra de direcciones ni pestañas (modo aplicación de Edge
    # o Chrome). Un perfil aparte la separa del navegador normal del usuario.
    $navegador = @(
        "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe",
        "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe",
        "$env:ProgramFiles\Google\Chrome\Application\chrome.exe"
    ) | Where-Object { Test-Path $_ } | Select-Object -First 1

    if ($navegador) {
        $perfil = Join-Path $env:LOCALAPPDATA "ChantelCafeteria\ventana"
        Start-Process -FilePath $navegador -ArgumentList @(
            "--app=$url", "--user-data-dir=`"$perfil`"", "--window-size=1280,860",
            "--no-first-run", "--no-default-browser-check"
        )
    } else {
        Start-Process $url
    }
} else {
    Add-Type -AssemblyName System.Windows.Forms
    [System.Windows.Forms.MessageBox]::Show(
        "El servidor de Chantel Cafetería no respondió.`n`nRevisa que PostgreSQL esté encendido y mira el detalle en:`n$logs\servidor-errores.log",
        "Chantel Cafetería", "OK", "Error") | Out-Null
}
