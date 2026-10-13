import type { LucideIcon } from "lucide-react";

export interface Indicador {
  icono: LucideIcon;
  etiqueta: string;
  valor: string;
  detalle: string;
  color: string;
}

/** Fila de tarjetas de resumen (KPI) que encabeza cada sección. */
export function Indicadores({ items }: { items: Indicador[] }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
      {items.map(({ icono: Icono, etiqueta, valor, detalle, color }) => (
        <div key={etiqueta} className="card px-3.5 sm:px-4 py-3.5 flex items-start gap-3 min-w-0">
          <span
            className="hidden sm:flex w-9 h-9 rounded-lg items-center justify-center shrink-0"
            style={{ background: `color-mix(in srgb, ${color} 12%, white)`, color }}
            aria-hidden="true"
          >
            <Icono size={18} strokeWidth={2} />
          </span>
          <div className="min-w-0">
            <p className="text-[10px] sm:text-[10.5px] font-bold uppercase tracking-[0.08em] sm:tracking-[0.1em] text-muted leading-tight sm:truncate">
              {etiqueta}
            </p>
            <p className="font-mono-num text-[19px] sm:text-[22px] md:text-[24px] font-semibold leading-tight text-ink truncate mt-0.5">
              {valor}
            </p>
            <p className="text-[11.5px] sm:text-[12px] text-muted leading-snug sm:truncate">{detalle}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
