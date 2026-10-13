import type { Producto, TandasMap, Categoria } from "@pasteleria/core";
import { metaDeCategoria } from "@/lib/categorias";
import { ProductoCard } from "./ProductoCard";

interface CategoriaSeccionProps {
  categoria: Categoria;
  productos: Producto[];
  tandasMap: TandasMap;
  onChangeTandas: (productoId: string, v: number) => void;
}

export function CategoriaSeccion({ categoria, productos, tandasMap, onChangeTandas }: CategoriaSeccionProps) {
  const { color, colorSoft, nota, icono: Icono } = metaDeCategoria(categoria);
  const seleccionados = productos.filter((p) => (tandasMap[p.id] || 0) > 0).length;
  const tandas = productos.reduce((s, p) => s + (tandasMap[p.id] || 0), 0);

  return (
    <section className="mb-9" aria-labelledby={`cat-${categoria}`}>
      <header className="flex items-center gap-3 mb-4">
        <span
          className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
          style={{ background: colorSoft, color }}
          aria-hidden="true"
        >
          <Icono size={18} strokeWidth={2} />
        </span>
        <h2 id={`cat-${categoria}`} className="font-display text-[26px] leading-none" style={{ color }}>
          {nota}
        </h2>
        <span className="font-mono-num text-[12px] font-semibold px-2.5 py-0.5 rounded-full" style={{ background: colorSoft, color }}>
          {productos.length}
        </span>
        <span className="h-px flex-1 bg-line" aria-hidden="true" />
        {seleccionados > 0 && (
          <span className="text-[12.5px] text-ink-soft whitespace-nowrap">
            <b className="font-mono-num" style={{ color }}>{seleccionados}</b> en la orden ·{" "}
            <b className="font-mono-num" style={{ color }}>{tandas}</b> porci{tandas === 1 ? "ón" : "ones"}
          </span>
        )}
      </header>

      <div className="grid gap-3.5 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
        {productos.map((p) => (
          <ProductoCard
            key={p.id}
            producto={p}
            tandas={tandasMap[p.id] || 0}
            onChange={(v) => onChangeTandas(p.id, v)}
          />
        ))}
      </div>
    </section>
  );
}
