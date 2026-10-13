# Instalación en el servidor: Cafetería Chantel

Guía para dejar la aplicación de Control de Cafetería funcionando de forma
permanente en un servidor local, accesible desde cualquier equipo de la red.

## Cómo queda funcionando

Un solo programa (el backend, en Node.js) atiende todo en un mismo puerto:

- `http://IP-DEL-SERVIDOR:3001` → la aplicación
- `http://IP-DEL-SERVIDOR:3001/api` → la API que usa la aplicación

Los datos viven en PostgreSQL. El programa se instala como servicio: arranca
solo al encender el servidor, sin que nadie inicie sesión, y se reinicia solo
si se cae.

## Requisitos del servidor

- **Node.js 20 o superior** (versión LTS de https://nodejs.org)
- **PostgreSQL 14 o superior**
- Puerto **3000** libre (o el que se defina en `PORT`)
- Conexión a internet durante la instalación (npm y Prisma descargan componentes)

## 1. Copiar el proyecto

Copiar la carpeta del proyecto al servidor, **sin** `node_modules`. En esta
guía se usa `C:\apps\Cafeteria-Chantel`; si se usa otra ruta, ajustar
los comandos.

## 2. Base de datos

Crear la base de datos:

```powershell
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -c "CREATE DATABASE cafeteria;"
```

Crear el archivo `apps\backend\.env` con la conexión real:

```
DATABASE_URL="postgresql://USUARIO:CONTRASEÑA@localhost:5432/cafeteria?schema=public"
PORT=3001
```

Se recomienda un usuario de PostgreSQL propio para la aplicación en lugar de
`postgres`.

## 3. Instalar y compilar

Desde la raíz del proyecto:

```powershell
npm install
npm run build
npm run db:deploy
```

`build` compila las tres partes y genera el cliente de base de datos.
`db:deploy` aplica las migraciones pendientes sin pedir confirmación y sin
borrar datos. En el servidor se usa este comando, nunca `db:migrate`, que es
de desarrollo y puede proponer reiniciar la base.

**Solo la primera vez**, cargar las 35 recetas y 68 insumos iniciales:

```powershell
npm run db:seed
```

(Si se van a traer datos que ya existen en otro equipo, no correr el seed:
ver la sección "Traer los datos de otro equipo".)

## 4. Probar

```powershell
npm start
```

Debe mostrar:

```
API escuchando en http://localhost:3001/api
Aplicación disponible en http://localhost:3001
```

Abrir `http://localhost:3001` en el navegador del servidor. Si funciona,
detener con `Ctrl + C` y pasar al siguiente paso.

## 5. Dejarlo como servicio permanente

### En Windows (con NSSM)

Descargar NSSM de https://nssm.cc/download, copiar `nssm.exe` (carpeta
`win64`) a `C:\Windows\System32`, y en PowerShell **como administrador**:

```powershell
mkdir C:\apps\Cafeteria-Chantel\logs

nssm install Cafeteria "C:\Program Files\nodejs\node.exe" "dist\src\main.js"
nssm set Cafeteria AppDirectory "C:\apps\Cafeteria-Chantel\apps\backend"
nssm set Cafeteria AppStdout "C:\apps\Cafeteria-Chantel\logs\salida.log"
nssm set Cafeteria AppStderr "C:\apps\Cafeteria-Chantel\logs\errores.log"
nssm set Cafeteria Start SERVICE_AUTO_START
nssm set Cafeteria DependOnService postgresql-x64-18
nssm start Cafeteria
```

`DependOnService` hace que el servicio espere a PostgreSQL al arrancar el
servidor. El nombre `postgresql-x64-18` corresponde a PostgreSQL 18; para otra
versión, verificar el nombre en `services.msc`.

`AppDirectory` debe ser la carpeta `apps\backend`: ahí está el `.env` y desde
ahí se ubica el frontend compilado.

Comandos útiles: `nssm restart Cafeteria`, `nssm stop Cafeteria`,
`nssm status Cafeteria`. Los errores quedan en `logs\errores.log`.

### En Linux (con PM2)

```bash
sudo npm install -g pm2
cd /ruta/Cafeteria-Chantel/apps/backend
pm2 start dist/src/main.js --name cafeteria
pm2 save
pm2 startup
```

`pm2 startup` imprime un comando con `sudo`: hay que copiarlo y ejecutarlo
para que el servicio arranque con el sistema.

## 6. Acceso desde otros equipos

Abrir el puerto en el firewall de Windows (PowerShell como administrador):

```powershell
New-NetFirewallRule -DisplayName "Cafeteria Chantel" -Direction Inbound -Protocol TCP -LocalPort 3001 -Action Allow
```

Consultar la IP del servidor con `ipconfig` (línea "Dirección IPv4"). Desde
cualquier equipo de la red se entra a:

```
http://IP-DEL-SERVIDOR:3001
```

Conviene que el servidor tenga **IP fija** (reservada en el router o
configurada a mano); si cambia, la dirección deja de funcionar.

## 7. Respaldos

Con datos reales en uso, hay que respaldar la base. Respaldo manual:

```powershell
& "C:\Program Files\PostgreSQL\18\bin\pg_dump.exe" -U postgres -Fc -f "C:\respaldos\cafeteria_$(Get-Date -Format yyyy-MM-dd).backup" cafeteria
```

Se recomienda programarlo a diario con el Programador de tareas de Windows y
guardar copias fuera del servidor.

## Traer los datos de otro equipo

Si la aplicación ya se usó en otro computador (costos cargados, historial,
bodega) y se quieren conservar esos datos:

En el equipo de origen:

```powershell
& "C:\Program Files\PostgreSQL\18\bin\pg_dump.exe" -U postgres -Fc -f cafeteria.backup cafeteria
```

En el servidor, después de crear la base vacía (paso 2) y **en lugar** de
`db:deploy` y `db:seed`:

```powershell
& "C:\Program Files\PostgreSQL\18\bin\pg_restore.exe" -U postgres -d cafeteria cafeteria.backup
```

## Actualizar a una versión nueva

```powershell
nssm stop Cafeteria
# reemplazar los archivos del proyecto (conservando apps\backend\.env)
npm install
npm run build
npm run db:deploy
nssm start Cafeteria
```

## Seguridad

La aplicación **no tiene inicio de sesión todavía**. Cualquier persona con
acceso a la red de la empresa puede abrirla y modificar recetas, costos y
datos de bodega. Mientras no exista autenticación, el puerto 3000 no debe
exponerse a internet: solo a la red interna.
