import { useMemo } from "react";
import { BookOpen, CircleAlert, PackageSearch, Wheat, Save, Undo2 } from "lucide-react";
import { useApp } from "@/state/AppContext";
import { Indicadores } from "@/components/Indicadores";
import { AdminRecetas } from "./admin/AdminRecetas";

export function AdministracionPage() {
  const { catalogo, catalogoConCambios, guardandoCatalogo, persistirCatalogo, descartarCambiosCatalogo } = useApp();
  const { productos, insumos } = catalogo;

  const activos = productos.filter((p) => p.activo).length;
  const incompletas = productos.filter(
    (p) => p.ingredientes.length === 0 || p.ingredientes.some((i) => !(i.gramosPorTanda > 0))
  ).length;
  const sinUsar = useMemo(() => {
    const usados = new Set(productos.flatMap((p) => p.ingredientes.map((i) => i.insumoId)));
    return insumos.filter((i) => !usados.has(i.id)).length;
  }, [productos, insumos]);

  return (
    <div className={catalogoConCambios ? "pb-32" : "pb-12"}>
      <Indicadores
        items={[
          {
            icono: BookOpen,
            etiqueta: "Productos activos",
            valor: String(activos),
            detalle: `de ${productos.length} en el catálogo`,
            color: "var(--color-plum)",
          },
          {
            icono: CircleAlert,
            etiqueta: "Recetas por completar",
            valor: String(incompletas),
            detalle: incompletas === 0 ? "Todas tienen cantidades" : "sin insumos o en 0 g",
            color: incompletas === 0 ? "var(--color-pistachio)" : "var(--color-copper)",
          },
          {
            icono: Wheat,
            etiqueta: "Insumos",
            valor: String(insumos.length),
            detalle: "registrados en el sistema",
            color: "var(--color-berry)",
          },
          {
            icono: PackageSearch,
            etiqueta: "Insumos sin usar",
            valor: String(sinUsar),
            detalle: sinUsar === 0 ? "Todos están en alguna receta" : "no aparecen en ninguna receta",
            color: "var(--color-caramel)",
          },
        ]}
      />

      <AdminRecetas />

      {catalogoConCambios && (
        <div className="no-print fixed bottom-0 inset-x-0 z-40 px-4 pb-4 pointer-events-none">
          <div
            role="status"
            className="pointer-events-auto max-w-3xl mx-auto rounded-2xl bg-forest text-white shadow-2xl px-5 py-3.5 flex flex-wrap items-center gap-3"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-butter animate-pulse shrink-0" aria-hidden="true" />
            <div className="flex-1 min-w-[180px]">
              <p className="text-[14px] font-semibold leading-tight">Tienes cambios sin guardar</p>
              <p className="text-[12px] text-white/70">Guarda para que se apliquen en Producción y Bodega.</p>
            </div>
            <button
              onClick={descartarCambiosCatalogo}
              disabled={guardandoCatalogo}
              className="h-10 px-4 rounded-full text-[13px] font-semibold text-white/85 hover:bg-white/10 flex items-center gap-1.5"
              type="button"
            >
              <Undo2 size={14} /> Descartar
            </button>
            <button
              onClick={persistirCatalogo}
              disabled={guardandoCatalogo}
              className="h-10 px-5 rounded-full text-[13px] font-bold uppercase tracking-[0.05em] bg-butter text-forest hover:bg-white flex items-center gap-1.5 disabled:opacity-60"
              type="button"
            >
              <Save size={14} /> {guardandoCatalogo ? "Guardando…" : "Guardar cambios"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
