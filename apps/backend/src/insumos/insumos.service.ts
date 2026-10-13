import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import type { Insumo } from "@pasteleria/core";
import { PrismaService } from "../prisma/prisma.service";
import { ActualizarInsumoDto, CrearInsumoDto } from "./dto/insumo.dto";

@Injectable()
export class InsumosService {
  constructor(private readonly prisma: PrismaService) {}

  async listar(): Promise<Insumo[]> {
    const filas = await this.prisma.insumo.findMany({ orderBy: { nombre: "asc" } });
    return filas.map((f) => ({
      id: f.id,
      nombre: f.nombre,
      unidad: "g",
      costoPorKg: f.costoPorKg,
    }));
  }

  async obtener(id: string): Promise<Insumo> {
    const fila = await this.prisma.insumo.findUnique({ where: { id } });
    if (!fila) throw new NotFoundException(`No existe el insumo "${id}"`);
    return { id: fila.id, nombre: fila.nombre, unidad: "g", costoPorKg: fila.costoPorKg };
  }

  async crear(dto: CrearInsumoDto): Promise<Insumo> {
    const existente = await this.prisma.insumo.findUnique({ where: { id: dto.id } });
    if (existente) throw new ConflictException(`Ya existe un insumo con el id "${dto.id}"`);

    const fila = await this.prisma.insumo.create({
      data: {
        id: dto.id,
        nombre: dto.nombre,
        unidad: dto.unidad ?? "g",
        costoPorKg: dto.costoPorKg ?? null,
      },
    });
    return { id: fila.id, nombre: fila.nombre, unidad: "g", costoPorKg: fila.costoPorKg };
  }

  async actualizar(id: string, dto: ActualizarInsumoDto): Promise<Insumo> {
    await this.obtener(id);
    const fila = await this.prisma.insumo.update({
      where: { id },
      data: {
        nombre: dto.nombre,
        unidad: dto.unidad,
        costoPorKg: dto.costoPorKg === undefined ? undefined : dto.costoPorKg,
      },
    });
    return { id: fila.id, nombre: fila.nombre, unidad: "g", costoPorKg: fila.costoPorKg };
  }

  async eliminar(id: string): Promise<void> {
    await this.obtener(id);
    await this.prisma.insumo.delete({ where: { id } });
  }
}
