import { useEffect, useMemo, useState } from "react";
import { BookOpen, CircleAlert, List, Plus, Search, Trash2, Wheat, X } from "lucide-react";
import type { Categoria, Producto } from "@pasteleria/core";
import { useApp } from "@/state/AppContext";
import { CATEGORIAS, metaDeCategoria } from "@/lib/categorias";
import { formatCantidad } from "@/lib/format";
import { crearId, normalizar } from "@/lib/ids";
import { Modal } from "@/components/Modal";
import { BuscadorInsumo } from "@/components/BuscadorInsumo";
import { ListaInsumosModal } from "@/components/ListaInsumosModal";

function recetaIncompleta(p: Producto): boolean {
  return p.ingredientes.length === 0 || p.ingredientes.some((i) => !(i.gramosPorTanda > 0));
}

/** Selector de categoría en forma de botones con ícono y color. */
function SelectorCategoria({ valor, onChange }: { valor: Categoria; onChange: (c: Categoria) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Categoría">
      {CATEGORIAS.map(({ id, corta, color, colorSoft, icono: Icono }) => {
        const activo = valor === id;
        return (
          <button
            key={id}
            role="radio"
            aria-checked={activo}
            onClick={() => onChange(id)}
            type="button"
            className="h-8 px-3 rounded-full text-[12.5px] font-semibold flex items-center gap-1.5 border-[1.5px] transition-colors"
            style={
              activo
                ? { background: color, borderColor: color, color: "#fff" }
                : { background: colorSoft, borderColor: "transparent", color }
            }
          >
            <Icono size={14} /> {corta}
          </button>
        );
      })}
    </div>
  );
}

