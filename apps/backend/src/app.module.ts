import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { PrismaModule } from "./prisma/prisma.module";
import { InsumosModule } from "./insumos/insumos.module";
import { ProductosModule } from "./productos/productos.module";
import { BodegaModule } from "./bodega/bodega.module";
import { ProduccionModule } from "./produccion/produccion.module";
import { CatalogoModule } from "./catalogo/catalogo.module";
import { AuthModule } from "./auth/auth.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    InsumosModule,
    ProductosModule,
    BodegaModule,
    ProduccionModule,
    CatalogoModule,
  ],
})
export class AppModule {}
