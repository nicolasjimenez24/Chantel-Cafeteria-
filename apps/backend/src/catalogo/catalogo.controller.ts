import { Body, Controller, Get, Put } from "@nestjs/common";
import { Roles } from "../auth/decorators";
import { CatalogoService } from "./catalogo.service";
import { CatalogoDto } from "./dto/catalogo.dto";

@Controller("catalogo")
export class CatalogoController {
  constructor(private readonly catalogo: CatalogoService) {}

  @Get()
  obtener() {
    return this.catalogo.obtener();
  }

  @Roles("ADMIN")
  @Put()
  reemplazar(@Body() dto: CatalogoDto) {
    return this.catalogo.reemplazar(dto);
  }
}
