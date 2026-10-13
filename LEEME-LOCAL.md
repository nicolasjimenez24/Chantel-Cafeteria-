# Chantel · Control de cafetería: correr en un computador de desarrollo

Guía para abrir y correr este proyecto en VS Code, en modo desarrollo.

## Qué contiene

- `apps/frontend`: la interfaz (React + Vite)
- `apps/backend`: la API y la conexión a la base de datos (NestJS + Prisma)
- `packages/core`: el motor de cálculo y las recetas, compartido por los dos

## Requisitos

- **Node.js** versión LTS (https://nodejs.org)
- **PostgreSQL** (https://www.postgresql.org/download/windows/)
- **VS Code**

## Primera vez

Abre la carpeta del proyecto en VS Code (**Archivo → Abrir carpeta**), la que contiene `package.json`, y abre una terminal (**Ver → Terminal**). Si la terminal de VS Code no abre, usa PowerShell por fuera: todos los comandos son iguales.

**1. Permitir que npm funcione** (solo una vez por computador):

```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

**2. Crear la base de datos** (pide la contraseña que pusiste al instalar PostgreSQL):

```powershell
$psql = (Get-ChildItem "C:\Program Files\PostgreSQL\*\bin\psql.exe" | Select-Object -First 1).FullName
& $psql -U postgres -c "CREATE DATABASE cafeteria;"
```

**3. Crear el archivo de configuración** `apps/backend/.env` (te pregunta la contraseña):

```powershell
$clave = [uri]::EscapeDataString((Read-Host "Contraseña de postgres"))
$secreto = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 48 | ForEach-Object { [char]$_ })
Set-Content -Path "apps\backend\.env" -Encoding ascii -Value "DATABASE_URL=`"postgresql://postgres:$clave@localhost:5432/cafeteria?schema=public`"`r`nPORT=3001`r`nCORS_ORIGIN=http://localhost:5174`r`nAUTH_SECRET=$secreto"
```

`AUTH_SECRET` firma las sesiones. Debe ser distinto del de Producción, para que una sesión de una app no sirva en la otra.

**4. Instalar, compilar y cargar los datos iniciales:**

```powershell
npm install
npm run build
npm run db:deploy
npm run db:seed
```

`build` compila el motor de cálculo y genera la conexión a la base de datos. El último comando debe decir `Seed completo: 65 insumos, 52 productos.`

**5. Crear las cuentas de acceso** (admin, operador1 y operador2):

```powershell
cd apps\backend
npm run usuarios:crear
```

Muestra las contraseñas una sola vez. Para cambiar una: `npm run usuarios:crear -- --reiniciar operador1`, o elegirla tú: `npm run usuarios:crear -- --fijar operador1=MiClave`. El administrador edita recetas; los operadores solo producen y manejan la bodega.

**6. (Opcional) Ícono en el escritorio y arranque con Windows:**

```powershell
powershell -ExecutionPolicy Bypass -File scripts\windows\instalar-accesos.ps1
```

Crea "Chantel Cafetería" en el escritorio (abre la app en su propia ventana, en http://localhost:3001) y hace que el servidor arranque solo al iniciar sesión en Windows. Requiere haber corrido `npm run build`.

## Trabajar en el proyecto

Se necesitan **dos terminales abiertas al tiempo** (en VS Code, el botón **+** de la terminal abre otra):

```powershell
npm run dev:backend
```

```powershell
npm run dev:frontend
```

Luego abre **http://localhost:5174** en el navegador. Los cambios que hagas en el código se ven solos, sin reiniciar.

Excepción: si cambias algo dentro de `packages/core` (recetas o cálculos), el frontend lo toma solo, pero el backend necesita `npm run build:core` y reiniciar `dev:backend`.

## Puertos

| | Desarrollo | Servidor |
|---|---|---|
| Aplicación | http://localhost:5174 | http://localhost:3001 |
| API | http://localhost:3001/api | http://localhost:3001/api |

Producción usa los puertos 3000 y 5173, y Cafetería los 3001 y 5174, así que los dos proyectos pueden correr a la vez en el mismo computador.

## Pruebas

```powershell
npm test
```

Corre las pruebas del motor de cálculo y del historial. Si cambias recetas o cálculos, deben seguir pasando.

## Importante

- **Los datos del portátil son independientes de los del servidor.** Aquí empiezas con las recetas iniciales y una bodega vacía; lo que registres en el portátil no aparece en el servidor, ni al revés.
- **Para llevar cambios de código al servidor**, se sigue la sección "Actualizar a una versión nueva" de `DESPLIEGUE.md`: detener el servicio, reemplazar los archivos (conservando `apps\backend\.env`), `npm install`, `npm run build`, `npm run db:deploy` y arrancar el servicio.
