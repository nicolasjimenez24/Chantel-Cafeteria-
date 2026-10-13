import { createHmac, timingSafeEqual } from "crypto";
import { HttpException, HttpStatus, Injectable, UnauthorizedException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import type { Rol } from "./decorators";
import { hashPassword, verificarPassword } from "./password";

const DURACION_SESION_MS = 12 * 60 * 60 * 1000;
const MAX_INTENTOS = 5;
const BLOQUEO_MS = 15 * 60 * 1000;

export interface UsuarioSesion {
  id: string;
  usuario: string;
  nombre: string;
  rol: Rol;
}

interface CargaToken {
  sub: string;
  exp: number;
}

// Hash de una contraseña inexistente: se verifica igual cuando el usuario no
// existe, para que el tiempo de respuesta no delate qué usuarios hay.
const HASH_SIMULADO = hashPassword("no-existe");

@Injectable()
export class AuthService {
  private readonly fallos = new Map<string, { cuenta: number; hasta: number }>();

  constructor(private readonly prisma: PrismaService) {}

  async login(usuario: string, password: string, ip: string) {
    const clave = `${ip}|${usuario.toLowerCase()}`;
    this.revisarBloqueo(clave);

    const cuenta = await this.prisma.usuario.findUnique({ where: { usuario: usuario.toLowerCase() } });
    const valido = verificarPassword(password, cuenta?.passwordHash ?? HASH_SIMULADO);

    if (!cuenta || !cuenta.activo || !valido) {
      this.registrarFallo(clave);
      throw new UnauthorizedException("Usuario o contraseña incorrectos");
    }

    this.fallos.delete(clave);
    return {
      token: this.firmar({ sub: cuenta.id, exp: Date.now() + DURACION_SESION_MS }),
      usuario: this.aSesion(cuenta),
    };
  }

  /** Valida el token y devuelve el usuario vigente; null si no sirve. */
  async autenticar(token: string): Promise<UsuarioSesion | null> {
    const carga = this.verificar(token);
    if (!carga) return null;
    const cuenta = await this.prisma.usuario.findUnique({ where: { id: carga.sub } });
    if (!cuenta || !cuenta.activo) return null;
    return this.aSesion(cuenta);
  }

  private aSesion(c: { id: string; usuario: string; nombre: string; rol: string }): UsuarioSesion {
    return { id: c.id, usuario: c.usuario, nombre: c.nombre, rol: c.rol === "ADMIN" ? "ADMIN" : "OPERADOR" };
  }

  private revisarBloqueo(clave: string) {
    const f = this.fallos.get(clave);
    if (f && f.cuenta >= MAX_INTENTOS && f.hasta > Date.now()) {
      throw new HttpException(
        "Demasiados intentos fallidos. Espera unos minutos e inténtalo de nuevo.",
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  private registrarFallo(clave: string) {
    const f = this.fallos.get(clave);
    const vigente = f && f.hasta > Date.now();
    this.fallos.set(clave, { cuenta: vigente ? f.cuenta + 1 : 1, hasta: Date.now() + BLOQUEO_MS });
  }

  private secreto(): string {
    const s = process.env.AUTH_SECRET;
    if (!s || s.length < 32) {
      throw new Error("Falta AUTH_SECRET (mínimo 32 caracteres) en el .env del backend.");
    }
    return s;
  }

  private firmar(carga: CargaToken): string {
    const cuerpo = Buffer.from(JSON.stringify(carga)).toString("base64url");
    const firma = createHmac("sha256", this.secreto()).update(cuerpo).digest("base64url");
    return `${cuerpo}.${firma}`;
  }

  private verificar(token: string): CargaToken | null {
    const [cuerpo, firma] = token.split(".");
    if (!cuerpo || !firma) return null;
    const esperada = createHmac("sha256", this.secreto()).update(cuerpo).digest();
    const recibida = Buffer.from(firma, "base64url");
    if (recibida.length !== esperada.length || !timingSafeEqual(recibida, esperada)) return null;
    try {
      const carga = JSON.parse(Buffer.from(cuerpo, "base64url").toString()) as CargaToken;
      return carga.exp > Date.now() ? carga : null;
    } catch {
      return null;
    }
  }
}
