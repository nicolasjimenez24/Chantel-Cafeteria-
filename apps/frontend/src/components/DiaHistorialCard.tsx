import { useState } from "react";
import { ChevronDown, Download, FileSpreadsheet } from "lucide-react";
import type { ProduccionGuardada, ResumenDia } from "@pasteleria/core";
import { formatCantidad } from "@/lib/format";
import { nombreDelDia } from "@/lib/fechas";
import { HistorialEntrada } from "./HistorialEntrada";

interface DiaHistorialCardProps {
  resumen: ResumenDia;
  abiertoInicial?: boolean;
  /** Color de la categoría de cada producto, por nombre (para el punto de identidad). */
  colorDeProducto: (nombre: string) => string;
  onEliminar: (entrada: ProduccionGuardada) => void;
  onDescargar: (resumen: ResumenDia) => Promise<void>;
}

/** Hoja de calendario: número del día con mes y día de la semana. */
function HojaCalendario({ dia }: { dia: string }) {
  const [a, m, d] = dia.split("-").map(Number);
  const fecha = new Date(a, m - 1, d);
  return (
    <div className="w-14 shrink-0 rounded-xl overflow-hidden border border-line text-center bg-panel" aria-hidden="true">
      <div className="bg-plum text-white text-[10px] font-bold uppercase tracking-[0.1em] py-0.5">
        {fecha.toLocaleDateString("es-CO", { month: "short" }).replace(".", "")}
      </div>
      <div className="font-display text-[24px] leading-none text-plum pt-1">{d}</div>
      <div className="text-[10px] font-semibold uppercase text-muted pb-1">
        {fecha.toLocaleDateString("es-CO", { weekday: "short" }).replace(".", "")}
      </div>
    </div>
  );
}

export function DiaHistorialCard({
  resumen,
  abiertoInicial = false,
  colorDeProducto,
  onEliminar,
  onDescargar,
}: DiaHistorialCardProps) {
  const [abierto, setAbierto] = useState(abiertoInicial);
  const [descargando, setDescargando] = useState(false);
  const { principal, detalle } = nombreDelDia(resumen.dia);
  const n = resumen.cantidadProducciones;
  const peso = resumen.consumo.reduce((s, c) => s + c.totalGramos, 0);
  const maxTandas = Math.max(1, ...resumen.productos.map((p) => p.tandas));

  return (
    <article className={`card overflow-hidden transition-shadow ${abierto ? "shadow-[0_18px_40px_-28px_rgba(75,35,72,.55)]" : ""}`}>
      <button
        onClick={() => setAbierto((o) => !o)}
        className="w-full flex items-center gap-4 px-4 py-3.5 text-left hover:bg-panel-alt/50 transition-colors"
        type="button"
        aria-expanded={abierto}
      >
        <HojaCalendario dia={resumen.dia} />
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 flex-wrap">
            <h3 className="font-display text-[19px] leading-tight text-ink">{principal}</h3>
            {detalle && <span className="text-[12.5px] text-muted">{detalle}</span>}
          </div>
          <p className="text-[12.5px] text-muted mt-1 truncate">{resumen.productos.map((p) => p.nombre).join(" · ")}</p>
        </div>
        <dl className="hidden sm:flex items-center gap-5 shrink-0 text-right">
          {[
            { k: "Porciones", v: String(resumen.totalTandas) },
            { k: "Productos", v: String(resumen.productos.length) },
            { k: "Insumos", v: formatCantidad(peso) },
          ].map((s) => (
            <div key={s.k}>
              <dt className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted">{s.k}</dt>
              <dd className="font-mono-num text-[15px] font-semibold text-ink">{s.v}</dd>
            </div>
          ))}
        </dl>
        <ChevronDown size={18} className={`text-muted shrink-0 transition-transform ${abierto ? "rotate-180" : ""}`} />
      </button>

      {abierto && (
        <div className="border-t border-line bg-panel-alt/40 px-4 md:px-5 py-5 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-panel border border-line px-4 py-3">
            <div className="flex items-center gap-3 min-w-0">
              <span className="w-9 h-9 rounded-lg bg-pistachio-10 text-pistachio flex items-center justify-center shrink-0" aria-hidden="true">
                <FileSpreadsheet size={18} />
              </span>
              <div className="min-w-0">
                <p className="text-[13.5px] font-semibold text-ink">Reporte del día en Excel</p>
                <p className="text-[12px] text-muted">Resumen, productos, insumos, producciones y balance de bodega.</p>
              </div>
            </div>
            <button
              onClick={async () => {
                setDescargando(true);
                try {
                  await onDescargar(resumen);
                } finally {
                  setDescargando(false);
                }
              }}
              disabled={descargando}
              className="btn btn-primary btn-sm"
              type="button"
            >
              <Download size={14} /> {descargando ? "Generando…" : "Descargar Excel"}
            </button>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <h4 className="text-[11px] font-bold uppercase tracking-[0.1em] text-muted mb-2.5">
                Productos del día <span className="font-mono-num normal-case tracking-normal">({resumen.productos.length})</span>
              </h4>
              <ul className="rounded-xl border border-line bg-panel divide-y divide-line max-h-[358px] overflow-y-auto">
                {resumen.productos.map((p) => (
                  <li key={p.nombre} className="px-3.5 py-2.5">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: colorDeProducto(p.nombre) }} aria-hidden="true" />
                      <span className="flex-1 min-w-0 text-[13px] font-medium truncate">{p.nombre}</span>
                      <span className="font-mono-num text-[12.5px] font-semibold">
                        {p.tandas} porci{p.tandas === 1 ? "ón" : "ones"}
                      </span>
                    </div>
                    <div className="ml-4 mt-1.5 h-1 rounded-full bg-panel-alt overflow-hidden" aria-hidden="true">
                      <div className="h-full rounded-full bg-plum" style={{ width: `${(p.tandas / maxTandas) * 100}%` }} />
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-[11px] font-bold uppercase tracking-[0.1em] text-muted mb-2.5">
                Insumos consumidos <span className="font-mono-num normal-case tracking-normal">({resumen.consumo.length})</span>
              </h4>
              <div className="rounded-xl border border-line bg-panel max-h-[320px] overflow-y-auto">
                <table className="w-full text-[13px]">
                  <thead className="sticky top-0 bg-panel">
                    <tr className="text-[11px] font-bold uppercase tracking-[0.06em] text-muted border-b border-line">
                      <th className="text-left font-bold py-2 px-3.5">Insumo</th>
                      <th className="text-right font-bold py-2 px-3.5">Cantidad</th>
                    </tr>
                  </thead>
                  <tbody className="font-mono-num">
                    {resumen.consumo.map((c) => (
                      <tr key={c.insumoId} className="border-t border-line first:border-t-0">
                        <td className="py-1.5 px-3.5 font-sans text-ink-soft">{c.nombre}</td>
                        <td className="py-1.5 px-3.5 text-right font-medium">{formatCantidad(c.totalGramos)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-line-strong font-mono-num font-semibold bg-panel-alt">
                      <td className="py-2 px-3.5 font-sans">Total</td>
                      <td className="py-2 px-3.5 text-right">{formatCantidad(peso)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-[11px] font-bold uppercase tracking-[0.1em] text-muted mb-2.5">
              Producciones guardadas ({n})
            </h4>
            <div className="space-y-2">
              {resumen.producciones.map((p) => (
                <HistorialEntrada key={p.id} entrada={p} onEliminar={onEliminar} />
              ))}
            </div>
          </div>
        </div>
      )}
    </article>
  );
}