function Interruptor({ activo, onChange, etiqueta }: { activo: boolean; onChange: (v: boolean) => void; etiqueta: string }) {
  return (
    <button
      role="switch"
      aria-checked={activo}
      onClick={() => onChange(!activo)}
      type="button"
      className="flex items-center gap-2.5 text-[13px] font-semibold text-ink-soft"
    >
      <span
        className={`relative w-10 h-6 rounded-full transition-colors ${activo ? "bg-pistachio" : "bg-line-strong"}`}
        aria-hidden="true"
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
            activo ? "translate-x-4" : ""
          }`}
        />
      </span>
      {etiqueta}
    </button>
  );
}

function CampoGramos({
  valor,
  onChange,
  etiqueta,
  autoFocus,
  resaltar,
}: {
  valor: number;
  onChange: (v: number) => void;
  etiqueta: string;
  autoFocus?: boolean;
  resaltar?: boolean;
}) {
  return (
    <div className="relative inline-block">
      <input
        type="number"
        min={0}
        step="any"
        inputMode="decimal"
        autoFocus={autoFocus}
        value={valor === 0 ? "" : valor}
        placeholder="0"
        aria-label={etiqueta}
        onChange={(e) => onChange(Math.max(0, parseFloat(e.target.value) || 0))}
        className="field w-[7.5rem] pl-2 pr-6 text-right placeholder:text-muted/60"
        style={resaltar ? { borderColor: "var(--color-copper)" } : undefined}
      />
      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11.5px] text-muted pointer-events-none">g</span>
    </div>
  );
}

interface NuevoInsumo {
  nombre: string;
  /** Agregarlo también a la receta que está abierta. */
  agregar: boolean;
  gramos: number;
}

export function AdminRecetas() {
  const { catalogo, setCatalogo, notify } = useApp();
  const [selectedId, setSelectedId] = useState<string | null>(catalogo.productos[0]?.id ?? null);
  const [busqueda, setBusqueda] = useState("");
  const [nuevoProducto, setNuevoProducto] = useState<{ nombre: string; categoria: Categoria } | null>(null);
  const [nuevoInsumo, setNuevoInsumo] = useState<NuevoInsumo | null>(null);
  const [verInsumos, setVerInsumos] = useState(false);
  const [confirmarEliminar, setConfirmarEliminar] = useState(false);
  const [enfocar, setEnfocar] = useState<string | null>(null);

  const producto = catalogo.productos.find((p) => p.id === selectedId) ?? null;
  const insumoPorId = useMemo(() => new Map(catalogo.insumos.map((i) => [i.id, i])), [catalogo.insumos]);

  // Si el producto elegido desaparece (por ejemplo al descartar cambios), elige el primero.
  useEffect(() => {
    if (!producto && catalogo.productos.length > 0) setSelectedId(catalogo.productos[0].id);
  }, [producto, catalogo.productos]);

  const grupos = useMemo(() => {
    const q = normalizar(busqueda.trim());
    return CATEGORIAS.map((c) => ({
      ...c,
      productos: catalogo.productos
        .filter((p) => p.categoria === c.id && (!q || normalizar(p.nombre).includes(q)))
        .sort((a, b) => a.nombre.localeCompare(b.nombre, "es")),
    })).filter((g) => g.productos.length > 0);
  }, [catalogo.productos, busqueda]);

  const actualizarProducto = (updater: (p: Producto) => Producto) => {
    setCatalogo((c) => ({
      ...c,
      productos: c.productos.map((p) => (p.id === selectedId ? updater(p) : p)),
    }));
  };

  const agregarIngrediente = (insumoId: string, gramos = 0) => {
    actualizarProducto((p) =>
      p.ingredientes.some((x) => x.insumoId === insumoId)
        ? p
        : { ...p, ingredientes: [...p.ingredientes, { insumoId, gramosPorTanda: gramos }] }
    );
    if (!gramos) setEnfocar(insumoId);
  };

  const crearProducto = () => {
    if (!nuevoProducto) return;
    const nombre = nuevoProducto.nombre.trim();
    if (!nombre) return;
    if (catalogo.productos.some((p) => normalizar(p.nombre) === normalizar(nombre))) {
      notify("Ya existe un producto con ese nombre");
      return;
    }
    const id = crearId(nombre);
    setCatalogo((c) => ({
      ...c,
      productos: [...c.productos, { id, nombre, categoria: nuevoProducto.categoria, activo: true, ingredientes: [] }],
    }));
    setSelectedId(id);
    setBusqueda("");
    setNuevoProducto(null);
    // Recién creado, lo siguiente es armar su receta.
    setTimeout(() => document.getElementById("buscador-insumo")?.focus(), 50);
  };

  /** Crea el insumo y, si se pide, lo agrega a la receta abierta. Devuelve false si el nombre ya existe. */
  const crearInsumo = (nombre: string, agregarA: boolean, gramos = 0): boolean => {
    const recortado = nombre.trim();
    if (!recortado) return false;
    // "mora" → "Mora", para que la lista de insumos quede uniforme.
    const limpio = recortado.charAt(0).toLocaleUpperCase("es") + recortado.slice(1);
    if (catalogo.insumos.some((i) => normalizar(i.nombre) === normalizar(limpio))) {
      notify("Ya existe un insumo con ese nombre");
      return false;
    }
    const id = crearId(limpio);
    setCatalogo((c) => ({ ...c, insumos: [...c.insumos, { id, nombre: limpio, unidad: "g", costoPorKg: null }] }));
    if (agregarA && producto) agregarIngrediente(id, gramos);
    notify(agregarA && producto ? `“${limpio}” creado y agregado a ${producto.nombre}` : `Insumo “${limpio}” creado`);
    return true;
  };

  const eliminarProducto = () => {
    if (!producto) return;
    const resto = catalogo.productos.filter((p) => p.id !== producto.id);
    setCatalogo((c) => ({ ...c, productos: c.productos.filter((p) => p.id !== producto.id) }));
    setSelectedId(resto[0]?.id ?? null);
    setConfirmarEliminar(false);
  };

  const resumen = useMemo(() => {
    if (!producto) return null;
    const pesoTotal = producto.ingredientes.reduce((s, i) => s + (i.gramosPorTanda || 0), 0);
    const principal = [...producto.ingredientes].sort((a, b) => b.gramosPorTanda - a.gramosPorTanda)[0];
    return {
      pesoTotal,
      principal: principal && principal.gramosPorTanda > 0 ? insumoPorId.get(principal.insumoId)?.nombre ?? "—" : "—",
    };
  }, [producto, insumoPorId]);

  const disponibles = producto
    ? catalogo.insumos.filter((i) => !producto.ingredientes.some((x) => x.insumoId === i.id))
    : [];

  return (
    <>
      {/* ── Acciones principales ── */}
      <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
        <div>
          <h2 className="font-display text-[26px] leading-none text-plum">Composición de recetas</h2>
          <p className="text-[13px] text-muted mt-1.5">Elige un producto y define qué insumos lleva y cuántos gramos por porción.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setVerInsumos(true)} className="btn btn-ghost btn-sm" type="button">
            <List size={15} /> Ver insumos
          </button>
          <button
            onClick={() => setNuevoInsumo({ nombre: "", agregar: !!producto, gramos: 0 })}
            className="btn btn-secondary btn-sm"
            type="button"
          >
            <Wheat size={15} /> Agregar insumo
          </button>
          <button
            onClick={() => setNuevoProducto({ nombre: "", categoria: CATEGORIAS[0].id })}
            className="btn btn-primary btn-sm"
            type="button"
          >
            <Plus size={15} /> Agregar producto
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)] items-start">
        {/* ── Lista de productos ── */}
        <aside className="card overflow-hidden lg:sticky lg:top-5">
          <div className="p-3 border-b border-line">
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
              <input
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar producto…"
                className="field w-full h-9 !pl-8 !pr-8 font-sans text-[13.5px] placeholder:text-muted"
                type="search"
              />
              {busqueda && (
                <button
                  onClick={() => setBusqueda("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted hover:text-ink"
                  aria-label="Borrar búsqueda"
                  type="button"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          <nav aria-label="Productos" className="max-h-[calc(100vh-12rem)] min-h-[200px] overflow-y-auto py-1.5">
            {grupos.length === 0 && (
              <p className="px-4 py-8 text-center text-[13px] text-muted">Ningún producto coincide.</p>
            )}
            {grupos.map(({ id, nota, color, icono: Icono, productos }) => (
              <div key={id} className="mb-1">
                <p
                  className="sticky top-0 z-10 bg-panel/95 backdrop-blur px-4 pt-2.5 pb-1.5 text-[10.5px] font-bold uppercase tracking-[0.12em] flex items-center gap-1.5"
                  style={{ color }}
                >
                  <Icono size={13} /> {nota}
                  <span className="font-mono-num text-muted font-semibold">{productos.length}</span>
                </p>
                {productos.map((p) => {
                  const elegido = p.id === selectedId;
                  const incompleta = recetaIncompleta(p);
                  return (
                    <button
                      key={p.id}
                      onClick={() => setSelectedId(p.id)}
                      type="button"
                      aria-current={elegido ? "true" : undefined}
                      className={`relative w-full text-left pl-4 pr-3 py-2 flex items-center gap-2 transition-colors ${
                        elegido ? "bg-lilac/60" : "hover:bg-panel-alt"
                      }`}
                    >
                      {elegido && (
                        <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full" style={{ background: color }} />
                      )}
                      <span className="flex-1 min-w-0">
                        <span
                          className={`block text-[13.5px] truncate ${elegido ? "font-semibold text-plum" : "text-ink"} ${
                            p.activo ? "" : "opacity-55"
                          }`}
                        >
                          {p.nombre}
                        </span>
                        <span className={`block text-[11.5px] ${incompleta ? "text-copper font-medium" : "text-muted"}`}>
                          {p.ingredientes.length === 0
                            ? "Sin receta"
                            : `${p.ingredientes.length} insumo${p.ingredientes.length === 1 ? "" : "s"}${
                                incompleta ? " · faltan cantidades" : ""
                              }`}
                        </span>
                      </span>
                      {!p.activo && (
                        <span className="text-[10px] font-bold uppercase tracking-[0.06em] text-muted bg-panel-alt rounded-full px-2 py-0.5 shrink-0">
                          Inactivo
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </nav>
        </aside>

        {/* ── Composición de la receta ── */}
        {!producto ? (
          <div className="card py-16 px-6 text-center flex flex-col items-center">
            <BookOpen size={28} className="text-muted mb-3" />
            <p className="text-[15px] font-semibold">No hay productos todavía</p>
            <p className="text-[13px] text-muted mt-1">Crea el primero con “Agregar producto”.</p>
          </div>
        ) : (
          (() => {
            const { color, colorSoft, icono: Icono } = metaDeCategoria(producto.categoria);
            return (
              <section className="card" aria-label={`Receta de ${producto.nombre}`}>
                <header className="px-5 md:px-6 pt-5 pb-5 border-b border-line">
                  <div className="flex items-start gap-4">
                    <span
                      className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
                      style={{ background: colorSoft, color }}
                      aria-hidden="true"
                    >
                      <Icono size={28} strokeWidth={1.8} />
                    </span>
                    <div className="flex-1 min-w-0">
                      <label htmlFor="nombre-producto" className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-muted">
                        Nombre del producto
                      </label>
                      <input
                        id="nombre-producto"
                        value={producto.nombre}
                        onChange={(e) => actualizarProducto((p) => ({ ...p, nombre: e.target.value }))}
                        className="block w-full font-display text-[26px] md:text-[30px] leading-tight text-plum bg-transparent border-b-2 border-transparent hover:border-line focus:border-plum outline-none pb-0.5 transition-colors"
                      />
                    </div>
                    <button
                      onClick={() => setConfirmarEliminar(true)}
                      className="w-9 h-9 rounded-full text-muted hover:text-berry hover:bg-berry-10 flex items-center justify-center shrink-0"
                      aria-label="Eliminar producto"
                      title="Eliminar producto"
                      type="button"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 mt-4 md:pl-[4.5rem]">
                    <SelectorCategoria
                      valor={producto.categoria}
                      onChange={(categoria) => actualizarProducto((p) => ({ ...p, categoria }))}
                    />
                    <Interruptor
                      activo={producto.activo}
                      onChange={(activo) => actualizarProducto((p) => ({ ...p, activo }))}
                      etiqueta={producto.activo ? "Visible en Producción" : "Oculto en Producción"}
                    />
                  </div>
                </header>

                {resumen && (
                  <div className="grid grid-cols-3 border-b border-line bg-panel-alt/50">
                    {[
                      { etiqueta: "Insumos en la receta", valor: String(producto.ingredientes.length) },
                      { etiqueta: "Peso por porción", valor: resumen.pesoTotal ? formatCantidad(resumen.pesoTotal) : "—" },
                      { etiqueta: "Insumo principal", valor: resumen.principal },
                    ].map((s, i) => (
                      <div key={s.etiqueta} className={`px-5 md:px-6 py-3 min-w-0 ${i > 0 ? "border-l border-line" : ""}`}>
                        <p className="text-[10.5px] font-bold uppercase tracking-[0.1em] text-muted truncate">{s.etiqueta}</p>
                        <p className="font-mono-num text-[18px] font-semibold text-ink leading-tight mt-0.5 truncate">{s.valor}</p>
                      </div>
                    ))}
                  </div>
                )}

                {producto.ingredientes.length === 0 ? (
                  <div className="px-6 py-12 text-center flex flex-col items-center">
                    <span className="w-12 h-12 rounded-full flex items-center justify-center mb-3" style={{ background: colorSoft, color }}>
                      <Icono size={22} />
                    </span>
                    <p className="text-[15px] font-semibold">Esta receta todavía no tiene insumos</p>
                    <p className="text-[13px] text-muted mt-1 max-w-[44ch]">
                      Busca un insumo en el campo de abajo y escribe cuántos gramos lleva cada porción. Si no existe, puedes
                      crearlo desde ahí mismo.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-[13.5px] min-w-[520px]">
                      <thead>
                        <tr className="text-[11px] font-bold uppercase tracking-[0.08em] text-muted">
                          <th className="text-left font-bold py-3 pl-5 md:pl-6 pr-3">Insumo</th>
                          <th className="text-right font-bold py-3 px-3">Gramos por porción</th>
                          <th className="text-left font-bold py-3 px-3 w-[30%]">Proporción en la receta</th>
                          <th className="py-3 pr-4 w-10" />
                        </tr>
                      </thead>
                      <tbody>
                        {producto.ingredientes.map((ri, idx) => {
                          const ins = insumoPorId.get(ri.insumoId);
                          const g = ri.gramosPorTanda || 0;
                          const pct = resumen && resumen.pesoTotal > 0 ? (g / resumen.pesoTotal) * 100 : 0;
                          const falta = !(g > 0);
                          return (
                            <tr key={ri.insumoId} className="border-t border-line group">
                              <td className="py-2 pl-5 md:pl-6 pr-3">
                                <span className="font-medium text-ink">{ins ? ins.nombre : ri.insumoId}</span>
                                {falta && (
                                  <span className="ml-2 inline-flex items-center gap-1 text-[11px] text-copper font-semibold">
                                    <CircleAlert size={11} /> falta cantidad
                                  </span>
                                )}
                              </td>
                              <td className="py-2 px-3 text-right">
                                <CampoGramos
                                  valor={g}
                                  autoFocus={enfocar === ri.insumoId}
                                  resaltar={falta}
                                  etiqueta={`Gramos por porción de ${ins?.nombre ?? ri.insumoId}`}
                                  onChange={(v) => {
                                    if (enfocar) setEnfocar(null);
                                    actualizarProducto((p) => ({
                                      ...p,
                                      ingredientes: p.ingredientes.map((x, i) => (i === idx ? { ...x, gramosPorTanda: v } : x)),
                                    }));
                                  }}
                                />
                              </td>
                              <td className="py-2 px-3">
                                <div className="flex items-center gap-2">
                                  <div className="flex-1 h-1.5 rounded-full bg-panel-alt overflow-hidden">
                                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
                                  </div>
                                  <span className="font-mono-num text-[11.5px] text-muted w-9 text-right">
                                    {pct ? `${Math.round(pct)}%` : ""}
                                  </span>
                                </div>
                              </td>
                              <td className="py-2 pr-4 text-right">
                                <button
                                  onClick={() =>
                                    actualizarProducto((p) => ({
                                      ...p,
                                      ingredientes: p.ingredientes.filter((_, i) => i !== idx),
                                    }))
                                  }
                                  className="w-8 h-8 rounded-full text-muted hover:text-berry hover:bg-berry-10 flex items-center justify-center opacity-60 group-hover:opacity-100"
                                  type="button"
                                  aria-label={`Quitar ${ins?.nombre ?? "insumo"}`}
                                >
                                  <X size={15} />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="px-5 md:px-6 py-4 border-t border-line bg-panel-alt/50 rounded-b-[14px]">
                  <BuscadorInsumo
                    insumos={disponibles}
                    todos={catalogo.insumos}
                    onElegir={(insumoId) => agregarIngrediente(insumoId)}
                    onCrear={(nombre) => crearInsumo(nombre, true)}
                  />
                  <p className="text-[11.5px] text-muted mt-2">
                    Al elegir un insumo se agrega a la receta y puedes escribir los gramos de inmediato.
                  </p>
                </div>
              </section>
            );
          })()
        )}
      </div>

      {nuevoProducto && (
        <Modal
          titulo="Agregar producto"
          subtitulo="Después de crearlo podrás armar su receta con los insumos que lleva."
          onClose={() => setNuevoProducto(null)}
          pie={
            <>
              <button onClick={() => setNuevoProducto(null)} className="btn btn-ghost btn-sm" type="button">
                Cancelar
              </button>
              <button
                onClick={crearProducto}
                disabled={!nuevoProducto.nombre.trim()}
                className="btn btn-primary btn-sm"
                type="button"
              >
                <Plus size={14} /> Crear producto
              </button>
            </>
          }
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              crearProducto();
            }}
            className="space-y-4"
          >
            <div>
              <label htmlFor="nuevo-nombre" className="block text-[12.5px] font-semibold text-ink-soft mb-1.5">
                Nombre del producto
              </label>
              <input
                id="nuevo-nombre"
                autoFocus
                value={nuevoProducto.nombre}
                onChange={(e) => setNuevoProducto({ ...nuevoProducto, nombre: e.target.value })}
                placeholder="Ej. Torta de Mora"
                className="field w-full px-3 font-sans"
                style={{ height: "2.75rem" }}
              />
            </div>
            <div>
              <p className="text-[12.5px] font-semibold text-ink-soft mb-1.5">Categoría</p>
              <SelectorCategoria
                valor={nuevoProducto.categoria}
                onChange={(categoria) => setNuevoProducto({ ...nuevoProducto, categoria })}
              />
            </div>
          </form>
        </Modal>
      )}

      {nuevoInsumo && (
        <Modal
          titulo="Agregar insumo"
          subtitulo="Las cantidades de los insumos se manejan en gramos."
          onClose={() => setNuevoInsumo(null)}
          pie={
            <>
              <button onClick={() => setNuevoInsumo(null)} className="btn btn-ghost btn-sm" type="button">
                Cancelar
              </button>
              <button
                onClick={() => crearInsumo(nuevoInsumo.nombre, nuevoInsumo.agregar, nuevoInsumo.gramos) && setNuevoInsumo(null)}
                disabled={!nuevoInsumo.nombre.trim()}
                className="btn btn-primary btn-sm"
                type="button"
              >
                <Plus size={14} /> Crear insumo
              </button>
            </>
          }
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (crearInsumo(nuevoInsumo.nombre, nuevoInsumo.agregar, nuevoInsumo.gramos)) setNuevoInsumo(null);
            }}
            className="space-y-4"
          >
            <div>
              <label htmlFor="insumo-nombre" className="block text-[12.5px] font-semibold text-ink-soft mb-1.5">
                Nombre del insumo
              </label>
              <input
                id="insumo-nombre"
                autoFocus
                value={nuevoInsumo.nombre}
                onChange={(e) => setNuevoInsumo({ ...nuevoInsumo, nombre: e.target.value })}
                placeholder="Ej. Harina de Almendra"
                className="field w-full px-3 font-sans"
                style={{ height: "2.75rem" }}
              />
            </div>

            {producto && (
              <div className="rounded-xl border border-line p-3.5">
                <label className="flex items-center gap-2.5 text-[13.5px] font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={nuevoInsumo.agregar}
                    onChange={(e) => setNuevoInsumo({ ...nuevoInsumo, agregar: e.target.checked })}
                    className="w-4 h-4"
                  />
                  Agregarlo también a la receta de {producto.nombre}
                </label>
                {nuevoInsumo.agregar && (
                  <div className="flex items-center justify-between gap-3 mt-3 pl-6">
                    <span className="text-[12.5px] text-ink-soft">Gramos por porción</span>
                    <CampoGramos
                      valor={nuevoInsumo.gramos}
                      etiqueta="Gramos por porción"
                      onChange={(gramos) => setNuevoInsumo({ ...nuevoInsumo, gramos })}
                    />
                  </div>
                )}
              </div>
            )}
          </form>
        </Modal>
      )}

      {verInsumos && (
        <ListaInsumosModal
          catalogo={catalogo}
          onRenombrar={(id, nombre) =>
            setCatalogo((c) => ({ ...c, insumos: c.insumos.map((x) => (x.id === id ? { ...x, nombre } : x)) }))
          }
          onEliminar={(id) => setCatalogo((c) => ({ ...c, insumos: c.insumos.filter((x) => x.id !== id) }))}
          onClose={() => setVerInsumos(false)}
        />
      )}

      {confirmarEliminar && producto && (
        <Modal
          titulo={`¿Eliminar “${producto.nombre}”?`}
          subtitulo="Se quitará el producto y su receta. El historial de producción no se modifica."
          onClose={() => setConfirmarEliminar(false)}
          pie={
            <>
              <button onClick={() => setConfirmarEliminar(false)} className="btn btn-ghost btn-sm" type="button">
                Cancelar
              </button>
              <button onClick={eliminarProducto} className="btn btn-primary btn-sm" type="button">
                <Trash2 size={14} /> Eliminar
              </button>
            </>
          }
        >
          <p className="text-[13px] text-muted">
            Si solo quieres que no aparezca en Producción, puedes ocultarlo con el interruptor en lugar de eliminarlo.
          </p>
        </Modal>
      )}
    </>
  );
}
