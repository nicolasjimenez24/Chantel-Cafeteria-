import { BadRequestException, Injectable } from "@nestjs/common";
import type { Catalogo } from "@pasteleria/core";
import { PrismaService } from "../prisma/prisma.service";
import { InsumosService } from "../insumos/insumos.service";
import { ProductosService } from "../productos/productos.service";
import { CatalogoDto } from "./dto/catalogo.dto";

@Injectable()
export class CatalogoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly insumos: InsumosService,
    private readonly productos: ProductosService,
  ) {}

  async obtener(): Promise<Catalogo> {
    const [insumos, productos] = await Promise.all([
      this.insumos.listar(),
      this.productos.listar(),
    ]);
    return { insumos, productos };
  }

  /**
   * Sincroniza el catálogo completo en una sola transacción: crea/actualiza lo
   * recibido y elimina lo que ya no está presente. Es el equivalente al botón
   * "Guardar cambios" de Administración, que edita todo en memoria y persiste de un golpe.
   */
  async reemplazar(dto: CatalogoDto): Promise<Catalogo> {
    const idsInsumos = new Set(dto.insumos.map((i) => i.id));
    for (const producto of dto.productos) {
      const faltantes = producto.ingredientes
        .map((i) => i.insumoId)
        .filter((id) => !idsInsumos.has(id));
      if (faltantes.length > 0) {
        throw new BadRequestException(
          `El producto "${producto.nombre}" usa insumos que no están en la lista de insumos: ${faltantes.join(", ")}`,
        );
      }
    }

    await this.prisma.$transaction(async (tx) => {
      const idsProductos = dto.productos.map((p) => p.id);

      await tx.producto.deleteMany({ where: { id: { notIn: idsProductos } } });
      await tx.insumo.deleteMany({ where: { id: { notIn: [...idsInsumos] } } });

      for (const insumo of dto.insumos) {
        await tx.insumo.upsert({
          where: { id: insumo.id },
          create: {
            id: insumo.id,
            nombre: insumo.nombre,
            unidad: insumo.unidad ?? "g",
            costoPorKg: insumo.costoPorKg ?? null,
          },
          update: { nombre: insumo.nombre, costoPorKg: insumo.costoPorKg ?? null },
        });
      }

      for (const producto of dto.productos) {
        await tx.producto.upsert({
          where: { id: producto.id },
          create: {
            id: producto.id,
            nombre: producto.nombre,
            categoria: producto.categoria,
            activo: producto.activo ?? true,
          },
          update: {
            nombre: producto.nombre,
            categoria: producto.categoria,
            activo: producto.activo ?? true,
          },
        });
        await tx.recetaItem.deleteMany({ where: { productoId: producto.id } });
        if (producto.ingredientes.length > 0) {
          await tx.recetaItem.createMany({
            data: producto.ingredientes.map((i) => ({
              productoId: producto.id,
              insumoId: i.insumoId,
              gramosPorTanda: i.gramosPorTanda,
            })),
          });
        }
      }
    });

    return this.obtener();
  }
}
