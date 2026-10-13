import { Type } from "class-transformer";
import { ArrayMaxSize, IsArray, IsNumber, IsOptional, IsString, Min } from "class-validator";

export class CerrarDiaDto {
  /** Producciones guardadas cuyo consumo se descuenta de la bodega. */
  @IsArray()
  @ArrayMaxSize(1000)
  @IsString({ each: true })
  produccionIds!: string[];
}

export class GuardarBodegaDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  ingresos?: number;

  /** Puede ser negativa: un faltante que viene del cierre del día anterior. */
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  bodega?: number;
}
