import { Calculator, ClipboardList, Minus, Plus, RotateCcw, X } from "lucide-react";
import type { Producto, TandasMap } from "@pasteleria/core";
import { CATEGORIAS, metaDeCategoria } from "@/lib/categorias";

interface OrdenProduccionProps {
  productos: Producto[];
  tandasMap: TandasMap;
  onChangeTandas: (productoId: string, v: number) => void;
  onCalcular: () => void;
  onLimpiar: () => void;
}

/** Panel lateral con la orden del día: lo elegido, agrupado por categoría. */
export function OrdenProduccion({ productos, tandasMap, onChangeTandas, onCalcular, onLimpiar }: OrdenProduccionProps) {
  const orden = CATEGORIAS.flatMap((c) =>
    productos.filter((p) => p.categoria === c.id && (tandasMap[p.id] || 0) > 0)
  );
  const totalTandas = orden.reduce((s, p) => s + (tandasMap[p.id] || 0), 0);
  const vacia = orden.length === 0;

  return (
    <aside className="card flex flex-col max-h-[calc(100vh-2.5rem)] overflow-hidden" aria-label="Orden de producción">
      <div className="px-5 pt-4 pb-3 border-b border-line flex items-center justify-between gap-2">
        <div>
          <p className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-muted">Orden del día</p>
          <h2 className="font-display text-[22px] leading-tight text-plum">Producción</h2>
        </div>
        {!vacia && (
          <span className="font-mono-num text-[12px] font-semibold px-2.5 py-1 rounded-full bg-lilac text-plum">
            {orden.length} producto{orden.length === 1 ? "" : "s"}
          </span>
        )}
      </div>

      {vacia ? (
        <div className="px-6 py-10 text-center flex flex-col items-center">
          <span className="w-12 h-12 rounded-full bg-panel-alt text-muted flex items-center justify-center mb-3">
            <ClipboardList size={22} />
          </span>
          <p className="text-[14px] font-semibold text-ink">La orden está vacía</p>
          <p className="text-[12.5px] text-muted mt-1 max-w-[24ch]">
            Suma porciones a los productos y aparecerán aquí.
          </p>
        </div>
      ) : (
        <ul className="flex-1 overflow-y-auto px-2 py-2">
          {orden.map((p) => {
            const { color, icono: Icono } = metaDeCategoria(p.categoria);
            const tandas = tandasMap[p.id] || 0;
            return (
              <li key={p.id} className="group flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-panel-alt">
                <Icono size={15} style={{ color }} className="shrink-0" aria-hidden="true" />
                <span className="flex-1 min-w-0 text-[13.5px] font-medium truncate">{p.nombre}</span>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => onChangeTandas(p.id, tandas - 1)}
                    className="w-6 h-6 rounded-full text-muted hover:bg-lilac hover:text-plum flex items-center justify-center"
                    aria-label={`Restar porción de ${p.nombre}`}
                  >
                    <Minus size={13} strokeWidth={2.5} />
                  </button>
                  <span className="font-mono-num text-[14px] font-bold w-6 text-center" style={{ color }}>
                    {tandas}
                  </span>
                  <button
                    type="button"
                    onClick={() => onChangeTandas(p.id, tandas + 1)}
                    className="w-6 h-6 rounded-full text-muted hover:bg-lilac hover:text-plum flex items-center justify-center"
                    aria-label={`Sumar porción de ${p.nombre}`}
                  >
                    <Plus size={13} strokeWidth={2.5} />
                  </button>
                  <button
                    type="button"
                    onClick={() => onChangeTandas(p.id, 0)}
                    className="w-6 h-6 rounded-full text-muted hover:bg-berry-10 hover:text-berry flex items-center justify-center opacity-60 group-hover:opacity-100"
                    aria-label={`Quitar ${p.nombre} de la orden`}
                  >
                    <X size={13} strokeWidth={2.5} />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <div className="px-5 py-4 border-t border-line bg-panel-alt/60 mt-auto">
        <div className="flex items-baseline justify-between mb-3">
          <span className="text-[12.5px] text-muted">Total de porciones</span>
          <span className="font-mono-num text-[22px] font-semibold text-ink">{totalTandas}</span>
        </div>
        <button onClick={onCalcular} disabled={vacia} className="btn btn-primary w-full" type="button">
          <Calculator size={16} /> Calcular producción
        </button>
        <button
          onClick={onLimpiar}
          disabled={vacia}
          className="mt-2 w-full h-9 rounded-full text-[12.5px] font-semibold text-muted hover:text-plum hover:bg-panel flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-muted"
          type="button"
        >
          <RotateCcw size={13} /> Vaciar orden
        </button>
      </div>
    </aside>
  );
}
