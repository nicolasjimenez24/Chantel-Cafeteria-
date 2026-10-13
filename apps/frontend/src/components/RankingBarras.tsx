import { useState } from "react";
import type { LucideIcon } from "lucide-react";

export interface ItemRanking {
  clave: string;
  nombre: string;
  valor: number;
  /** Valor ya formateado para mostrar ("12 tandas", "3,40 kg"). */
  etiqueta: string;
  icono?: LucideIcon;
  /** Color del ícono (identidad de la categoría); la barra y el texto no lo usan. */
  colorIcono?: string;
}

interface RankingBarrasProps {
  titulo: string;
  subtitulo: string;
  items: ItemRanking[];
  vacio: string;
  /** Cuántos mostrar antes de "Ver todos". */
  limite?: number;
}

/** Lista ordenada de mayor a menor con una barra proporcional bajo cada nombre. */
export function RankingBarras({ titulo, subtitulo, items, vacio, limite = 6 }: RankingBarrasProps) {
  const [todos, setTodos] = useState(false);
  const max = Math.max(0, ...items.map((i) => i.valor));
  const visibles = todos ? items : items.slice(0, limite);

  return (
    <section className="card p-5">
      <h3 className="font-display text-[20px] leading-tight text-plum">{titulo}</h3>
      <p className="text-[12px] text-muted mt-0.5 mb-4">{subtitulo}</p>

      {items.length === 0 ? (
        <p className="text-[13px] text-muted py-3">{vacio}</p>
      ) : (
        <ol className="space-y-3">
          {visibles.map((it, idx) => {
            const Icono = it.icono;
            return (
              <li key={it.clave}>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="font-mono-num text-[11px] text-muted w-4 shrink-0">{idx + 1}</span>
                  {Icono && <Icono size={13} className="shrink-0" style={{ color: it.colorIcono }} aria-hidden="true" />}
                  <span className="flex-1 min-w-0 text-[13px] font-medium text-ink truncate">{it.nombre}</span>
                  <span className="font-mono-num text-[12.5px] font-semibold text-ink shrink-0">{it.etiqueta}</span>
                </div>
                <div className="ml-6 h-1.5 rounded-full bg-panel-alt overflow-hidden" aria-hidden="true">
                  <div
                    className="h-full rounded-full bg-plum"
                    style={{ width: `${max > 0 ? Math.max(2, (it.valor / max) * 100) : 0}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ol>
      )}

      {items.length > limite && (
        <button
          onClick={() => setTodos((t) => !t)}
          className="mt-4 text-[12.5px] font-semibold text-plum hover:underline"
          type="button"
        >
          {todos ? "Ver menos" : `Ver todos (${items.length})`}
        </button>
      )}
    </section>
  );
}
