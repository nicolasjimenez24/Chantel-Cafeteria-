import { describe, it, expect } from "vitest";
import { resumirPorDia, resumirPeriodo, limitesDeRango, diaLocal } from "./historial";
import type { ProduccionGuardada } from "./types";

function prod(
  id: string,
  dia: string,
  creadoEn: string,
  productos: { nombre: string; tandas: number }[],
  harinaG: number,
  costo: number | null,
): ProduccionGuardada {
  return {
    id,
    dia,
    creadoEn,
    fecha: dia,
    hora: "",
    productos,
    consumo: [
      { insumoId: "harina", nombre: "Harina", totalGramos: harinaG, costoPorKg: null, costo },
    ],
    costoTotal: costo ?? 0,
    algunCostoConocido: costo !== null,
    balance: [],
  };
}

describe("resumirPorDia", () => {
  const datos = [
    prod("a", "2026-10-06", "2026-10-06T14:00:00Z", [{ nombre: "Chocolate", tandas: 2 }], 1000, 5000),
    prod("b", "2026-10-07", "2026-10-07T13:00:00Z", [{ nombre: "Chocolate", tandas: 3 }], 3000, 15000),
    prod("c", "2026-10-07", "2026-10-07T18:00:00Z", [
      { nombre: "Chocolate", tandas: 1 },
      { nombre: "Flan", tandas: 4 },
    ], 500, 2500),
  ];

  it("agrupa por día, del más reciente al más antiguo", () => {
    const dias = resumirPorDia(datos);
    expect(dias.map((d) => d.dia)).toEqual(["2026-10-07", "2026-10-06"]);
  });

  it("dentro del día, la producción más reciente va primero", () => {
    const [hoy] = resumirPorDia(datos);
    expect(hoy.producciones.map((p) => p.id)).toEqual(["c", "b"]);
  });

  it("suma tandas por producto y en total", () => {
    const [hoy] = resumirPorDia(datos);
    expect(hoy.totalTandas).toBe(8);
    expect(hoy.productos).toEqual([
      { nombre: "Chocolate", tandas: 4 },
      { nombre: "Flan", tandas: 4 },
    ]);
  });

  it("suma consumo y gasto del día", () => {
    const [hoy] = resumirPorDia(datos);
    expect(hoy.consumo[0].totalGramos).toBe(3500);
    expect(hoy.consumo[0].costo).toBe(17500);
    expect(hoy.costoTotal).toBe(17500);
    expect(hoy.cantidadProducciones).toBe(2);
  });

  it("no altera los datos originales al sumar", () => {
    resumirPorDia(datos);
    expect(datos[1].consumo[0].totalGramos).toBe(3000);
  });

  it("deja el costo pendiente si ninguna producción del día lo conocía", () => {
    const [dia] = resumirPorDia([
      prod("x", "2026-10-07", "2026-10-07T10:00:00Z", [{ nombre: "Flan", tandas: 1 }], 100, null),
    ]);
    expect(dia.algunCostoConocido).toBe(false);
    expect(dia.consumo[0].costo).toBeNull();
  });

  it("totaliza el período", () => {
    const periodo = resumirPeriodo(resumirPorDia(datos));
    expect(periodo).toEqual({
      diasConProduccion: 2,
      cantidadProducciones: 3,
      totalTandas: 10,
      costoTotal: 22500,
      algunCostoConocido: true,
      costoCompleto: true,
    });
  });

  it("un historial vacío da un período en cero", () => {
    expect(resumirPeriodo(resumirPorDia([]))).toEqual({
      diasConProduccion: 0,
      cantidadProducciones: 0,
      totalTandas: 0,
      costoTotal: 0,
      algunCostoConocido: false,
      costoCompleto: false,
    });
  });

  it("marca el gasto como parcial si algún insumo no tiene costo", () => {
    const conHueco = prod("y", "2026-10-07", "2026-10-07T10:00:00Z", [{ nombre: "Flan", tandas: 1 }], 100, 800);
    conHueco.consumo.push({ insumoId: "picolo", nombre: "Picolo", totalGramos: 50, costoPorKg: null, costo: null });
    const dias = resumirPorDia([conHueco]);
    expect(dias[0].algunCostoConocido).toBe(true);
    expect(dias[0].costoCompleto).toBe(false);
    expect(resumirPeriodo(dias).costoCompleto).toBe(false);
  });

  it("un día con todos los costos es completo", () => {
    const [dia] = resumirPorDia([
      prod("z", "2026-10-07", "2026-10-07T10:00:00Z", [{ nombre: "Flan", tandas: 1 }], 100, 800),
    ]);
    expect(dia.costoCompleto).toBe(true);
  });
});

describe("limitesDeRango", () => {
  it("incluye el día final completo", () => {
    const { gte, lt } = limitesDeRango("2026-10-01", "2026-10-07");
    expect(diaLocal(gte!)).toBe("2026-10-01");
    expect(diaLocal(lt!)).toBe("2026-10-08");
    expect(lt!.getHours()).toBe(0);
  });

  it("un solo día cubre de 00:00 a 00:00 del siguiente", () => {
    const { gte, lt } = limitesDeRango("2026-10-07", "2026-10-07");
    expect(lt!.getTime() - gte!.getTime()).toBe(24 * 60 * 60 * 1000);
  });

  it("cruza bien el fin de mes y de año", () => {
    expect(diaLocal(limitesDeRango(undefined, "2026-10-31").lt!)).toBe("2026-11-01");
    expect(diaLocal(limitesDeRango(undefined, "2026-12-31").lt!)).toBe("2027-01-01");
  });

  it("sin fechas no limita nada", () => {
    expect(limitesDeRango()).toEqual({});
  });

  it("rechaza formatos y fechas inválidas", () => {
    expect(() => limitesDeRango("07/10/2026")).toThrow();
    expect(() => limitesDeRango("2026-02-31")).toThrow();
  });

  it("rechaza un rango invertido", () => {
    expect(() => limitesDeRango("2026-10-08", "2026-10-07")).toThrow();
  });
});
