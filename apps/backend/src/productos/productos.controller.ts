import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Put } from "@nestjs/common";
import { Roles } from "../auth/decorators";
import { ProductosService } from "./productos.service";
import {
  ActualizarProductoDto,
  CrearProductoDto,
  ReemplazarRecetaDto,
} from "./dto/producto.dto";

@Controller("productos")
export class ProductosController {
  constructor(private readonly productos: ProductosService) {}

  @Get()
  listar() {
    return this.productos.listar();
  }

  @Get(":id")
  obtener(@Param("id") id: string) {
    return this.productos.obtener(id);
  }

  @Roles("ADMIN")
  @Post()
  crear(@Body() dto: CrearProductoDto) {
    return this.productos.crear(dto);
  }

  @Roles("ADMIN")
  @Patch(":id")
  actualizar(@Param("id") id: string, @Body() dto: ActualizarProductoDto) {
    return this.productos.actualizar(id, dto);
  }

  @Roles("ADMIN")
  @Put(":id/receta")
  reemplazarReceta(@Param("id") id: string, @Body() dto: ReemplazarRecetaDto) {
    return this.productos.reemplazarReceta(id, dto);
  }

  @Roles("ADMIN")
  @Delete(":id")
  @HttpCode(204)
  async eliminar(@Param("id") id: string) {
    await this.productos.eliminar(id);
  }
}
