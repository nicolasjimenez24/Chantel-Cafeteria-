import { Module } from "@nestjs/common";
import { BodegaModule } from "../bodega/bodega.module";
import { InsumosModule } from "../insumos/insumos.module";
import { ProductosModule } from "../productos/productos.module";
import { ProduccionController } from "./produccion.controller";
import { ProduccionService } from "./produccion.service";

@Module({
  imports: [ProductosModule, InsumosModule, BodegaModule],
  controllers: [ProduccionController],
  providers: [ProduccionService],
})
export class ProduccionModule {}
