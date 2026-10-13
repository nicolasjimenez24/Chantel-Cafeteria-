import { Calculator, RotateCcw } from "lucide-react";

interface BarraResumenProps {
  productosSeleccionados: number;
  totalTandas: number;
  puedeCalcular: boolean;
  onCalcular: () => void;
  onLimpiar: () => void;
}

export function BarraResumen({
  productosSeleccionados,
  totalTandas,
  puedeCalcular,
  onCalcular,
  onLimpiar,
}: BarraResumenProps) {
  return (
    <div
      className="no-print fixed bottom-0 left-0 right-0 z-40 border-t border-line-strong"
      style={{
        background: "color-mix(in srgb, var(--color-paper) 92%, transparent)",
        backdropFilter: "blur(8px)",
        boxShadow: "0 -1px 12px rgba(33,22,15,.07)",
      }}
    >
      <div className="max-w-6xl mx-auto px-5 md:px-8 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
        <div className="flex items-baseline gap-4 text-[12.5px] text-muted">
          <span>
            <span className="font-mono-num text-[17px] font-semibold text-ink">
              {productosSeleccionados}
            </span>{" "}
            producto{productosSeleccionados === 1 ? "" : "s"}
          </span>
          <span>
            <span className="font-mono-num text-[17px] font-semibold text-ink">{totalTandas}</span>{" "}
            porci{totalTandas === 1 ? "ón" : "ones"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onLimpiar} className="btn btn-ghost shrink-0" type="button">
            <RotateCcw size={14} /> Limpiar
          </button>
          <button
            onClick={onCalcular}
            disabled={!puedeCalcular}
            className="btn btn-primary flex-1 sm:flex-initial sm:px-6"
            type="button"
          >
            <Calculator size={16} />
            <span className="sm:hidden">Calcular</span>
            <span className="hidden sm:inline">Calcular producción</span>
          </button>
        </div>
      </div>
    </div>
  );
}
