# Crea el ícono de Chantel en el escritorio y en el menú Inicio, y hace que el
# servidor arranque solo al iniciar sesión en Windows.
# Volver a ejecutarlo es seguro (reemplaza los accesos). Si mueves la carpeta
# del proyecto, ejecútalo de nuevo.

$raiz = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$ps   = Join-Path $env:WINDIR "System32\WindowsPowerShell\v1.0\powershell.exe"

# Ícono .ico a partir del favicon de la app (formato ICO con PNG embebido).
$png = [IO.File]::ReadAllBytes((Join-Path $raiz "apps\frontend\public\favicon.png"))
$ico = Join-Path $PSScriptRoot "chantel-cafeteria.ico"
$ms  = New-Object IO.MemoryStream
$w   = New-Object IO.BinaryWriter($ms)
$w.Write([uint16]0); $w.Write([uint16]1); $w.Write([uint16]1)          # cabecera: 1 imagen
$w.Write([byte]0); $w.Write([byte]0); $w.Write([byte]0); $w.Write([byte]0)  # tamaño tomado del PNG
$w.Write([uint16]1); $w.Write([uint16]32)
$w.Write([uint32]$png.Length); $w.Write([uint32]22)
$w.Write($png); $w.Flush()
[IO.File]::WriteAllBytes($ico, $ms.ToArray())

$shell = New-Object -ComObject WScript.Shell
function Crear-Acceso($ruta, $script, $descripcion) {
    $a = $shell.CreateShortcut($ruta)
    $a.TargetPath       = $ps
    $a.Arguments        = "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$(Join-Path $PSScriptRoot $script)`""
    $a.WorkingDirectory = $raiz
    $a.IconLocation     = $ico
    $a.WindowStyle      = 7   # minimizada: evita que se vea la consola
    $a.Description      = $descripcion
    $a.Save()
    Write-Host "  $ruta"
}

Write-Host "Accesos creados:"
Crear-Acceso (Join-Path ([Environment]::GetFolderPath("Desktop"))  "Chantel Cafetería.lnk") "abrir-cafeteria.ps1" "Abrir Chantel Cafetería"
Crear-Acceso (Join-Path ([Environment]::GetFolderPath("Programs")) "Chantel Cafetería.lnk") "abrir-cafeteria.ps1" "Abrir Chantel Cafetería"
Crear-Acceso (Join-Path ([Environment]::GetFolderPath("Startup"))  "Chantel Cafetería Servidor.lnk")   "iniciar-servidor.ps1" "Arranca el servidor de Chantel Cafetería al iniciar Windows"
