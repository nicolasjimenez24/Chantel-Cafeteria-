import { useMemo, useState } from "react";
import { Plus, Search, Sparkles } from "lucide-react";
import type { Insumo } from "@pasteleria/core";
import { normalizar } from "@/lib/ids";

interface BuscadorInsumoProps {
  /** Insumos que se pueden agregar (los que ya están en la receta no se ofrecen). */
  insumos: Insumo[];
  /** Todos los insumos del catálogo, para saber si un nombre ya existe. */
  todos: Insumo[];
  onElegir: (insumoId: string) => void;
  /** Crea un insumo nuevo con ese nombre y lo agrega a la receta. */
  onCrear: (nombre: string) => void;
}

type Opcion = { tipo: "insumo"; insumo: Insumo } | { tipo: "crear"; nombre: string };

/** Campo para agregar un ingrediente escribiendo su nombre. Se maneja con ↑ ↓ y Enter. */
export function BuscadorInsumo({ insumos, todos, onElegir, onCrear }: BuscadorInsumoProps) {
  const [texto, setTexto] = useState("");
  const [abierto, setAbierto] = useState(false);
  const [marcado, setMarcado] = useState(0);

  const opciones = useMemo<Opcion[]>(() => {
    const q = normalizar(texto.trim());
    const lista = [...insumos].sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
    const coinciden = (q ? lista.filter((i) => normalizar(i.nombre).includes(q)) : lista).slice(0, 8);
    const resultado: Opcion[] = coinciden.map((insumo) => ({ tipo: "insumo", insumo }));
    // Si el nombre escrito no existe en el catálogo, se ofrece crearlo.
    if (q && !todos.some((i) => normalizar(i.nombre) === q)) resultado.push({ tipo: "crear", nombre: texto.trim() });
    return resultado;
  }, [insumos, todos, texto]);

  const elegir = (o: Opcion) => {
    if (o.tipo === "insumo") onElegir(o.insumo.id);
    else onCrear(o.nombre);
    setTexto("");
    setMarcado(0);
    setAbierto(false);
  };

  return (
    <div className="relative">
      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
      <input
        id="buscador-insumo"
        value={texto}
        onChange={(e) => {
          setTexto(e.target.value);
          setMarcado(0);
          setAbierto(true);
        }}
        onFocus={() => setAbierto(true)}
        onBlur={() => setTimeout(() => setAbierto(false), 120)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setAbierto(true);
            setMarcado((m) => Math.min(m + 1, opciones.length - 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setMarcado((m) => Math.max(m - 1, 0));
          } else if (e.key === "Enter" && opciones[marcado]) {
            e.preventDefault();
            elegir(opciones[marcado]);
          } else if (e.key === "Escape") {
            setAbierto(false);
          }
        }}
        placeholder="Agregar ingrediente: escribe el nombre del insumo…"
        className="field w-full h-11 !pl-9 pr-3 font-sans text-[14px] placeholder:text-muted"
        role="combobox"
        aria-expanded={abierto}
        aria-controls="opciones-insumo"
        aria-autocomplete="list"
      />
      {abierto && (
        <ul
          id="opciones-insumo"
          role="listbox"
          className="absolute z-30 left-0 right-0 bottom-full mb-1.5 card p-1.5 max-h-72 overflow-y-auto shadow-xl"
        >
          {opciones.length === 0 ? (
            <li className="px-3 py-2.5 text-[13px] text-muted">
              {insumos.length === 0 ? "Todos los insumos ya están en la receta." : "Escribe para buscar o crear un insumo."}
            </li>
          ) : (
            opciones.map((o, idx) => {
              const activo = idx === marcado;
              return (
                <li
                  key={o.tipo === "insumo" ? o.insumo.id : "__crear__"}
                  role="option"
                  aria-selected={activo}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    elegir(o);
                  }}
                  onMouseEnter={() => setMarcado(idx)}
                  className={`flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-[13.5px] cursor-pointer ${
                    o.tipo === "crear" ? "mt-1 border-t border-line pt-2.5" : ""
                  } ${activo ? "bg-lilac text-plum" : "text-ink"}`}
                >
                  {o.tipo === "insumo" ? (
                    <>
                      <span className="truncate">{o.insumo.nombre}</span>
                      <Plus size={14} className={activo ? "opacity-100" : "opacity-0"} />
                    </>
                  ) : (
                    <span className="flex items-center gap-2 font-semibold text-plum">
                      <Sparkles size={14} /> Crear insumo “{o.nombre}” y agregarlo
                    </span>
                  )}
                </li>
              );
            })
          )}
        </ul>
      )}
    </div>
  );
}
