import { randomBytes, scryptSync, timingSafeEqual } from "crypto";

const LARGO_CLAVE = 64;

/** Formato guardado: scrypt$<sal hex>$<hash hex>. Nunca se guarda la contraseña. */
export function hashPassword(password: string): string {
  const sal = randomBytes(16);
  const hash = scryptSync(password, sal, LARGO_CLAVE);
  return `scrypt$${sal.toString("hex")}$${hash.toString("hex")}`;
}

export function verificarPassword(password: string, guardado: string): boolean {
  const [esquema, salHex, hashHex] = guardado.split("$");
  if (esquema !== "scrypt" || !salHex || !hashHex) return false;
  const esperado = Buffer.from(hashHex, "hex");
  const calculado = scryptSync(password, Buffer.from(salHex, "hex"), esperado.length);
  return timingSafeEqual(calculado, esperado);
}
