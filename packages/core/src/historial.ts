import type { ConsumoConsolidado, ProduccionGuardada } from "./types";

/** Lo producido en un día: la suma de todas las producciones guardadas ese día. */
export interface ResumenDia {
  dia: string;
  producciones: ProduccionGuardada[];
  cantidadProducciones: number;
  totalTandas: number;
  costoTotal: number;
  algunCostoConocido: boolean;
  /** true solo si todos los insumos consumidos tienen costo: si no, costoTotal es parcial. */
  costoCompleto: boolean;
  /** Tandas por producto, sumadas en el día, de mayor a menor. */
  productos: { nombre: string; tandas: number }[];
  /** Consumo por insumo, sumado en el día, de mayor a menor. */
  consumo: ConsumoConsolidado[];
}

export interface ResumenPeriodo {
  diasConProduccion: number;
  cantidadProducciones: number;
  totalTandas: number;
  costoTotal: number;
  algunCostoConocido: boolean;
  costoCompleto: boolean;
}

const FORMATO_DIA = /^(\d{4})-(\d{2})-(\d{2})$/;

/** AAAA-MM-DD de una fecha, en la zona horaria local. */
export function diaLocal(fecha: Date): string {
  const a = fecha.getFullYear();
  const m = String(fecha.getMonth() + 1).padStart(2, "0");
  const d = String(fecha.getDate()).padStart(2, "0");
  return `${a}-${m}-${d}`;
}

function inicioDelDia(dia: string): Date {
  const m = FORMATO_DIA.exec(dia);
  if (!m) throw new Error(`Fecha inválida "${dia}": se espera AAAA-MM-DD`);
  const fecha = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  // Rechaza fechas que JavaScript "corrige" en silencio, como 2026-02-31.
  if (diaLocal(fecha) !== dia) throw new Error(`Fecha inválida "${dia}"`);
  return fecha;
}

/**
 * Convierte un rango de días (inclusivo en ambos extremos) en límites de
 * tiempo para filtrar: desde las 00:00 de "desde" hasta antes de las 00:00
 * del día siguiente a "hasta", en hora local. Cualquier extremo puede faltar.
 */
export function limitesDeRango(desde?: string, hasta?: string): { gte?: Date; lt?: Date } {
  const limites: { gte?: Date; lt?: Date } = {};
  if (desde) limites.gte = inicioDelDia(desde);
  if (hasta) {
    const fin = inicioDelDia(hasta);
    limites.lt = new Date(fin.getFullYear(), fin.getMonth(), fin.getDate() + 1);
  }
  if (limites.gte && limites.lt && limites.gte >= limites.lt) {
    throw new Error("La fecha inicial no puede ser posterior a la final");
  }
  return limites;
}

function sumarConsumo(destino: Map<string, ConsumoConsolidado>, consumo: ConsumoConsolidado[]) {
  for (const c of consumo) {
    const previo = destino.get(c.insumoId);
    if (!previo) {
      destino.set(c.insumoId, { ...c });
      continue;
    }
    previo.totalGramos += c.totalGramos;
    // El costo solo existe si al menos una producción lo conocía.
    if (c.costo !== null) previo.costo = (previo.costo ?? 0) + c.costo;
  }
}

/** Agrupa las producciones por día, del más reciente al más antiguo. */
export function resumirPorDia(producciones: ProduccionGuardada[]): ResumenDia[] {
  const porDia = new Map<string, ProduccionGuardada[]>();
  for (const p of producciones) {
    const lista = porDia.get(p.dia) ?? [];
    lista.push(p);
    porDia.set(p.dia, lista);
  }

  const dias: ResumenDia[] = [];
  for (const [dia, lista] of porDia) {
    const ordenadas = [...lista].sort((a, b) => b.creadoEn.localeCompare(a.creadoEn));
    const productos = new Map<string, number>();
    const consumo = new Map<string, ConsumoConsolidado>();
    let totalTandas = 0;
    let costoTotal = 0;
    let algunCostoConocido = false;

    for (const p of ordenadas) {
      for (const prod of p.productos) {
        productos.set(prod.nombre, (productos.get(prod.nombre) ?? 0) + prod.tandas);
        totalTandas += prod.tandas;
      }
      sumarConsumo(consumo, p.consumo);
      if (p.algunCostoConocido) {
        algunCostoConocido = true;
        costoTotal += p.costoTotal;
      }
    }

    const consumoDia = [...consumo.values()].sort((a, b) => b.totalGramos - a.totalGramos);
    dias.push({
      dia,
      producciones: ordenadas,
      cantidadProducciones: ordenadas.length,
      totalTandas,
      costoTotal,
      algunCostoConocido,
      costoCompleto: consumoDia.length > 0 && consumoDia.every((c) => c.costo !== null),
      productos: [...productos]
        .map(([nombre, tandas]) => ({ nombre, tandas }))
        .sort((a, b) => b.tandas - a.tandas || a.nombre.localeCompare(b.nombre)),
      consumo: consumoDia,
    });
  }

  return dias.sort((a, b) => b.dia.localeCompare(a.dia));
}

/** Totales de todo el período filtrado. */
export function resumirPeriodo(dias: ResumenDia[]): ResumenPeriodo {
  return {
    diasConProduccion: dias.length,
    cantidadProducciones: dias.reduce((s, d) => s + d.cantidadProducciones, 0),
    totalTandas: dias.reduce((s, d) => s + d.totalTandas, 0),
    costoTotal: dias.reduce((s, d) => s + (d.algunCostoConocido ? d.costoTotal : 0), 0),
    algunCostoConocido: dias.some((d) => d.algunCostoConocido),
    costoCompleto: dias.length > 0 && dias.every((d) => d.costoCompleto),
  };
}
