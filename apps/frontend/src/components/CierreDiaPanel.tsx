import { CalendarCheck, Eraser, History, RotateCcw } from "lucide-react";
import type { EstadoCierre } from "@pasteleria/core";

interface CierreDiaPanelProps {
  estado: EstadoCierre | null;
  /** Hay una producción calculada sin guardar: el cierre la guarda y la descuenta. */
  sinGuardar: boolean;
  hayExistencias: boolean;
  onCerrar: () => void;
  onDeshacer: () => void;
  onBorrarTodo: () => void;
}

function fechaHora(iso: string): string {
  return new Date(iso).toLocaleString("es-CO", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Panel lateral de Bodega: cierre del día y acciones sobre toda la bodega. */
export function CierreDiaPanel({ estado, sinGuardar, hayExistencias, onCerrar, onDeshacer, onBorrarTodo }: CierreDiaPanelProps) {
  const pendientes = (estado?.pendientes.length ?? 0) + (sinGuardar ? 1 : 0);
  const puedeCerrar = estado !== null && (pendientes > 0 || hayExistencias);

  return (
    <div className="space-y-4">
      <section className="card overflow-hidden" aria-labelledby="cierre-titulo">
        <div className="px-5 pt-4 pb-4 bg-forest text-white relative overflow-hidden">
          <CalendarCheck size={62} className="absolute -right-4 -top-3 text-white/10" aria-hidden="true" />
          <p className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-white/70">Fin de la jornada</p>
          <h2 id="cierre-titulo" className="font-display text-[23px] leading-tight mt-0.5">
            Cierre del día
          </h2>
          <p className="text-[12.5px] text-white/80 mt-1.5 leading-snug max-w-[30ch]">
            Lo que quedó en bodega pasa como bodega del día siguiente.
          </p>
        </div>

        <div className="px-5 py-4">
          <div className="flex items-center justify-between gap-3 mb-4">
            <span className="text-[13px] text-ink-soft">Producciones por descontar</span>
            <span
              className={`font-mono-num text-[13px] font-bold min-w-[1.75rem] h-7 px-2 rounded-full flex items-center justify-center ${
                pendientes > 0 ? "bg-butter text-caramel" : "bg-panel-alt text-muted"
              }`}
            >
              {estado ? pendientes : "…"}
            </span>
          </div>

          {sinGuardar && (
            <p className="text-[12px] text-ink-soft bg-lilac/40 rounded-lg px-3 py-2 mb-3 leading-snug">
              La producción que calculaste hoy se guardará en el historial y su total final pasará a bodega.
            </p>
          )}
          <button onClick={onCerrar} disabled={!puedeCerrar} className="btn btn-primary w-full" type="button">
            <CalendarCheck size={16} /> Cerrar día
          </button>
          <p className="text-[11.5px] text-muted mt-2 text-center leading-snug">
            Verás una vista previa antes de confirmar.
          </p>
        </div>

        {estado?.ultimoCierre && (
          <div className="px-5 py-3 border-t border-line bg-panel-alt/60 flex items-center gap-3">
            <History size={15} className="text-muted shrink-0" aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <p className="text-[12px] text-muted leading-tight">Último cierre</p>
              <p className="text-[13px] font-semibold text-ink truncate">{fechaHora(estado.ultimoCierre.creadoEn)}</p>
            </div>
            <button
              onClick={onDeshacer}
              className="h-8 px-3 rounded-full text-[12px] font-semibold text-plum hover:bg-lilac flex items-center gap-1.5 shrink-0"
              type="button"
            >
              <RotateCcw size={12} /> Deshacer
            </button>
          </div>
        )}
      </section>

      <button
        onClick={onBorrarTodo}
        disabled={!hayExistencias}
        className="w-full h-10 rounded-full text-[12.5px] font-semibold text-muted border-[1.5px] border-line-strong hover:text-berry hover:border-berry flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:hover:text-muted disabled:hover:border-line-strong"
        type="button"
      >
        <Eraser size={13} /> Borrar todos los datos de bodega
      </button>
    </div>
  );
}
