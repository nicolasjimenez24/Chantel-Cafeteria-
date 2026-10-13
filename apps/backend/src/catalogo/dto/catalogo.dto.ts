import { Type } from "class-transformer";
import { IsArray, IsBoolean, IsIn, IsNumber, IsOptional, IsString, Length, Min, ValidateIf, ValidateNested } from "class-validator";
import type { Categoria } from "@pasteleria/core";
import { CATEGORIAS, RecetaItemDto } from "../../productos/dto/producto.dto";

export class CatalogoInsumoDto {
  @IsString()
  @Length(1, 60)
  id!: string;

  @IsString()
  @Length(1, 120)
  nombre!: string;

  @IsOptional()
  @IsString()
  unidad?: string;

  @ValidateIf((o: CatalogoInsumoDto) => o.costoPorKg !== null)
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  costoPorKg?: number | null;
}

export class CatalogoProductoDto {
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

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RecetaItemDto)
  ingredientes!: RecetaItemDto[];
}

export class CatalogoDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CatalogoInsumoDto)
  insumos!: CatalogoInsumoDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CatalogoProductoDto)
  productos!: CatalogoProductoDto[];
}
