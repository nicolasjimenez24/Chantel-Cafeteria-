import type {
  Producto,
  Insumo,
  TandasMap,
  ResultadoProduccion,
  ResultadoProducto,
  ConsumoConsolidado,
  DetalleIngrediente,
  BodegaMap,
  BalanceInsumo,
} from "./types";

/**
 * Motor de cálculo de producción.
 *
 * Módulo puro: no depende de React, del DOM ni de almacenamiento.
 * Recibe el catálogo (productos + insumos) y un mapa de tandas por
 * producto, y devuelve el consumo consolidado y el costo.
 *
 * Reproduce la lógica del Excel original ("CONTROL DE INSUMOS FINAL"):
 *   cantidad_total(producto, insumo) = gramos_por_tanda × tandas
 *   consumo_total(insumo) = suma de cantidad_total en TODOS los productos
 *
 * A diferencia del Excel, la consolidación por insumo se calcula
 * recorriendo dinámicamente todas las recetas activas, en vez de sumar
 * fórmulas armadas a mano por insumo — eso fue lo que causaba que el
 * Excel original omitiera el azúcar de dos recetas en su total.
 */
export function calcularProduccion(
  tandasMap: TandasMap,
  productos: Producto[],
  insumos: Insumo[],
  bodegaMap: BodegaMap = {}
): ResultadoProduccion {
  const insumoPorId = new Map(insumos.map((i) => [i.id, i]));
  const consumoPorInsumo = new Map<string, number>();
  const porProducto: ResultadoProducto[] = [];

  let totalTandas = 0;
  let cantidadProductos = 0;

  for (const producto of productos) {
    const tandas = Number(tandasMap[producto.id]) || 0;
    if (tandas <= 0) continue;

    cantidadProductos += 1;
    totalTandas += tandas;

    let costoProducto = 0;
    let tieneTodosLosCostos = producto.ingredientes.length > 0;

    const items: DetalleIngrediente[] = producto.ingredientes.map((ri) => {
      const totalGramos = ri.gramosPorTanda * tandas;
      consumoPorInsumo.set(
        ri.insumoId,
        (consumoPorInsumo.get(ri.insumoId) || 0) + totalGramos
      );

      const insumo = insumoPorId.get(ri.insumoId);
      const tieneCosto = !!insumo && typeof insumo.costoPorKg === "number";
      const costoItem = tieneCosto
        ? (totalGramos / 1000) * (insumo!.costoPorKg as number)
        : null;

      if (!tieneCosto) tieneTodosLosCostos = false;
      if (costoItem !== null) costoProducto += costoItem;

      return {
        insumoId: ri.insumoId,
        nombre: insumo ? insumo.nombre : ri.insumoId,
        gramosPorTanda: ri.gramosPorTanda,
        tandas,
        totalGramos,
        costoPorKg: insumo ? insumo.costoPorKg : null,
        costoItem,
      };
    });

    porProducto.push({
      productoId: producto.id,
      nombre: producto.nombre,
      categoria: producto.categoria,
      tandas,
      items,
      costo: costoProducto,
      tieneTodosLosCostos,
      sinReceta: producto.ingredientes.length === 0,
    });
  }

  const consumoConsolidado: ConsumoConsolidado[] = Array.from(
    consumoPorInsumo.entries()
  )
    .map(([insumoId, totalGramos]) => {
      const insumo = insumoPorId.get(insumoId);
      const tieneCosto = !!insumo && typeof insumo.costoPorKg === "number";
      const costo = tieneCosto
        ? (totalGramos / 1000) * (insumo!.costoPorKg as number)
        : null;
      return {
        insumoId,
        nombre: insumo ? insumo.nombre : insumoId,
        totalGramos,
        costoPorKg: insumo ? insumo.costoPorKg : null,
        costo,
      };
    })
    .sort((a, b) => b.totalGramos - a.totalGramos);

  // Balance diario — replica las columnas E a M de la hoja TOTAL_DIA:
  //   TOTAL BODEGA  = INGRESOS + BODEGA
  //   GASTOS DIARIOS = consumo calculado de la producción
  //   TOTAL FINAL    = TOTAL BODEGA - GASTOS DIARIOS
  // Un TOTAL FINAL negativo significa que no alcanza el insumo para producir
  // lo programado (en el Excel original esto ocurría sin ninguna alerta).
  const idsBalance = new Set<string>([
    ...consumoPorInsumo.keys(),
    ...Object.keys(bodegaMap).filter((id) => {
      const b = bodegaMap[id];
      return (b?.ingresos || 0) !== 0 || (b?.bodega || 0) !== 0;
    }),
  ]);

  const balance: BalanceInsumo[] = Array.from(idsBalance)
    .map((insumoId) => {
      const insumo = insumoPorId.get(insumoId);
      const datos = bodegaMap[insumoId];
      const ingresos = datos?.ingresos || 0;
      const bodega = datos?.bodega || 0;
      const totalBodega = ingresos + bodega;
      const gastosDiarios = consumoPorInsumo.get(insumoId) || 0;
      const totalFinal = totalBodega - gastosDiarios;

      // Solo se marca "faltante" cuando el insumo tiene datos de bodega registrados
      // (ingresos o bodega > 0). Si nunca se registró stock para ese insumo, no hay
      // forma de saber si alcanza o no — no es un faltante real, solo falta el dato.
      const tieneDatosBodega = totalBodega !== 0;
      const faltante = tieneDatosBodega && totalFinal < 0;

      return {
        insumoId,
        nombre: insumo ? insumo.nombre : insumoId,
        ingresos,
        bodega,
        totalBodega,
        gastosDiarios,
        totalFinal,
        faltante,
      };
    })
    .sort((a, b) => {
      if (a.faltante !== b.faltante) return a.faltante ? -1 : 1;
      return a.totalFinal - b.totalFinal;
    });

  const insumosFaltantes = balance.filter((b) => b.faltante).length;

  const costoTotal = consumoConsolidado.reduce((s, c) => s + (c.costo || 0), 0);
  const todosLosCostosConocidos =
    consumoConsolidado.length > 0 && consumoConsolidado.every((c) => c.costo !== null);
  const algunCostoConocido = consumoConsolidado.some((c) => c.costo !== null);

  return {
    porProducto,
    consumoConsolidado,
    totalTandas,
    cantidadProductos,
    costoTotal,
    todosLosCostosConocidos,
    algunCostoConocido,
    balance,
    insumosFaltantes,
  };
}
