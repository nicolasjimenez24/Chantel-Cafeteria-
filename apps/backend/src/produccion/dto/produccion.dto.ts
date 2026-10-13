import { IsObject } from "class-validator";
import type { TandasMap } from "@pasteleria/core";

export class CalcularProduccionDto {
  /** { productoId: tandas }, igual que en el frontend. */
  @IsObject()
  tandas!: TandasMap;
}
