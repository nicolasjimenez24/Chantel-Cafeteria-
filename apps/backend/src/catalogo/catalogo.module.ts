import { Module } from "@nestjs/common";
import { InsumosModule } from "../insumos/insumos.module";
import { ProductosModule } from "../productos/productos.module";
import { CatalogoController } from "./catalogo.controller";
import { CatalogoService } from "./catalogo.service";

@Module({
  imports: [InsumosModule, ProductosModule],
  controllers: [CatalogoController],
  providers: [CatalogoService],
})
export class CatalogoModule {}
