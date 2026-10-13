import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import {
  calcularProduccion,
  diaLocal,
  limitesDeRango,
  type ProduccionGuardada,
  type ResultadoProduccion,
  type TandasMap,
} from "@pasteleria/core";
import { PrismaService } from "../prisma/prisma.service";
import { BodegaService } from "../bodega/bodega.service";
import { InsumosService } from "../insumos/insumos.service";
import { ProductosService } from "../productos/productos.service";
import { CalcularProduccionDto } from "./dto/produccion.dto";

function fechaHoy(): string {
  return new Date().toLocaleDateString("es-CO", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function horaAhora(): string {
  return new Date().toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });
}

@Injectable()
export class ProduccionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly productos: ProductosService,
    private readonly insumos: InsumosService,
    private readonly bodega: BodegaService,
  ) {}

  /**
   * Corre el motor de cálculo compartido (@pasteleria/core) contra el catálogo
   * y la bodega guardados en la base de datos. No persiste nada.
   */
  async calcular(dto: CalcularProduccionDto): Promise<ResultadoProduccion> {
    const tandas = this.validarTandas(dto.tandas);
    const [productos, insumos, bodegaMap] = await Promise.all([
      this.productos.listar(),
      this.insumos.listar(),
      this.bodega.obtenerMapa(),
    ]);
    return calcularProduccion(tandas, productos, insumos, bodegaMap);
  }

  async guardar(dto: CalcularProduccionDto): Promise<ProduccionGuardada> {
    const resultado = await this.calcular(dto);

    const fila = await this.prisma.produccion.create({
      data: {
        fecha: fechaHoy(),
        hora: horaAhora(),
        costoTotal: resultado.costoTotal,
        algunCostoConocido: resultado.algunCostoConocido,
        productos: resultado.porProducto.map((p) => ({ nombre: p.nombre, tandas: p.tandas })),
        // Los tipos del dominio son interfaces, que TypeScript no reconoce como JSON
        // estructural; el cast es el workaround estándar para columnas Json de Prisma.
        consumo: resultado.consumoConsolidado as unknown as Prisma.InputJsonValue,
        balance: resultado.balance as unknown as Prisma.InputJsonValue,
      },
    });
    // Al guardar la producción del día, su total final pasa de inmediato a la
    // bodega: es lo que queda para el día siguiente.
    await this.bodega.cerrarDia([fila.id]);
    return this.aDominio(fila);
  }

  /**
   * Historial filtrado por días (AAAA-MM-DD, ambos inclusive). Filtra por
   * creadoEn, que es la fecha real del registro; el campo "fecha" es solo texto
   * para mostrar y no sirve para comparar.
   */
  async listarHistorial(desde?: string, hasta?: string): Promise<ProduccionGuardada[]> {
    let limites: { gte?: Date; lt?: Date };
    try {
      limites = limitesDeRango(desde, hasta);
    } catch (err) {
      throw new BadRequestException(err instanceof Error ? err.message : "Rango de fechas inválido");
    }
    const filas = await this.prisma.produccion.findMany({
      where: limites.gte || limites.lt ? { creadoEn: limites } : undefined,
      orderBy: { creadoEn: "desc" },
    });
    return filas.map((f) => this.aDominio(f));
  }

  async eliminar(id: string): Promise<void> {
    const fila = await this.prisma.produccion.findUnique({ where: { id } });
    if (!fila) throw new NotFoundException(`No existe la producción "${id}"`);
    await this.prisma.produccion.delete({ where: { id } });
  }

  private validarTandas(tandas: TandasMap): TandasMap {
    const limpio: TandasMap = {};
    for (const [productoId, valor] of Object.entries(tandas ?? {})) {
      if (typeof valor !== "number" || !Number.isFinite(valor) || valor < 0) {
        throw new BadRequestException(`Las tandas de "${productoId}" deben ser un número >= 0`);
      }
      limpio[productoId] = valor;
    }
    return limpio;
  }

  private aDominio(fila: {
    id: string;
    fecha: string;
    hora: string;
    costoTotal: number;
    algunCostoConocido: boolean;
    productos: unknown;
    consumo: unknown;
    balance: unknown;
    creadoEn: Date;
  }): ProduccionGuardada {
    return {
      id: fila.id,
      dia: diaLocal(fila.creadoEn),
      creadoEn: fila.creadoEn.toISOString(),
      fecha: fila.fecha,
      hora: fila.hora,
      costoTotal: fila.costoTotal,
      algunCostoConocido: fila.algunCostoConocido,
      productos: fila.productos as ProduccionGuardada["productos"],
      consumo: fila.consumo as ProduccionGuardada["consumo"],
      balance: fila.balance as ProduccionGuardada["balance"],
    };
  }
}
