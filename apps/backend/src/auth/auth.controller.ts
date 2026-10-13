import { Body, Controller, Get, HttpCode, Post, Req } from "@nestjs/common";
import { AuthService } from "./auth.service";
import type { PeticionAutenticada } from "./auth.guard";
import { Publico } from "./decorators";
import { LoginDto } from "./dto/login.dto";

@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Publico()
  @Post("login")
  @HttpCode(200)
  login(@Body() dto: LoginDto, @Req() req: PeticionAutenticada) {
    return this.auth.login(dto.usuario, dto.password, req.ip ?? "desconocida");
  }

  /** Devuelve el usuario de la sesión actual (el frontend lo usa al recargar la página). */
  @Get("yo")
  yo(@Req() req: PeticionAutenticada) {
    return req.usuario;
  }
}
