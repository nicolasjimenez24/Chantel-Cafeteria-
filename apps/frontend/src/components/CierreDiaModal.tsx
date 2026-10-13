import { useMemo, useState } from "react";
import { ArrowRight, CalendarCheck, TriangleAlert } from "lucide-react";
import { proyectarCierre, type BodegaMap, type Insumo, type ProduccionPendiente } from "@pasteleria/core";
import { formatCantidad, formatConSigno } from "@/lib/format";
import { Modal } from "./Modal";

/** Producción calculada en pantalla que aún no está en el historial. */
export interface ProduccionCalculada {
  productos: { nombre: string; tandas: number }[];
  consumo: { insumoId: string; totalGramos: number }[];
}

interface CierreDiaModalProps {
  bodegaMap: BodegaMap;
  insumos: Insumo[];
  pendientes: ProduccionPendiente[];
  calculada: ProduccionCalculada | null;
  enviando: boolean;
  onConfirmar: (produccionIds: string[], incluirCalculada: boolean) => void;
  onClose: () => void;
}

// Clave reservada para la producción calculada, que todavía no tiene id.
const CALCULADA = "__calculada__";

function resumenProductos(p: { productos: { nombre: string; tandas: number }[] }): string {
  return p.productos.map((x) => `${x.nombre} ×${x.tandas}`).join(" · ");
}

