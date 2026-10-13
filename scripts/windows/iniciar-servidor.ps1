# Arranca el servidor de Chantel Cafetería en segundo plano (sin ventana).
# Lo ejecuta Windows al iniciar sesión y también el ícono del escritorio.
# Si ya está corriendo, no hace nada.

$raiz    = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$backend = Join-Path $raiz "apps\backend"
$logs    = Join-Path $raiz "logs"
$puerto  = 3001

if (Get-NetTCPConnection -LocalPort $puerto -State Listen -ErrorAction SilentlyContinue) { exit 0 }

# Al encender el PC, PostgreSQL puede tardar unos segundos en estar listo.
for ($i = 0; $i -lt 60; $i++) {
    if (Get-NetTCPConnection -LocalPort 5432 -State Listen -ErrorAction SilentlyContinue) { break }
    Start-Sleep -Seconds 2
}

New-Item -ItemType Directory -Force -Path $logs | Out-Null
Start-Process -FilePath "node" -ArgumentList "dist/src/main" -WorkingDirectory $backend -WindowStyle Hidden `
    -RedirectStandardOutput (Join-Path $logs "servidor.log") `
    -RedirectStandardError  (Join-Path $logs "servidor-errores.log")
