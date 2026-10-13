import { randomBytes } from "crypto";
import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/auth/password";

const prisma = new PrismaClient();

const USUARIOS = [
  { usuario: "admin", nombre: "Administrador", rol: "ADMIN" },
  { usuario: "operador1", nombre: "Operador 1", rol: "OPERADOR" },
  { usuario: "operador2", nombre: "Operador 2", rol: "OPERADOR" },
];

// Sin caracteres ambiguos (0/O, 1/l/I) para poder dictarla o copiarla sin errores.
const ALFABETO = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function generarPassword(largo = 14): string {
  const bytes = randomBytes(largo);
  return Array.from(bytes, (b) => ALFABETO[b % ALFABETO.length]).join("");
}

/**
 * Crea las cuentas que no existan, con contraseña aleatoria que se muestra una
 * sola vez. Las cuentas existentes no se tocan; para cambiar una contraseña:
 *   npm run usuarios:crear -- --reiniciar operador1
 */
async function main() {
  const reiniciar = new Set<string>();
  const fijadas = new Map<string, string>();
  const args = process.argv.slice(2);
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--reiniciar" && args[i + 1]) reiniciar.add(args[++i].toLowerCase());
    // --fijar usuario=contraseña : elige tú la contraseña en vez de una aleatoria
    if (args[i] === "--fijar" && args[i + 1]) {
      const [u, ...resto] = args[++i].split("=");
      fijadas.set(u.toLowerCase(), resto.join("="));
      reiniciar.add(u.toLowerCase());
    }
  }

  const entregadas: { usuario: string; rol: string; password: string }[] = [];

  for (const u of USUARIOS) {
    const existente = await prisma.usuario.findUnique({ where: { usuario: u.usuario } });
    if (existente && !reiniciar.has(u.usuario)) continue;

    const password = fijadas.get(u.usuario) || generarPassword();
    const passwordHash = hashPassword(password);
    if (existente) {
      await prisma.usuario.update({ where: { usuario: u.usuario }, data: { passwordHash, activo: true } });
    } else {
      await prisma.usuario.create({ data: { ...u, passwordHash } });
    }
    entregadas.push({ usuario: u.usuario, rol: u.rol, password });
  }

  if (entregadas.length === 0) {
    console.log("Todas las cuentas ya existen. Usa --reiniciar <usuario> para generar una contraseña nueva.");
    return;
  }

  console.log("\nCuentas listas. Guarda estas contraseñas ahora: no se vuelven a mostrar.\n");
  for (const e of entregadas) {
    console.log(`  ${e.rol.padEnd(9)} usuario: ${e.usuario.padEnd(10)} contraseña: ${e.password}`);
  }
  console.log("");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
