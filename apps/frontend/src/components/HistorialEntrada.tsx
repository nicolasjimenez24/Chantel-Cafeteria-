import { useState } from "react";
import { ChevronDown, Clock, Trash2 } from "lucide-react";
import type { ProduccionGuardada } from "@pasteleria/core";
import { formatCantidad } from "@/lib/format";
import { horaDe } from "@/lib/fechas";

interface HistorialEntradaProps {
  entrada: ProduccionGuardada;
  onEliminar: (entrada: ProduccionGuardada) => void;
}

/** Una producción guardada, dentro de la tarjeta de su día. */
export function HistorialEntrada({ entrada, onEliminar }: HistorialEntradaProps) {
  const [abierto, setAbierto] = useState(false);
  const tandas = entrada.productos.reduce((s, p) => s + p.tandas, 0);
  const peso = entrada.consumo.reduce((s, c) => s + c.totalGramos, 0);

  return (
    <div className="rounded-xl border border-line bg-panel">
      <div className="flex items-start gap-3 px-3.5 py-3">
        <span className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full bg-panel-alt text-[12px] font-semibold text-ink-soft font-mono-num shrink-0">
          <Clock size={12} aria-hidden="true" /> {horaDe(entrada.creadoEn)}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap gap-1.5">
            {entrada.productos.map((p) => (
              <span key={p.nombre} className="inline-flex items-center gap-1 rounded-full border border-line px-2.5 py-0.5 text-[12.5px]">
                {p.nombre}
                <span className="font-mono-num font-semibold text-plum">×{p.tandas}</span>
              </span>
            ))}
          </div>
          <p className="text-[11.5px] text-muted mt-1.5">
            {tandas} porci{tandas === 1 ? "ón" : "ones"} · {formatCantidad(peso)} de insumos
          </p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => setAbierto((o) => !o)}
            className="h-8 px-2.5 rounded-full text-[12px] font-semibold text-plum hover:bg-lilac/60 flex items-center gap-1"
            type="button"
            aria-expanded={abierto}
          >
            Insumos
            <ChevronDown size={13} className={`transition-transform ${abierto ? "rotate-180" : ""}`} />
          </button>
          <button
            onClick={() => onEliminar(entrada)}
            className="w-8 h-8 rounded-full text-muted hover:text-berry hover:bg-berry-10 flex items-center justify-center"
            aria-label="Eliminar esta producción del historial"
            title="Eliminar del historial"
            type="button"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
      {abierto && (
        <div className="px-3.5 pb-3">
          <table className="w-full text-[12.5px]">
            <tbody className="font-mono-num">
              {entrada.consumo.map((c) => (
                <tr key={c.insumoId} className="border-t border-line">
                  <td className="py-1.5 font-sans text-ink-soft">{c.nombre}</td>
                  <td className="py-1.5 text-right">{formatCantidad(c.totalGramos)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
