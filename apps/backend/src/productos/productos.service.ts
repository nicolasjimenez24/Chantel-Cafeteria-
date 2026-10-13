import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import type { Categoria, Producto } from "@pasteleria/core";
import { PrismaService } from "../prisma/prisma.service";
import {
  ActualizarProductoDto,
  CrearProductoDto,
  RecetaItemDto,
  ReemplazarRecetaDto,
} from "./dto/producto.dto";

type FilaProducto = {
  id: string;
  nombre: string;
  categoria: string;
  activo: boolean;
  ingredientes: { insumoId: string; gramosPorTanda: number }[];
};

function aDominio(fila: FilaProducto): Producto {
  return {
    id: fila.id,
    nombre: fila.nombre,
    categoria: fila.categoria as Categoria,
    activo: fila.activo,
    ingredientes: fila.ingredientes.map((i) => ({
      insumoId: i.insumoId,
      gramosPorTanda: i.gramosPorTanda,
    })),
  };
}

@Injectable()
export class ProductosService {
  constructor(private readonly prisma: PrismaService) {}

  async listar(): Promise<Producto[]> {
    const filas = await this.prisma.producto.findMany({
      include: { ingredientes: true },
      orderBy: { nombre: "asc" },
    });
    return filas.map(aDominio);
  }

  async obtener(id: string): Promise<Producto> {
    const fila = await this.prisma.producto.findUnique({
      where: { id },
      include: { ingredientes: true },
    });
    if (!fila) throw new NotFoundException(`No existe el producto "${id}"`);
    return aDominio(fila);
  }

  async crear(dto: CrearProductoDto): Promise<Producto> {
    const existente = await this.prisma.producto.findUnique({ where: { id: dto.id } });
    if (existente) throw new ConflictException(`Ya existe un producto con el id "${dto.id}"`);

    const ingredientes = dto.ingredientes ?? [];
    await this.verificarInsumos(ingredientes);

    const fila = await this.prisma.producto.create({
      data: {
        id: dto.id,
        nombre: dto.nombre,
        categoria: dto.categoria,
        activo: dto.activo ?? true,
        ingredientes: { create: ingredientes },
      },
      include: { ingredientes: true },
    });
    return aDominio(fila);
  }

  async actualizar(id: string, dto: ActualizarProductoDto): Promise<Producto> {
    await this.obtener(id);
    const fila = await this.prisma.producto.update({
      where: { id },
      data: { nombre: dto.nombre, categoria: dto.categoria, activo: dto.activo },
      include: { ingredientes: true },
    });
    return aDominio(fila);
  }

  /** Reemplaza la receta completa: es como se edita en la pantalla de Administración. */
  async reemplazarReceta(id: string, dto: ReemplazarRecetaDto): Promise<Producto> {
    await this.obtener(id);
    await this.verificarInsumos(dto.ingredientes);

    const duplicados = dto.ingredientes.length !== new Set(dto.ingredientes.map((i) => i.insumoId)).size;
    if (duplicados) throw new BadRequestException("La receta tiene insumos repetidos");

    const fila = await this.prisma.$transaction(async (tx) => {
      await tx.recetaItem.deleteMany({ where: { productoId: id } });
      await tx.recetaItem.createMany({
        data: dto.ingredientes.map((i) => ({ productoId: id, ...i })),
      });
      return tx.producto.findUniqueOrThrow({ where: { id }, include: { ingredientes: true } });
    });
    return aDominio(fila);
  }

  async eliminar(id: string): Promise<void> {
    await this.obtener(id);
    await this.prisma.producto.delete({ where: { id } });
  }

  private async verificarInsumos(ingredientes: RecetaItemDto[]): Promise<void> {
    if (ingredientes.length === 0) return;
    const ids = [...new Set(ingredientes.map((i) => i.insumoId))];
    const encontrados = await this.prisma.insumo.findMany({
      where: { id: { in: ids } },
      select: { id: true },
    });
    const faltantes = ids.filter((id) => !encontrados.some((e) => e.id === id));
    if (faltantes.length > 0) {
      throw new BadRequestException(`Estos insumos no existen: ${faltantes.join(", ")}`);
    }
  }
}
