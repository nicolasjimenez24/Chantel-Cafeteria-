import { Type } from "class-transformer";
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Min,
  ValidateNested,
} from "class-validator";
import type { Categoria } from "@pasteleria/core";

export const CATEGORIAS: Categoria[] = ["Bebidas calientes", "Bebidas frías", "Comidas", "Helados y postres"];

export class RecetaItemDto {
  @IsString()
  @Length(1, 60)
  insumoId!: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  gramosPorTanda!: number;
}

export class CrearProductoDto {
  @IsString()
  @Length(1, 60)
  id!: string;

  @IsString()
  @Length(1, 120)
  nombre!: string;

  @IsIn(CATEGORIAS)
  categoria!: Categoria;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RecetaItemDto)
  ingredientes?: RecetaItemDto[];
}

export class ActualizarProductoDto {
  @IsOptional()
  @IsString()
  @Length(1, 120)
  nombre?: string;

  @IsOptional()
  @IsIn(CATEGORIAS)
  categoria?: Categoria;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}

export class ReemplazarRecetaDto {
  @IsArray()
  @ArrayMinSize(0)
  @ValidateNested({ each: true })
  @Type(() => RecetaItemDto)
  ingredientes!: RecetaItemDto[];
}
