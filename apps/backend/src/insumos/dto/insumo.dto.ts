import { Type } from "class-transformer";
import { IsNumber, IsOptional, IsString, Length, Min, ValidateIf } from "class-validator";

export class CrearInsumoDto {
  @IsString()
  @Length(1, 60)
  id!: string;

  @IsString()
  @Length(1, 120)
  nombre!: string;

  @IsOptional()
  @IsString()
  unidad?: string;

  @ValidateIf((o: CrearInsumoDto) => o.costoPorKg !== null)
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  costoPorKg?: number | null;
}

export class ActualizarInsumoDto {
  @IsOptional()
  @IsString()
  @Length(1, 120)
  nombre?: string;

  @IsOptional()
  @IsString()
  unidad?: string;

  @ValidateIf((o: ActualizarInsumoDto) => o.costoPorKg !== null)
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  costoPorKg?: number | null;
}
