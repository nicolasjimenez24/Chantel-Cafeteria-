import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { ResultadoProducto } from "@pasteleria/core";
import { formatCantidad } from "@/lib/format";
import { colorDeCategoria } from "@/lib/categorias";

interface DetalleProductoCardProps {
  item: ResultadoProducto;
}

export function DetalleProductoCard({ item }: DetalleProductoCardProps) {
  const [abierto, setAbierto] = useState(false);
  const color = colorDeCategoria(item.categoria);

  return (
    <div className="card overflow-hidden">
      <button
        onClick={() => setAbierto((o) => !o)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left"
        type="button"
      >
        <div className="flex items-center gap-2 min-w-0">
          {abierto ? <ChevronDown size={15} className="text-muted shrink-0" /> : <ChevronRight size={15} className="text-muted shrink-0" />}
          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
          <div className="min-w-0">
            <div className="font-display text-[15.5px]">{item.nombre}</div>
            <div className="text-[12px] text-muted">
              {item.tandas} porci{item.tandas === 1 ? "ón" : "ones"}
            </div>
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="font-mono-num text-[13.5px] font-medium">
            {formatCantidad(item.items.reduce((s, it) => s + it.totalGramos, 0))}
          </div>
        </div>
      </button>
      {abierto && (
        <div className="px-4 pb-3">
          {item.sinReceta ? (
            <p className="text-[13px] text-muted py-2">
              Este producto todavía no tiene receta configurada en Recetas.
            </p>
          ) : (
            <table className="w-full text-[13px]">
              <thead>
                <tr className="text-muted">
                  <th className="text-left font-normal py-1">Ingrediente</th>
                  <th className="text-right font-normal py-1">Por porción</th>
                  <th className="text-right font-normal py-1">× {item.tandas}</th>
                  <th className="text-right font-normal py-1">Total</th>
                </tr>
              </thead>
              <tbody className="font-mono-num">
                {item.items.map((it) => (
                  <tr key={it.insumoId} className="border-t border-line">
                    <td className="py-1.5 font-sans">{it.nombre}</td>
                    <td className="py-1.5 text-right text-muted">{it.gramosPorTanda.toLocaleString("es-CO")} g</td>
                    <td className="py-1.5 text-right text-muted">{it.tandas}</td>
                    <td className="py-1.5 text-right font-medium">{formatCantidad(it.totalGramos)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