export function CierreDiaModal({
  bodegaMap,
  insumos,
  pendientes,
  calculada,
  enviando,
  onConfirmar,
  onClose,
}: CierreDiaModalProps) {
  const [elegidas, setElegidas] = useState<Set<string>>(
    () => new Set([...pendientes.map((p) => p.id), ...(calculada ? [CALCULADA] : [])])
  );
  const nombre = useMemo(() => new Map(insumos.map((i) => [i.id, i.nombre])), [insumos]);

  const { filas } = useMemo(() => {
    const consumos = pendientes.filter((p) => elegidas.has(p.id)).map((p) => p.consumo);
    if (calculada && elegidas.has(CALCULADA)) consumos.push(calculada.consumo);
    return proyectarCierre(bodegaMap, consumos);
  }, [bodegaMap, pendientes, calculada, elegidas]);

  const faltante = (f: (typeof filas)[number]) => f.nuevaBodega < 0;
  const ordenadas = [...filas].sort((a, b) => {
    if (faltante(a) !== faltante(b)) return faltante(a) ? -1 : 1;
    return (nombre.get(a.insumoId) ?? "").localeCompare(nombre.get(b.insumoId) ?? "");
  });
  const negativos = filas.filter(faltante).length;
  const quedan = filas.filter((f) => f.nuevaBodega !== 0).length;

  const alternar = (id: string) =>
    setElegidas((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  return (
    <Modal
      ancho="lg"
      titulo="Cerrar día y pasar a bodega"
      subtitulo="Lo que quedó de cada insumo pasa a ser la bodega del día siguiente. Los ingresos quedan en cero para registrar los nuevos."
      onClose={onClose}
      pie={
        <>
          <button onClick={onClose} className="btn btn-ghost btn-sm" type="button">
            Cancelar
          </button>
          <button
            onClick={() => onConfirmar([...elegidas].filter((id) => id !== CALCULADA), elegidas.has(CALCULADA))}
            disabled={enviando || filas.length === 0}
            className="btn btn-primary btn-sm"
            type="button"
          >
            <CalendarCheck size={14} />
            {enviando ? "Cerrando…" : "Confirmar cierre"}
          </button>
        </>
      }
    >
      <h4 className="text-[11px] font-bold uppercase tracking-[0.1em] text-muted mb-2">
        Producciones a descontar
      </h4>
      {pendientes.length === 0 && !calculada ? (
        <p className="text-[13px] text-muted bg-panel-alt rounded-lg px-3 py-2.5 mb-5">
          No hay producciones calculadas ni guardadas. Se pasará la bodega tal como está, sin descontar consumo.
        </p>
      ) : (
        <ul className="space-y-1.5 mb-5">
          {calculada && (
            <li>
              <label className="flex items-start gap-3 px-3 py-2.5 rounded-lg border border-plum/30 bg-lilac/30 hover:bg-lilac/50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={elegidas.has(CALCULADA)}
                  onChange={() => alternar(CALCULADA)}
                  className="mt-0.5 w-4 h-4 shrink-0"
                />
                <span className="min-w-0">
                  <span className="block text-[13.5px] font-semibold">
                    Producción de hoy{" "}
                    <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-plum bg-lilac rounded-full px-2 py-0.5 ml-1">
                      se guardará al cerrar
                    </span>
                  </span>
                  <span className="block text-[12.5px] text-muted truncate">{resumenProductos(calculada)}</span>
                </span>
              </label>
            </li>
          )}
          {pendientes.map((p) => (
            <li key={p.id}>
              <label className="flex items-start gap-3 px-3 py-2.5 rounded-lg border border-line hover:bg-panel-alt cursor-pointer">
                <input
                  type="checkbox"
                  checked={elegidas.has(p.id)}
                  onChange={() => alternar(p.id)}
                  className="mt-0.5 w-4 h-4 shrink-0"
                />
                <span className="min-w-0">
                  <span className="block text-[13.5px] font-semibold">
                    {p.fecha} <span className="text-muted font-normal">· {p.hora}</span>
                  </span>
                  <span className="block text-[12.5px] text-muted truncate">{resumenProductos(p) || "Sin productos"}</span>
                </span>
              </label>
            </li>
          ))}
        </ul>
      )}

      <div className="flex items-baseline justify-between mb-2">
        <h4 className="text-[11px] font-bold uppercase tracking-[0.1em] text-muted">Así quedará la bodega</h4>
        <span className="text-[12px] text-muted">
          {quedan} insumo{quedan === 1 ? "" : "s"} pasan a bodega
        </span>
      </div>

      {negativos > 0 && (
        <p className="flex items-start gap-2 text-[12.5px] text-berry bg-berry-10 rounded-lg px-3 py-2 mb-2.5">
          <TriangleAlert size={15} className="shrink-0 mt-px" />
          <span>
            {negativos} insumo{negativos === 1 ? "" : "s"} pasan en negativo: se gastó más de lo registrado. El faltante
            se descontará de los ingresos del día siguiente.
          </span>
        </p>
      )}

      {filas.length === 0 ? (
        <p className="text-[13px] text-muted py-4 text-center">No hay existencias ni consumo para pasar.</p>
      ) : (
        <div className="border border-line rounded-xl overflow-hidden">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="thead-row">
                <th className="text-left font-semibold py-2 px-3">Insumo</th>
                <th className="text-right font-semibold py-2 px-3">Disponible</th>
                <th className="text-right font-semibold py-2 px-3">Gastos</th>
                <th className="text-right font-semibold py-2 px-3">Pasa a bodega</th>
              </tr>
            </thead>
            <tbody className="font-mono-num">
              {ordenadas.map((f) => (
                <tr key={f.insumoId} className="border-t border-line">
                  <td className="py-1.5 px-3 font-sans">{nombre.get(f.insumoId) ?? f.insumoId}</td>
                  <td className="py-1.5 px-3 text-right text-ink-soft">
                    {f.totalBodega === 0 ? <span className="text-muted">—</span> : formatConSigno(f.totalBodega)}
                  </td>
                  <td className="py-1.5 px-3 text-right text-ink-soft">
                    {f.gastos === 0 ? <span className="text-muted">—</span> : `− ${formatCantidad(f.gastos)}`}
                  </td>
                  <td className="py-1.5 px-3 text-right font-semibold">
                    <span className="inline-flex items-center gap-1.5" style={faltante(f) ? { color: "var(--color-berry)" } : undefined}>
                      <ArrowRight size={12} className="text-muted" aria-hidden="true" />
                      {formatConSigno(f.nuevaBodega)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Modal>
  );
}
