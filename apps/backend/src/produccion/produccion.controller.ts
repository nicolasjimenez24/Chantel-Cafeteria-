import { Body, Controller, Delete, Get, HttpCode, Param, Post, Query } from "@nestjs/common";
import { ProduccionService } from "./produccion.service";
import { CalcularProduccionDto } from "./dto/produccion.dto";

@Controller("produccion")
export class ProduccionController {
  constructor(private readonly produccion: ProduccionService) {}

  /** Calcula sin guardar: equivale al botón "Calcular" del frontend. */
  @Post("calcular")
  @HttpCode(200)
  calcular(@Body() dto: CalcularProduccionDto) {
    return this.produccion.calcular(dto);
  }

  /** Calcula y guarda en el historial. */
  @Post()
  guardar(@Body() dto: CalcularProduccionDto) {
    return this.produccion.guardar(dto);
  }

  /** Historial, opcionalmente filtrado: GET /api/produccion?desde=2026-10-01&hasta=2026-10-07 */
  @Get()
  listarHistorial(@Query("desde") desde?: string, @Query("hasta") hasta?: string) {
    return this.produccion.listarHistorial(desde, hasta);
  }

  @Delete(":id")
  @HttpCode(204)
  async eliminar(@Param("id") id: string) {
    await this.produccion.eliminar(id);
  }
}
