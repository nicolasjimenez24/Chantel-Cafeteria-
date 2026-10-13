import { useMemo, useState } from "react";
import { Search, Trash2 } from "lucide-react";
import type { Catalogo } from "@pasteleria/core";
import { normalizar } from "@/lib/ids";
import { Modal } from "./Modal";

interface ListaInsumosModalProps {
  catalogo: Catalogo;
  onRenombrar: (id: string, nombre: string) => void;
  onEliminar: (id: string) => void;
  onClose: () => void;
}

/** Todos los insumos: renombrar, ver en qué recetas se usan y eliminar los que no se usan. */
export function ListaInsumosModal({ catalogo, onRenombrar, onEliminar, onClose }: ListaInsumosModalProps) {
  const [busqueda, setBusqueda] = useState("");
  const [porEliminar, setPorEliminar] = useState<string | null>(null);

  const usos = useMemo(() => {
    const m = new Map<string, string[]>();
    for (const p of catalogo.productos) {
      for (const ri of p.ingredientes) m.set(ri.insumoId, [...(m.get(ri.insumoId) ?? []), p.nombre]);
    }
    return m;
  }, [catalogo.productos]);

  const visibles = useMemo(() => {
    const q = normalizar(busqueda.trim());
    return catalogo.insumos
      .filter((i) => !q || normalizar(i.nombre).includes(q))
      .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
  }, [catalogo.insumos, busqueda]);

  return (
    <Modal
      ancho="lg"
      titulo="Insumos"
      subtitulo={`${catalogo.insumos.length} insumos. Puedes cambiar el nombre aquí; los que no usa ninguna receta se pueden eliminar.`}
      onClose={onClose}
      pie={
        <button onClick={onClose} className="btn btn-primary btn-sm" type="button">
          Listo
        </button>
      }
    >
      <div className="relative mb-3">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
        <input
          autoFocus
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar insumo…"
          className="field w-full h-10 !pl-9 pr-3 font-sans text-[14px] placeholder:text-muted"
          type="search"
        />
      </div>

      <ul className="border border-line rounded-xl divide-y divide-line">
        {visibles.map((ins) => {
          const recetas = usos.get(ins.id) ?? [];
          const confirmando = porEliminar === ins.id;
          return (
            <li key={ins.id} className="flex items-center gap-3 px-3 py-1.5">
              <input
                value={ins.nombre}
                onChange={(e) => onRenombrar(ins.id, e.target.value)}
                aria-label="Nombre del insumo"
                className="flex-1 min-w-0 bg-transparent text-[13.5px] font-medium text-ink px-2 h-9 rounded-lg border-[1.5px] border-transparent hover:border-line focus:border-plum outline-none"
              />
              {recetas.length > 0 ? (
                <span
                  className="text-[11.5px] font-semibold text-plum bg-lilac/60 rounded-full px-2.5 py-0.5 shrink-0 cursor-help"
                  title={recetas.join(", ")}
                >
                  {recetas.length} receta{recetas.length === 1 ? "" : "s"}
                </span>
              ) : confirmando ? (
                <span className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => {
                      onEliminar(ins.id);
                      setPorEliminar(null);
                    }}
                    className="h-8 px-3 rounded-full text-[12px] font-bold text-white bg-berry"
                    type="button"
                  >
                    Eliminar
                  </button>
                  <button
                    onClick={() => setPorEliminar(null)}
                    className="h-8 px-3 rounded-full text-[12px] font-semibold text-muted hover:bg-panel-alt"
                    type="button"
                  >
                    No
                  </button>
                </span>
              ) : (
                <span className="flex items-center gap-2 shrink-0">
                  <span className="text-[11.5px] text-muted">Sin usar</span>
                  <button
                    onClick={() => setPorEliminar(ins.id)}
                    className="w-8 h-8 rounded-full text-muted hover:text-berry hover:bg-berry-10 flex items-center justify-center"
                    aria-label={`Eliminar ${ins.nombre}`}
                    type="button"
                  >
                    <Trash2 size={14} />
                  </button>
                </span>
              )}
            </li>
          );
        })}
        {visibles.length === 0 && <li className="px-3 py-6 text-center text-[13px] text-muted">Ningún insumo coincide.</li>}
      </ul>
    </Modal>
  );
}
