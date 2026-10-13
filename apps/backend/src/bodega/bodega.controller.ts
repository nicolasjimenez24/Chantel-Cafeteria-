import { Body, Controller, Delete, Get, HttpCode, Param, Post, Put } from "@nestjs/common";
import { BodegaService } from "./bodega.service";
import { CerrarDiaDto, GuardarBodegaDto } from "./dto/bodega.dto";

@Controller("bodega")
export class BodegaController {
  constructor(private readonly bodega: BodegaService) {}

  @Get()
  obtenerMapa() {
    return this.bodega.obtenerMapa();
  }

  /** Producciones pendientes de descontar y el último cierre. */
  @Get("cierre")
  estadoCierre() {
    return this.bodega.estadoCierre();
  }

  /** Cierra el día: lo que quedó pasa a ser la bodega del día siguiente. */
  @Post("cierre")
  @HttpCode(200)
  cerrarDia(@Body() dto: CerrarDiaDto) {
    return this.bodega.cerrarDia(dto.produccionIds);
  }

  @Delete("cierre/ultimo")
  deshacerUltimoCierre() {
    return this.bodega.deshacerUltimoCierre();
  }

  @Put(":insumoId")
  guardar(@Param("insumoId") insumoId: string, @Body() dto: GuardarBodegaDto) {
    return this.bodega.guardar(insumoId, dto);
  }

  @Delete()
  @HttpCode(204)
  async limpiar() {
    await this.bodega.limpiar();
  }
}
