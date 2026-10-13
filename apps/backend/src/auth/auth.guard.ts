import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { Request } from "express";
import { AuthService, type UsuarioSesion } from "./auth.service";
import { PUBLICO_KEY, ROLES_KEY, type Rol } from "./decorators";

export type PeticionAutenticada = Request & { usuario?: UsuarioSesion };

/** Guard global: toda la API exige sesión, salvo lo marcado con @Publico(). */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly auth: AuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const destinos = [context.getHandler(), context.getClass()];
    if (this.reflector.getAllAndOverride<boolean>(PUBLICO_KEY, destinos)) return true;

    const req = context.switchToHttp().getRequest<PeticionAutenticada>();
    const [esquema, token] = (req.headers.authorization ?? "").split(" ");
    const usuario = esquema === "Bearer" && token ? await this.auth.autenticar(token) : null;
    if (!usuario) throw new UnauthorizedException("Inicia sesión para continuar");
    req.usuario = usuario;

    const roles = this.reflector.getAllAndOverride<Rol[]>(ROLES_KEY, destinos);
    if (roles && !roles.includes(usuario.rol)) {
      throw new ForbiddenException("Tu cuenta no tiene permiso para modificar esto");
    }
    return true;
  }
}
