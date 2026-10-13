import { useState } from "react";

export interface PuntoDia {
  /** AAAA-MM-DD */
  dia: string;
  tandas: number;
}

function fechaCorta(dia: string, conDiaSemana = false): string {
  const [a, m, d] = dia.split("-").map(Number);
  return new Date(a, m - 1, d).toLocaleDateString("es-CO", {
    ...(conDiaSemana ? { weekday: "short" } : {}),
    day: "numeric",
    month: "short",
  });
}

/** Tope "redondo" del eje: 7 → 8, 23 → 25, 140 → 150. */
function topeRedondo(max: number): number {
  if (max <= 4) return 4;
  const paso = Math.pow(10, Math.floor(Math.log10(max)));
  for (const f of [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10]) if (f * paso >= max) return f * paso;
  return 10 * paso;
}

/**
 * Columnas de tandas por día (una sola serie). Al pasar el mouse sobre un día
 * se ve la fecha y sus tandas; el día con más tandas lleva su valor encima.
 */
export function GraficaTandasPorDia({ puntos }: { puntos: PuntoDia[] }) {
  const [activo, setActivo] = useState<number | null>(null);
  const max = Math.max(0, ...puntos.map((p) => p.tandas));
  const tope = topeRedondo(max);
  const iMax = puntos.findIndex((p) => p.tandas === max && max > 0);
  // Con muchos días, solo algunas etiquetas en el eje para que no se encimen.
  const cadaCuanto = Math.max(1, Math.ceil(puntos.length / 10));
  const ALTO = 168;

  return (
    <div className="relative select-none">
      <div className="flex">
        {/* Eje Y */}
        <div className="relative w-8 shrink-0 font-mono-num text-[10.5px] text-muted" style={{ height: ALTO }} aria-hidden="true">
          {[tope, tope / 2, 0].map((v, i) => (
            <span key={i} className="absolute right-2 -translate-y-1/2" style={{ top: `${(i / 2) * 100}%` }}>
              {Number.isInteger(v) ? v : v.toFixed(1)}
            </span>
          ))}
        </div>

        <div className="relative flex-1 min-w-0" style={{ height: ALTO }}>
          {/* Líneas guía */}
          {[0, 0.5, 1].map((f) => (
            <div key={f} className="absolute inset-x-0 border-t border-line" style={{ top: `${f * 100}%` }} aria-hidden="true" />
          ))}

          <div className="absolute inset-0 flex items-end gap-[2px]" role="list" aria-label="Porciones por día">
            {puntos.map((p, i) => {
              const h = tope > 0 ? (p.tandas / tope) * 100 : 0;
              const resaltado = activo === i;
              return (
                <div
                  key={p.dia}
                  role="listitem"
                  aria-label={`${fechaCorta(p.dia, true)}: ${p.tandas} porciones`}
                  className="relative flex-1 h-full flex items-end justify-center cursor-default"
                  onMouseEnter={() => setActivo(i)}
                  onMouseLeave={() => setActivo(null)}
                >
                  {resaltado && <div className="absolute inset-0 rounded-md bg-lilac/35" aria-hidden="true" />}
                  {i === iMax && activo === null && (
                    <span
                      className="absolute font-mono-num text-[11px] font-semibold text-ink"
                      style={{ bottom: `calc(${h}% + 4px)` }}
                    >
                      {p.tandas}
                    </span>
                  )}
                  <div
                    className="relative w-full max-w-[24px] rounded-t-[4px] transition-colors"
                    style={{
                      height: p.tandas > 0 ? `max(${h}%, 3px)` : 0,
                      background: resaltado ? "var(--color-plum-deep)" : "var(--color-plum)",
                    }}
                  />
                </div>
              );
            })}
          </div>

          {/* Detalle del día bajo el cursor */}
          {activo !== null && puntos[activo] && (
            <div
              className="absolute z-10 -translate-x-1/2 -translate-y-full pointer-events-none rounded-lg bg-forest text-white px-3 py-2 shadow-lg whitespace-nowrap"
              style={{
                left: `${((activo + 0.5) / puntos.length) * 100}%`,
                top: `calc(${100 - (tope > 0 ? (puntos[activo].tandas / tope) * 100 : 0)}% - 8px)`,
              }}
              role="status"
            >
              <p className="text-[11px] text-white/70">
                {(() => {
                  const t = fechaCorta(puntos[activo].dia, true);
                  return t.charAt(0).toUpperCase() + t.slice(1);
                })()}
              </p>
              <p className="text-[13px] font-semibold">
                {puntos[activo].tandas} porci{puntos[activo].tandas === 1 ? "ón" : "ones"}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Eje X */}
      <div className="flex pl-8 mt-1.5 gap-[2px]" aria-hidden="true">
        {puntos.map((p, i) => (
          <span key={p.dia} className="flex-1 min-w-0 text-center text-[10.5px] text-muted truncate">
            {i % cadaCuanto === 0 || i === puntos.length - 1 ? fechaCorta(p.dia) : ""}
          </span>
        ))}
      </div>
    </div>
  );
}
