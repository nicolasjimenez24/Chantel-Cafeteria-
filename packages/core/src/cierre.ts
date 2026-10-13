import type { BodegaMap } from "./types";

export interface FilaCierre {
  insumoId: string;
  totalBodega: number;
  gastos: number;
  /** Total final del día: total bodega − gastos. Puede ser negativo. */
  totalFinal: number;
  /** Lo que queda como bodega del día siguiente: el total final, tal cual. */
  nuevaBodega: number;
}

/**
 * Cierre del día: el total final (ingresos + bodega − gastos) pasa exacto a ser
 * la bodega del día siguiente, y los ingresos vuelven a cero.
 *
 * Un total final negativo (se gastó más de lo registrado) también pasa: es un
 * faltante que se compensa con los ingresos del día siguiente, igual que en el Excel.
 */
export function proyectarCierre(
  bodegaMap: BodegaMap,
  consumos: { insumoId: string; totalGramos: number }[][]
): { filas: FilaCierre[]; nuevaBodega: BodegaMap } {
  const gastos = new Map<string, number>();
  for (const consumo of consumos) {
    for (const c of consumo) gastos.set(c.insumoId, (gastos.get(c.insumoId) || 0) + c.totalGramos);
  }

  const ids = new Set([...Object.keys(bodegaMap), ...gastos.keys()]);
  const filas: FilaCierre[] = [];
  const nuevaBodega: BodegaMap = {};

  for (const insumoId of ids) {
    const b = bodegaMap[insumoId];
    const totalBodega = (b?.ingresos || 0) + (b?.bodega || 0);
    const g = gastos.get(insumoId) || 0;
    if (totalBodega === 0 && g === 0) continue;

    const totalFinal = totalBodega - g;
    // Redondeo a 2 decimales para no arrastrar errores de punto flotante día tras día.
    const queda = Math.round(totalFinal * 100) / 100 || 0;
    filas.push({ insumoId, totalBodega, gastos: g, totalFinal, nuevaBodega: queda });
    if (queda !== 0) nuevaBodega[insumoId] = { ingresos: 0, bodega: queda };
  }

  return { filas, nuevaBodega };
}
