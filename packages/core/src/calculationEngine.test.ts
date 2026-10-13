import { describe, it, expect } from "vitest";
import { calcularProduccion } from "./calculationEngine";
import { PRODUCTOS_INICIALES, INSUMOS_INICIALES } from "./defaultCatalog";
import excel from "./excelCafeteria.fixture.json";

describe("motor de cálculo — cafetería", () => {
  it("reproduce los totales del Excel original, salvo las 4 correcciones confirmadas", () => {
    const p = excel.porciones as Record<string, number>;
    // Diferencia esperada respecto al Excel por cada corrección (cantidad × porciones del Excel)
    const ajustes: Record<string, number> = {
      harina_trigo: -130 * p.aromatica_de_hierbabuena,
      agua: +130 * p.aromatica_de_hierbabuena,
      claras_de_huevo: -130 * p.porcion_de_helado,
      helado: +130 * p.porcion_de_helado,
      azucar_pulverizada: -(400 - 40) * p.jugo_en_agua,
      huevos: -(650 - 100) * p.huevos_cremosos,
    };
    const r = calcularProduccion(p, PRODUCTOS_INICIALES, INSUMOS_INICIALES);
    const calculado = Object.fromEntries(r.consumoConsolidado.map((c) => [c.insumoId, c.totalGramos]));
    for (const [insumo, total] of Object.entries(excel.totales)) {
      const esperado = (total as number) + (ajustes[insumo] ?? 0);
      expect(calculado[insumo] ?? 0, insumo).toBeCloseTo(esperado, 6);
    }
    expect(calculado.claras_de_huevo).toBeUndefined();
  });

  it("el catálogo tiene 52 productos y 65 insumos, todos referenciados", () => {
    expect(PRODUCTOS_INICIALES).toHaveLength(52);
    expect(INSUMOS_INICIALES).toHaveLength(65);
    const ids = new Set(INSUMOS_INICIALES.map((i) => i.id));
    for (const p of PRODUCTOS_INICIALES) for (const i of p.ingredientes) expect(ids.has(i.insumoId), `${p.nombre}: ${i.insumoId}`).toBe(true);
  });

  it("multiplica por porciones: 3 cappuccinos calientes = 3 × la receta", () => {
    const r = calcularProduccion({ cappuccino_caliente: 3 }, PRODUCTOS_INICIALES, INSUMOS_INICIALES);
    const leche = r.consumoConsolidado.find((c) => c.insumoId === "leche_liquida");
    expect(leche?.totalGramos).toBe(600);
  });

  it("consolida un insumo usado por varios productos", () => {
    const r = calcularProduccion({ cafe_con_leche: 1, cappuccino_caliente: 1 }, PRODUCTOS_INICIALES, INSUMOS_INICIALES);
    const esperado = ["cafe_con_leche", "cappuccino_caliente"].reduce((s, id) => {
      const it = PRODUCTOS_INICIALES.find((p) => p.id === id)!.ingredientes.find((i) => i.insumoId === "leche_liquida");
      return s + (it?.gramosPorTanda ?? 0);
    }, 0);
    expect(r.consumoConsolidado.find((c) => c.insumoId === "leche_liquida")?.totalGramos).toBe(esperado);
  });

  it("ignora porciones en cero, negativas o inválidas", () => {
    const r = calcularProduccion({ empanada: 0, malteada: -2, soda_italiana: NaN as unknown as number }, PRODUCTOS_INICIALES, INSUMOS_INICIALES);
    expect(r.cantidadProductos).toBe(0);
  });

  it("balance de bodega: total final = ingresos + bodega − consumo", () => {
    const r = calcularProduccion({ empanada: 2 }, PRODUCTOS_INICIALES, INSUMOS_INICIALES, { empanada: { ingresos: 300, bodega: 100 } });
    const b = r.balance.find((x) => x.insumoId === "empanada")!;
    expect(b.totalBodega).toBe(400);
    expect(b.gastosDiarios).toBe(252);
    expect(b.totalFinal).toBe(148);
  });
});
