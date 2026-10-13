import { LayoutGrid } from "lucide-react";
import type { Categoria, Producto, TandasMap } from "@pasteleria/core";
import { CATEGORIAS } from "@/lib/categorias";

export type FiltroCategoria = Categoria | "todas";

interface FiltroCategoriasProps {
  valor: FiltroCategoria;
  onChange: (v: FiltroCategoria) => void;
  productos: Producto[];
  tandasMap: TandasMap;
}

/** Pestañas de categoría con el total de productos y cuántos van en la orden. */
export function FiltroCategorias({ valor, onChange, productos, tandasMap }: FiltroCategoriasProps) {
  const opciones = [
    { id: "todas" as const, label: "Todos", icono: LayoutGrid, color: "var(--color-plum)", items: productos },
    ...CATEGORIAS.map((c) => ({
      id: c.id,
      label: c.corta,
      icono: c.icono,
      color: c.color,
      items: productos.filter((p) => p.categoria === c.id),
    })),
  ];

  return (
    <div role="tablist" aria-label="Categorías" className="flex gap-2 overflow-x-auto scrollbar-none -mx-1 px-1 pt-2 pb-1">
      {opciones.map(({ id, label, icono: Icono, color, items }) => {
        const activo = valor === id;
        const enOrden = items.filter((p) => (tandasMap[p.id] || 0) > 0).length;
        return (
          <button
            key={id}
            role="tab"
            aria-selected={activo}
            onClick={() => onChange(id)}
            type="button"
            className="relative flex items-center gap-2 h-10 pl-3 pr-3.5 rounded-full text-[13px] font-semibold whitespace-nowrap shrink-0 transition-colors border-[1.5px]"
            style={
              activo
                ? { background: color, borderColor: color, color: "#fff" }
                : { background: "var(--color-panel)", borderColor: "var(--color-line-strong)", color: "var(--color-ink-soft)" }
            }
          >
            <Icono size={16} strokeWidth={2} style={activo ? undefined : { color }} />
            {label}
            <span
              className="font-mono-num text-[11.5px] min-w-[1.5rem] h-[1.375rem] px-1.5 rounded-full flex items-center justify-center"
              style={activo ? { background: "rgba(255,255,255,.22)" } : { background: "var(--color-panel-alt)", color: "var(--color-muted)" }}
            >
              {items.length}
            </span>
            {enOrden > 0 && (
              <span
                className="absolute -top-1.5 -right-1 min-w-[1.25rem] h-5 px-1 rounded-full text-[10.5px] font-bold font-mono-num flex items-center justify-center text-white ring-2 ring-paper"
                style={{ background: activo ? "var(--color-forest)" : color }}
                aria-label={`${enOrden} en la orden`}
              >
                {enOrden}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
