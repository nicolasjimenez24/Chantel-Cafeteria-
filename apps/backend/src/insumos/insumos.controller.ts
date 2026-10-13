import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post } from "@nestjs/common";
import { Roles } from "../auth/decorators";
import { InsumosService } from "./insumos.service";
import { ActualizarInsumoDto, CrearInsumoDto } from "./dto/insumo.dto";

@Controller("insumos")
export class InsumosController {
  constructor(private readonly insumos: InsumosService) {}

  @Get()
  listar() {
    return this.insumos.listar();
  }

  @Get(":id")
  obtener(@Param("id") id: string) {
    return this.insumos.obtener(id);
  }

  @Roles("ADMIN")
  @Post()
  crear(@Body() dto: CrearInsumoDto) {
    return this.insumos.crear(dto);
  }

  @Roles("ADMIN")
  @Patch(":id")
  actualizar(@Param("id") id: string, @Body() dto: ActualizarInsumoDto) {
    return this.insumos.actualizar(id, dto);
  }

  @Roles("ADMIN")
  @Delete(":id")
  @HttpCode(204)
  async eliminar(@Param("id") id: string) {
    await this.insumos.eliminar(id);
  }
}
