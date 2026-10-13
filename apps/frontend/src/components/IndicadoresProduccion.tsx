import { ClipboardList, Layers, Scale, Warehouse } from "lucide-react";
import type { ResultadoProduccion } from "@pasteleria/core";
import { formatCantidad } from "@/lib/format";
import { Indicadores } from "./Indicadores";

interface IndicadoresProduccionProps {
  /** Cálculo en vivo de la orden actual; null cuando aún no hay nada elegido. */
  resultado: ResultadoProduccion | null;
  productosActivos: number;
}

export function IndicadoresProduccion({ resultado: r, productosActivos }: IndicadoresProduccionProps) {
  return (
    <Indicadores
      items={[
        {
          icono: ClipboardList,
          etiqueta: "Productos en la orden",
          valor: String(r?.cantidadProductos ?? 0),
          detalle: `de ${productosActivos} disponibles`,
          color: "var(--color-plum)",
        },
        {
          icono: Layers,
          etiqueta: "Porciones programadas",
          valor: String(r?.totalTandas ?? 0),
          detalle: r ? "en total para hoy" : "Aún no hay porciones",
          color: "var(--color-berry)",
        },
        {
          icono: Scale,
          etiqueta: "Insumos necesarios",
          valor: r ? String(r.consumoConsolidado.length) : "—",
          detalle: r
            ? `${formatCantidad(r.consumoConsolidado.reduce((s, c) => s + c.totalGramos, 0))} en total`
            : "Se calcula al elegir porciones",
          color: "var(--color-caramel)",
        },
        {
          icono: Warehouse,
          etiqueta: "Bodega",
          valor: !r ? "—" : r.insumosFaltantes === 0 ? "Suficiente" : String(r.insumosFaltantes),
          detalle: !r
            ? "Según lo registrado hoy"
            : r.insumosFaltantes === 0
              ? "Alcanza para la orden"
              : `insumo${r.insumosFaltantes === 1 ? "" : "s"} faltante${r.insumosFaltantes === 1 ? "" : "s"}`,
          color: !r || r.insumosFaltantes === 0 ? "var(--color-pistachio)" : "var(--color-berry)",
        },
      ]}
    />
  );
}
