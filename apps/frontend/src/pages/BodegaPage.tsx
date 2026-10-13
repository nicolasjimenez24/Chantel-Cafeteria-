import { useCallback, useEffect, useMemo, useState } from "react";
import { Boxes, PackageCheck, PackagePlus, Scale, Search, SearchX, X } from "lucide-react";
import type { EstadoCierre } from "@pasteleria/core";
import { useApp } from "@/state/AppContext";
import { ApiError } from "@/lib/api";
import { formatCantidad, formatConSigno } from "@/lib/format";
import { cargarEstadoCierre, cerrarDia, deshacerUltimoCierre } from "@/lib/persistence";
import { BalanceDiaTabla } from "@/components/BalanceDiaTabla";
import { Indicadores } from "@/components/Indicadores";
import { CierreDiaPanel } from "@/components/CierreDiaPanel";
import { CierreDiaModal } from "@/components/CierreDiaModal";
import { Modal } from "@/components/Modal";

function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

type Filtro = "todos" | "existencias" | "faltantes" | "ingresos" | "sin";

const FILTROS: { id: Filtro; label: string }[] = [
  { id: "todos", label: "Todos" },
  { id: "existencias", label: "Con existencias" },
  { id: "faltantes", label: "Con faltante" },
  { id: "ingresos", label: "Con ingresos hoy" },
  { id: "sin", label: "Sin registrar" },
];

function CampoGramos({
  valor,
  onChange,
  etiqueta,
  permitirNegativo = false,
}: {
  valor: number;
  onChange: (v: number) => void;
  etiqueta: string;
  /** La bodega puede venir negativa del cierre anterior (faltante). */
  permitirNegativo?: boolean;
}) {
  return (
    <div className="relative inline-block">
      <input
        type="number"
        min={permitirNegativo ? undefined : 0}
        step="any"
        inputMode="decimal"
        value={valor === 0 ? "" : valor}
        placeholder="0"
        aria-label={etiqueta}
        onChange={(e) => {
          const v = parseFloat(e.target.value) || 0;
          onChange(permitirNegativo ? v : Math.max(0, v));
        }}
        className={`field w-[7.5rem] pl-2 pr-6 text-right placeholder:text-muted/60 ${valor < 0 ? "text-berry font-semibold" : ""}`}
      />
      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11.5px] text-muted pointer-events-none">g</span>
    </div>
  );
}

