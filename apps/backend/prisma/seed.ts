import { PrismaClient } from "@prisma/client";
import { PRODUCTOS_INICIALES, INSUMOS_INICIALES } from "@pasteleria/core";

const prisma = new PrismaClient();

async function main() {
  for (const insumo of INSUMOS_INICIALES) {
    await prisma.insumo.upsert({
      where: { id: insumo.id },
      create: {
        id: insumo.id,
        nombre: insumo.nombre,
        unidad: insumo.unidad,
        costoPorKg: insumo.costoPorKg,
      },
      update: { nombre: insumo.nombre },
    });
  }

  for (const producto of PRODUCTOS_INICIALES) {
    await prisma.producto.upsert({
      where: { id: producto.id },
      create: {
        id: producto.id,
        nombre: producto.nombre,
        categoria: producto.categoria,
        activo: producto.activo,
      },
      update: { nombre: producto.nombre, categoria: producto.categoria },
    });

    await prisma.recetaItem.deleteMany({ where: { productoId: producto.id } });
    await prisma.recetaItem.createMany({
      data: producto.ingredientes.map((i) => ({
        productoId: producto.id,
        insumoId: i.insumoId,
        gramosPorTanda: i.gramosPorTanda,
      })),
    });
  }

  console.log(
    `Seed completo: ${INSUMOS_INICIALES.length} insumos, ${PRODUCTOS_INICIALES.length} productos.`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
