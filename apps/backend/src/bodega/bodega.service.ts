import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import {
  diaLocal,
  proyectarCierre,
  type BodegaMap,
  type EstadoCierre,
  type ProduccionPendiente,
  type ResultadoCierre,
} from "@pasteleria/core";
import { PrismaService } from "../prisma/prisma.service";
import { GuardarBodegaDto } from "./dto/bodega.dto";

type Consumo = ProduccionPendiente["consumo"];

@Injectable()
export class BodegaService {
  constructor(private readonly prisma: PrismaService) {}

  /** Devuelve el mapa { insumoId: { ingresos, bodega } } que consume el motor de cálculo. */
  async obtenerMapa(): Promise<BodegaMap> {
    return this.mapaDesde(this.prisma);
  }

  async guardar(insumoId: string, dto: GuardarBodegaDto): Promise<BodegaMap[string]> {
    const insumo = await this.prisma.insumo.findUnique({ where: { id: insumoId } });
    if (!insumo) throw new NotFoundException(`No existe el insumo "${insumoId}"`);

    const fila = await this.prisma.bodegaInsumo.upsert({
      where: { insumoId },
      create: {
        insumoId,
        ingresos: dto.ingresos ?? 0,
        bodega: dto.bodega ?? 0,
      },
      update: {
        ingresos: dto.ingresos,
        bodega: dto.bodega,
      },
    });
    return { ingresos: fila.ingresos, bodega: fila.bodega };
  }

  async limpiar(): Promise<void> {
    await this.prisma.bodegaInsumo.deleteMany();
  }

  /** Producciones guardadas que aún no se descuentan, y el último cierre hecho. */
  async estadoCierre(): Promise<EstadoCierre> {
    const [pendientes, ultimo] = await Promise.all([
      this.prisma.produccion.findMany({ where: { cierreId: null }, orderBy: { creadoEn: "asc" } }),
      this.prisma.cierreBodega.findFirst({
        orderBy: { creadoEn: "desc" },
        include: { _count: { select: { producciones: true } } },
      }),
    ]);

    return {
      pendientes: pendientes.map((p) => ({
        id: p.id,
        dia: diaLocal(p.creadoEn),
        fecha: p.fecha,
        hora: p.hora,
        productos: p.productos as ProduccionPendiente["productos"],
        consumo: ((p.consumo as Consumo) ?? []).map((c) => ({ insumoId: c.insumoId, totalGramos: c.totalGramos })),
      })),
      ultimoCierre: ultimo
        ? { id: ultimo.id, creadoEn: ultimo.creadoEn.toISOString(), producciones: ultimo._count.producciones }
        : null,
    };
  }

  /**
   * Cierra el día: descuenta el consumo de las producciones indicadas y deja lo
   * que quedó como bodega inicial del día siguiente, con ingresos en cero.
   * Cada producción solo puede descontarse una vez.
   */
  async cerrarDia(produccionIds: string[]): Promise<ResultadoCierre> {
    const ids = [...new Set(produccionIds)];

    return this.prisma.$transaction(async (tx) => {
      const producciones = await tx.produccion.findMany({ where: { id: { in: ids }, cierreId: null } });
      if (producciones.length !== ids.length) {
        throw new BadRequestException(
          "Alguna de las producciones ya fue descontada o no existe. Recarga la página e inténtalo de nuevo.",
        );
      }

      const anterior = await this.mapaDesde(tx);
      const { filas, nuevaBodega } = proyectarCierre(
        anterior,
        producciones.map((p) => (p.consumo as Consumo) ?? []),
      );
      // Sin producciones ni existencias no hay nada que pasar. Con producciones se
      // registra igual (aunque no tengan receta), para que queden descontadas.
      if (filas.length === 0 && ids.length === 0) {
        throw new BadRequestException("No hay existencias en bodega ni producciones por descontar.");
      }

      const cierre = await tx.cierreBodega.create({
        data: { anterior: anterior as unknown as Prisma.InputJsonValue },
      });
      if (ids.length > 0) {
        await tx.produccion.updateMany({ where: { id: { in: ids } }, data: { cierreId: cierre.id } });
      }

      await tx.bodegaInsumo.deleteMany();
      await tx.bodegaInsumo.createMany({
        data: Object.entries(nuevaBodega).map(([insumoId, v]) => ({ insumoId, ingresos: 0, bodega: v.bodega })),
      });

      return { bodega: nuevaBodega, enNegativo: filas.filter((f) => f.nuevaBodega < 0).length };
    });
  }

  /** Deshace el último cierre: devuelve la bodega como estaba y las producciones a pendientes. */
  async deshacerUltimoCierre(): Promise<BodegaMap> {
    return this.prisma.$transaction(async (tx) => {
      const ultimo = await tx.cierreBodega.findFirst({ orderBy: { creadoEn: "desc" } });
      if (!ultimo) throw new NotFoundException("No hay ningún cierre para deshacer");

      const anterior = ultimo.anterior as unknown as BodegaMap;
      // Solo insumos que aún existen: alguno pudo eliminarse después del cierre.
      const existentes = new Set(
        (await tx.insumo.findMany({ select: { id: true } })).map((i) => i.id),
      );

      await tx.produccion.updateMany({ where: { cierreId: ultimo.id }, data: { cierreId: null } });
      await tx.bodegaInsumo.deleteMany();
      await tx.bodegaInsumo.createMany({
        data: Object.entries(anterior)
          .filter(([insumoId]) => existentes.has(insumoId))
          .map(([insumoId, v]) => ({ insumoId, ingresos: v.ingresos || 0, bodega: v.bodega || 0 })),
      });
      await tx.cierreBodega.delete({ where: { id: ultimo.id } });

      return this.mapaDesde(tx);
    });
  }

  private async mapaDesde(db: Pick<Prisma.TransactionClient, "bodegaInsumo">): Promise<BodegaMap> {
    const filas = await db.bodegaInsumo.findMany();
    const mapa: BodegaMap = {};
    for (const fila of filas) {
      mapa[fila.insumoId] = { ingresos: fila.ingresos, bodega: fila.bodega };
    }
    return mapa;
  }
}
