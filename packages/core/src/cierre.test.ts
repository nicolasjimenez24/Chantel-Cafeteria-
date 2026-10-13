import { describe, expect, it } from "vitest";
import { proyectarCierre } from "./cierre";

describe("proyectarCierre", () => {
  it("pasa el total final a bodega y deja los ingresos en cero", () => {
    const { nuevaBodega, filas } = proyectarCierre(
      { harina: { ingresos: 1000, bodega: 500 } },
      [[{ insumoId: "harina", totalGramos: 400 }]]
    );
    expect(nuevaBodega).toEqual({ harina: { ingresos: 0, bodega: 1100 } });
    expect(filas[0]).toMatchObject({ totalBodega: 1500, gastos: 400, totalFinal: 1100, nuevaBodega: 1100 });
  });

  it("suma el consumo de varias producciones del mismo día", () => {
    const { nuevaBodega } = proyectarCierre({ azucar: { ingresos: 0, bodega: 1000 } }, [
      [{ insumoId: "azucar", totalGramos: 300 }],
      [{ insumoId: "azucar", totalGramos: 200 }],
    ]);
    expect(nuevaBodega.azucar.bodega).toBe(500);
  });

  it("un total negativo pasa tal cual a bodega, como faltante", () => {
    const { nuevaBodega, filas } = proyectarCierre(
      { huevo: { ingresos: 0, bodega: 100 } },
      [[{ insumoId: "huevo", totalGramos: 250 }, { insumoId: "leche", totalGramos: 50 }]]
    );
    expect(nuevaBodega).toEqual({
      huevo: { ingresos: 0, bodega: -150 },
      leche: { ingresos: 0, bodega: -50 },
    });
    expect(filas.find((f) => f.insumoId === "huevo")).toMatchObject({ totalFinal: -150, nuevaBodega: -150 });
  });

  it("el faltante se compensa con los ingresos del día siguiente", () => {
    const dia1 = proyectarCierre({ aceite: { ingresos: 0, bodega: 1000 } }, [[{ insumoId: "aceite", totalGramos: 48200 }]]);
    expect(dia1.nuevaBodega.aceite.bodega).toBe(-47200);
    const dia2 = proyectarCierre({ aceite: { ingresos: 50000, bodega: dia1.nuevaBodega.aceite.bodega } }, []);
    expect(dia2.nuevaBodega.aceite.bodega).toBe(2800);
  });

  it("un total final exactamente en cero sale de la bodega", () => {
    const { nuevaBodega } = proyectarCierre({ sal: { ingresos: 0, bodega: 30 } }, [[{ insumoId: "sal", totalGramos: 30 }]]);
    expect(nuevaBodega).toEqual({});
  });

  it("sin producciones, ingresos + bodega pasan completos", () => {
    const { nuevaBodega } = proyectarCierre({ sal: { ingresos: 20, bodega: 30 } }, []);
    expect(nuevaBodega).toEqual({ sal: { ingresos: 0, bodega: 50 } });
  });

  it("ignora insumos sin existencias ni consumo", () => {
    const { filas } = proyectarCierre({ vacio: { ingresos: 0, bodega: 0 } }, []);
    expect(filas).toHaveLength(0);
  });
});