export function BodegaPage() {
  const {
    catalogo,
    bodegaMap,
    actualizarBodega,
    limpiarBodega,
    reemplazarBodega,
    resultado,
    produccionSinGuardar,
    guardarResultadoPendiente,
    iniciarNuevoDia,
    notify,
  } = useApp();
  const [busqueda, setBusqueda] = useState("");
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [estado, setEstado] = useState<EstadoCierre | null>(null);
  const [dialogo, setDialogo] = useState<"cierre" | "deshacer" | "borrar" | null>(null);
  const [enviando, setEnviando] = useState(false);

  const recargarEstado = useCallback(() => {
    cargarEstadoCierre()
      .then(setEstado)
      .catch((err) => notify(err instanceof ApiError ? err.message : "No se pudo consultar el cierre del día"));
  }, [notify]);

  useEffect(recargarEstado, [recargarEstado]);

  const datos = (id: string) => bodegaMap[id] ?? { ingresos: 0, bodega: 0 };
  const total = (id: string) => (datos(id).ingresos || 0) + (datos(id).bodega || 0);

  const conteo = useMemo(() => {
    const c = { todos: catalogo.insumos.length, existencias: 0, faltantes: 0, ingresos: 0, sin: 0 };
    for (const i of catalogo.insumos) {
      const b = bodegaMap[i.id];
      const t = (b?.ingresos || 0) + (b?.bodega || 0);
      if (t > 0) c.existencias++;
      else if (t < 0) c.faltantes++;
      else c.sin++;
      if ((b?.ingresos || 0) > 0) c.ingresos++;
    }
    return c;
  }, [catalogo.insumos, bodegaMap]);

  const visibles = useMemo(() => {
    const q = normalizar(busqueda.trim());
    return catalogo.insumos
      .filter((i) => {
        const b = bodegaMap[i.id];
        const t = (b?.ingresos || 0) + (b?.bodega || 0);
        if (filtro === "existencias" && t <= 0) return false;
        if (filtro === "ingresos" && (b?.ingresos || 0) <= 0) return false;
        if (filtro === "faltantes" && t >= 0) return false;
        if (filtro === "sin" && t !== 0) return false;
        return !q || normalizar(i.nombre).includes(q);
      })
      .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
  }, [catalogo.insumos, bodegaMap, busqueda, filtro]);

  const totales = useMemo(
    () =>
      catalogo.insumos.reduce(
        (acc, i) => {
          const b = bodegaMap[i.id];
          return { ingresos: acc.ingresos + (b?.ingresos || 0), bodega: acc.bodega + (b?.bodega || 0) };
        },
        { ingresos: 0, bodega: 0 }
      ),
    [catalogo.insumos, bodegaMap]
  );
  const totalesVisibles = visibles.reduce(
    (acc, i) => ({
      ingresos: acc.ingresos + (datos(i.id).ingresos || 0),
      bodega: acc.bodega + (datos(i.id).bodega || 0),
    }),
    { ingresos: 0, bodega: 0 }
  );

  const pendientes = (estado?.pendientes.length ?? 0) + (produccionSinGuardar ? 1 : 0);

  const calculada = useMemo(
    () =>
      produccionSinGuardar && resultado
        ? {
            productos: resultado.porProducto.map((p) => ({ nombre: p.nombre, tandas: p.tandas })),
            consumo: resultado.consumoConsolidado.map((c) => ({ insumoId: c.insumoId, totalGramos: c.totalGramos })),
          }
        : null,
    [produccionSinGuardar, resultado]
  );

  const confirmarCierre = async (ids: string[], incluirCalculada: boolean) => {
    setEnviando(true);
    try {
      // La producción calculada se guarda primero en el historial, para que su
      // consumo quede registrado y se descuente igual que las demás.
      // Guardar la producción calculada ya la descuenta y pasa su total final a bodega.
      if (incluirCalculada) await guardarResultadoPendiente();
      if (ids.length > 0 || !incluirCalculada) {
        reemplazarBodega((await cerrarDia(ids)).bodega);
      }
      iniciarNuevoDia();
      setDialogo(null);
      notify("Día cerrado: el total final ya está en bodega");
    } catch (err) {
      notify(err instanceof ApiError ? err.message : "No se pudo cerrar el día");
    } finally {
      setEnviando(false);
      recargarEstado();
    }
  };

  const confirmarDeshacer = async () => {
    setEnviando(true);
    try {
      reemplazarBodega(await deshacerUltimoCierre());
      setDialogo(null);
      notify("Cierre deshecho: la bodega volvió a como estaba");
    } catch (err) {
      notify(err instanceof ApiError ? err.message : "No se pudo deshacer el cierre");
    } finally {
      setEnviando(false);
      recargarEstado();
    }
  };

  return (
    <div className="pb-12">
      <Indicadores
        items={[
          {
            icono: PackageCheck,
            etiqueta: "Insumos con existencias",
            valor: String(conteo.existencias),
            detalle: `de ${conteo.todos} insumos`,
            color: "var(--color-pistachio)",
          },
          {
            icono: Boxes,
            etiqueta: "Bodega inicial",
            valor: formatConSigno(totales.bodega),
            detalle: "lo que había al empezar",
            color: "var(--color-plum)",
          },
          {
            icono: PackagePlus,
            etiqueta: "Ingresos de hoy",
            valor: formatCantidad(totales.ingresos),
            detalle: `${conteo.ingresos} insumo${conteo.ingresos === 1 ? "" : "s"} recibido${conteo.ingresos === 1 ? "" : "s"}`,
            color: "var(--color-caramel)",
          },
          {
            icono: Scale,
            etiqueta: "Total disponible",
            valor: formatConSigno(totales.ingresos + totales.bodega),
            detalle:
              conteo.faltantes > 0
                ? `${conteo.faltantes} insumo${conteo.faltantes === 1 ? "" : "s"} con faltante`
                : pendientes > 0
                  ? `${pendientes} producción${pendientes === 1 ? "" : "es"} por cerrar`
                  : "ingresos + bodega",
            color: "var(--color-berry)",
          },
        ]}
      />

      <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_300px] items-start">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 mb-4">
            <div role="tablist" aria-label="Filtrar insumos" className="flex gap-1 p-1 rounded-full bg-panel border border-line overflow-x-auto scrollbar-none max-w-full">
              {FILTROS.map((f) => {
                const activo = filtro === f.id;
                return (
                  <button
                    key={f.id}
                    role="tab"
                    aria-selected={activo}
                    onClick={() => setFiltro(f.id)}
                    type="button"
                    className={`h-8 px-3 rounded-full text-[12.5px] font-semibold whitespace-nowrap flex items-center gap-1.5 transition-colors ${
                      activo ? "bg-plum text-white" : "text-ink-soft hover:bg-panel-alt"
                    }`}
                  >
                    {f.label}
                    <span className={`font-mono-num text-[11px] ${activo ? "text-white/70" : "text-muted"}`}>{conteo[f.id]}</span>
                  </button>
                );
              })}
            </div>
            <div className="relative flex-1 min-w-[200px]">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
              <input
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar insumo…"
                className="field w-full h-10 !pl-9 !pr-9 font-sans text-[14px] placeholder:text-muted"
                type="search"
              />
              {busqueda && (
                <button
                  onClick={() => setBusqueda("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-ink"
                  aria-label="Borrar búsqueda"
                  type="button"
                >
                  <X size={15} />
                </button>
              )}
            </div>
          </div>

          <div className="card overflow-x-auto">
            <table className="w-full text-[13.5px] min-w-[560px]">
              <thead>
                <tr className="thead-row border-b border-line">
                  <th className="text-left font-semibold py-3 px-4">Insumo</th>
                  <th className="text-right font-semibold py-3 px-3">Ingresos hoy</th>
                  <th className="text-right font-semibold py-3 px-3">Bodega</th>
                  <th className="text-right font-semibold py-3 px-4">Total disponible</th>
                </tr>
              </thead>
              <tbody>
                {visibles.map((insumo) => {
                  const d = datos(insumo.id);
                  const t = total(insumo.id);
                  return (
                    <tr key={insumo.id} className={`border-t border-line first:border-t-0 transition-colors ${t > 0 ? "" : "bg-panel-alt/40"}`}>
                      <td className="py-2 px-4">
                        <span className="flex items-center gap-2.5">
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{
                              background:
                                t > 0 ? "var(--color-pistachio)" : t < 0 ? "var(--color-berry)" : "var(--color-line-strong)",
                            }}
                            aria-hidden="true"
                          />
                          <span className={t !== 0 ? "font-medium text-ink" : "text-ink-soft"}>{insumo.nombre}</span>
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right">
                        <CampoGramos
                          valor={d.ingresos}
                          etiqueta={`Ingresos de ${insumo.nombre}`}
                          onChange={(v) => actualizarBodega(insumo.id, "ingresos", v)}
                        />
                      </td>
                      <td className="py-2 px-3 text-right">
                        <CampoGramos
                          valor={d.bodega}
                          etiqueta={`Bodega de ${insumo.nombre}`}
                          onChange={(v) => actualizarBodega(insumo.id, "bodega", v)}
                          permitirNegativo
                        />
                      </td>
                      <td className={`py-2 px-4 text-right font-mono-num font-semibold ${t < 0 ? "text-berry" : ""}`}>
                        {t === 0 ? <span className="text-muted font-normal">—</span> : formatConSigno(t)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              {visibles.length > 0 && (
                <tfoot>
                  <tr className="border-t-2 border-line-strong font-mono-num font-semibold bg-panel-alt">
                    <td className="py-3 px-4 font-sans">
                      Total{visibles.length < catalogo.insumos.length ? " (filtrado)" : ""}
                    </td>
                    <td className="py-3 px-3 text-right pr-9">{formatCantidad(totalesVisibles.ingresos)}</td>
                    <td className="py-3 px-3 text-right pr-9">{formatConSigno(totalesVisibles.bodega)}</td>
                    <td className="py-3 px-4 text-right">
                      {formatConSigno(totalesVisibles.ingresos + totalesVisibles.bodega)}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
            {visibles.length === 0 && (
              <div className="py-12 px-6 text-center flex flex-col items-center">
                <span className="w-11 h-11 rounded-full bg-panel-alt text-muted flex items-center justify-center mb-2.5">
                  <SearchX size={20} />
                </span>
                <p className="text-[14px] font-semibold">Ningún insumo coincide</p>
                <p className="text-[12.5px] text-muted mt-0.5">Prueba con otro nombre u otro filtro.</p>
              </div>
            )}
          </div>

          <div className="mt-10">
            <div className="flex items-baseline justify-between gap-3 mb-3">
              <h2 className="font-display text-[24px] text-plum leading-none">Balance de la producción</h2>
              <span className="text-[12.5px] text-muted hidden sm:block">Total final = disponible − gastos del día</span>
            </div>
            {resultado ? (
              <BalanceDiaTabla balance={resultado.balance} />
            ) : (
              <p className="text-[13.5px] text-muted card px-5 py-6">
                Todavía no has calculado una producción. Ve a Producción, ingresa las porciones y presiona Calcular:
                aquí verás cuánto queda de cada insumo.
              </p>
            )}
          </div>
        </div>

        <div className="lg:sticky lg:top-5 order-first lg:order-none">
          <CierreDiaPanel
            estado={estado}
            sinGuardar={produccionSinGuardar}
            hayExistencias={conteo.existencias > 0}
            onCerrar={() => setDialogo("cierre")}
            onDeshacer={() => setDialogo("deshacer")}
            onBorrarTodo={() => setDialogo("borrar")}
          />
        </div>
      </div>

      {dialogo === "cierre" && estado && (
        <CierreDiaModal
          bodegaMap={bodegaMap}
          insumos={catalogo.insumos}
          pendientes={estado.pendientes}
          calculada={calculada}
          enviando={enviando}
          onConfirmar={confirmarCierre}
          onClose={() => setDialogo(null)}
        />
      )}

      {dialogo === "deshacer" && (
        <Modal
          titulo="¿Deshacer el último cierre?"
          subtitulo="La bodega vuelve a como estaba antes del cierre y sus producciones quedan otra vez por descontar. Los cambios que hayas hecho en bodega después del cierre se perderán."
          onClose={() => setDialogo(null)}
          pie={
            <>
              <button onClick={() => setDialogo(null)} className="btn btn-ghost btn-sm" type="button">
                Cancelar
              </button>
              <button onClick={confirmarDeshacer} disabled={enviando} className="btn btn-primary btn-sm" type="button">
                {enviando ? "Deshaciendo…" : "Sí, deshacer"}
              </button>
            </>
          }
        >
          <p className="text-[13px] text-muted">Esta acción no afecta el historial de producción.</p>
        </Modal>
      )}

      {dialogo === "borrar" && (
        <Modal
          titulo="¿Borrar todos los datos de bodega?"
          subtitulo="Se pondrán en cero los ingresos y la bodega de todos los insumos. No se puede deshacer."
          onClose={() => setDialogo(null)}
          pie={
            <>
              <button onClick={() => setDialogo(null)} className="btn btn-ghost btn-sm" type="button">
                Cancelar
              </button>
              <button
                onClick={() => {
                  limpiarBodega();
                  setDialogo(null);
                }}
                className="btn btn-primary btn-sm"
                type="button"
              >
                Sí, borrar todo
              </button>
            </>
          }
        >
          <p className="text-[13px] text-muted">
            Si lo que quieres es empezar un día nuevo con lo que sobró, usa <b>Cerrar día</b> en su lugar.
          </p>
        </Modal>
      )}
    </div>
  );
}
