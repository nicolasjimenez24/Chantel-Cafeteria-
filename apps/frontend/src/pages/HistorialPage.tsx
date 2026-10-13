import { useEffect, useMemo, useState } from "react";
import { CalendarDays, CalendarRange, ClipboardList, History, Layers, RotateCcw, Scale, Trash2 } from "lucide-react";
import { diaLocal, resumirPeriodo, resumirPorDia, type ProduccionGuardada, type ResumenDia } from "@pasteleria/core";
import { exportarDiaAExcel } from "@/lib/exportExcel";
import { useApp } from "@/state/AppContext";
import { cargarHistorial, eliminarProduccion } from "@/lib/persistence";
import { ApiError } from "@/lib/api";
import { formatCantidad } from "@/lib/format";
import { rangoDePeriodo, horaDe, type Periodo } from "@/lib/fechas";
import { metaDeCategoria } from "@/lib/categorias";
import { Indicadores } from "@/components/Indicadores";
import { DiaHistorialCard } from "@/components/DiaHistorialCard";
import { GraficaTandasPorDia, type PuntoDia } from "@/components/GraficaTandasPorDia";
import { RankingBarras, type ItemRanking } from "@/components/RankingBarras";
import { Modal } from "@/components/Modal";

const PERIODOS: { id: Exclude<Periodo, "personalizado">; nombre: string }[] = [
  { id: "hoy", nombre: "Hoy" },
  { id: "semana", nombre: "7 días" },
  { id: "mes", nombre: "Este mes" },
  { id: "todo", nombre: "Todo" },
];

/** Días del rango, uno por uno (máximo ~2 meses; si no, solo los días con producción). */
function diasDelRango(desde: string, hasta: string): string[] | null {
  if (!desde || !hasta) return null;
  const [a1, m1, d1] = desde.split("-").map(Number);
  const [a2, m2, d2] = hasta.split("-").map(Number);
  const inicio = new Date(a1, m1 - 1, d1);
  const fin = new Date(a2, m2 - 1, d2);
  const dias: string[] = [];
  for (let f = inicio; f <= fin && dias.length <= 62; f = new Date(f.getFullYear(), f.getMonth(), f.getDate() + 1)) {
    dias.push(diaLocal(f));
  }
  return dias.length > 62 ? null : dias;
}

function nombreDelMes(dia: string): string {
  const [a, m] = dia.split("-").map(Number);
  const t = new Date(a, m - 1, 1).toLocaleDateString("es-CO", { month: "long", year: "numeric" });
  return t.charAt(0).toUpperCase() + t.slice(1);
}

export function HistorialPage() {
  const { notify, catalogo } = useApp();
  const [periodo, setPeriodo] = useState<Periodo>("mes");
  const [desde, setDesde] = useState(() => rangoDePeriodo("mes").desde);
  const [hasta, setHasta] = useState(() => rangoDePeriodo("mes").hasta);
  const [producciones, setProducciones] = useState<ProduccionGuardada[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recarga, setRecarga] = useState(0);
  const [porEliminar, setPorEliminar] = useState<ProduccionGuardada | null>(null);

  const rangoInvertido = Boolean(desde && hasta && desde > hasta);

  useEffect(() => {
    if (rangoInvertido) return;
    let cancelado = false;
    setCargando(true);
    setError(null);
    cargarHistorial(desde || undefined, hasta || undefined)
      .then((datos) => {
        if (!cancelado) setProducciones(datos);
      })
      .catch((err) => {
        if (!cancelado) setError(err instanceof ApiError ? err.message : "No se pudo cargar el historial");
      })
      .finally(() => {
        if (!cancelado) setCargando(false);
      });
    return () => {
      cancelado = true;
    };
  }, [desde, hasta, rangoInvertido, recarga]);

  const dias = useMemo(() => resumirPorDia(producciones), [producciones]);
  const periodoResumen = useMemo(() => resumirPeriodo(dias), [dias]);

  // Categoría de cada producto por nombre: el historial guarda solo el nombre.
  const categoriaPorNombre = useMemo(
    () => new Map(catalogo.productos.map((p) => [p.nombre, metaDeCategoria(p.categoria)])),
    [catalogo.productos]
  );
  const colorDeProducto = (nombre: string) => categoriaPorNombre.get(nombre)?.color ?? "var(--color-line-strong)";

  const pesoTotal = useMemo(
    () => dias.reduce((s, d) => s + d.consumo.reduce((t, c) => t + c.totalGramos, 0), 0),
    [dias]
  );

  const puntos = useMemo<PuntoDia[]>(() => {
    const tandasPorDia = new Map(dias.map((d) => [d.dia, d.totalTandas]));
    const rango = diasDelRango(desde, hasta);
    if (rango) return rango.map((dia) => ({ dia, tandas: tandasPorDia.get(dia) ?? 0 }));
    // Rango abierto o muy largo: los últimos 31 días con producción.
    return [...dias].reverse().slice(-31).map((d) => ({ dia: d.dia, tandas: d.totalTandas }));
  }, [dias, desde, hasta]);

  const rankingProductos = useMemo<ItemRanking[]>(() => {
    const m = new Map<string, number>();
    for (const d of dias) for (const p of d.productos) m.set(p.nombre, (m.get(p.nombre) ?? 0) + p.tandas);
    return [...m]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([nombre, tandas]) => {
        const meta = categoriaPorNombre.get(nombre);
        return {
          clave: nombre,
          nombre,
          valor: tandas,
          etiqueta: `${tandas} porci${tandas === 1 ? "ón" : "ones"}`,
          icono: meta?.icono,
          colorIcono: meta?.color,
        };
      });
  }, [dias, categoriaPorNombre]);

  const rankingInsumos = useMemo<ItemRanking[]>(() => {
    const m = new Map<string, { nombre: string; g: number }>();
    for (const d of dias)
      for (const c of d.consumo) {
        const prev = m.get(c.insumoId);
        m.set(c.insumoId, { nombre: c.nombre, g: (prev?.g ?? 0) + c.totalGramos });
      }
    return [...m]
      .sort((a, b) => b[1].g - a[1].g)
      .map(([id, v]) => ({ clave: id, nombre: v.nombre, valor: v.g, etiqueta: formatCantidad(v.g) }));
  }, [dias]);

  // Días agrupados por mes, para leer el historial como un calendario.
  const porMes = useMemo(() => {
    const grupos: { mes: string; dias: typeof dias }[] = [];
    for (const d of dias) {
      const mes = nombreDelMes(d.dia);
      const ultimo = grupos[grupos.length - 1];
      if (ultimo?.mes === mes) ultimo.dias.push(d);
      else grupos.push({ mes, dias: [d] });
    }
    return grupos;
  }, [dias]);

  const elegirPeriodo = (p: Exclude<Periodo, "personalizado">) => {
    const rango = rangoDePeriodo(p);
    setPeriodo(p);
    setDesde(rango.desde);
    setHasta(rango.hasta);
  };

  const confirmarEliminar = async () => {
    if (!porEliminar) return;
    try {
      await eliminarProduccion(porEliminar.id);
      setProducciones((prev) => prev.filter((p) => p.id !== porEliminar.id));
      notify("Producción eliminada del historial");
    } catch (err) {
      notify(err instanceof ApiError ? err.message : "No se pudo eliminar la producción");
    } finally {
      setPorEliminar(null);
    }
  };

  const descargarDia = async (resumen: ResumenDia) => {
    try {
      await exportarDiaAExcel(resumen, (nombre) => categoriaPorNombre.get(nombre)?.id);
      notify("Excel del día descargado");
    } catch {
      notify("No se pudo generar el Excel");
    }
  };

  const valor = (v: string) => (cargando ? "—" : v);

  return (
    <div className="pb-12">
      {/* Filtros */}
      <div className="card px-4 py-3 mb-6 flex flex-wrap items-center gap-x-5 gap-y-3">
        <div className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.1em] text-muted">
          <CalendarRange size={15} /> Período
        </div>
        <div role="group" aria-label="Período" className="flex gap-1 p-1 rounded-full bg-panel-alt">
          {PERIODOS.map((p) => {
            const activo = periodo === p.id;
            return (
              <button
                key={p.id}
                onClick={() => elegirPeriodo(p.id)}
                aria-pressed={activo}
                type="button"
                className={`h-8 px-3.5 rounded-full text-[12.5px] font-semibold transition-colors ${
                  activo ? "bg-plum text-white shadow-sm" : "text-ink-soft hover:bg-panel"
                }`}
              >
                {p.nombre}
              </button>
            );
          })}
        </div>
        <div className="flex flex-wrap items-center gap-2 ml-auto">
          <label className="flex items-center gap-2 text-[12.5px] text-muted">
            Desde
            <input
              type="date"
              value={desde}
              max={hasta || undefined}
              onChange={(e) => {
                setDesde(e.target.value);
                setPeriodo("personalizado");
              }}
              className="field h-9 px-2.5 text-ink"
            />
          </label>
          <span className="text-muted" aria-hidden="true">→</span>
          <label className="flex items-center gap-2 text-[12.5px] text-muted">
            Hasta
            <input
              type="date"
              value={hasta}
              min={desde || undefined}
              onChange={(e) => {
                setHasta(e.target.value);
                setPeriodo("personalizado");
              }}
              className="field h-9 px-2.5 text-ink"
            />
          </label>
        </div>
        {rangoInvertido && (
          <p className="w-full text-[12.5px] text-berry">La fecha inicial no puede ser posterior a la final.</p>
        )}
      </div>

      <Indicadores
        items={[
          {
            icono: CalendarDays,
            etiqueta: "Días con producción",
            valor: valor(String(periodoResumen.diasConProduccion)),
            detalle: "en el período elegido",
            color: "var(--color-plum)",
          },
          {
            icono: ClipboardList,
            etiqueta: "Producciones",
            valor: valor(String(periodoResumen.cantidadProducciones)),
            detalle: "guardadas en el historial",
            color: "var(--color-berry)",
          },
          {
            icono: Layers,
            etiqueta: "Porciones",
            valor: valor(String(periodoResumen.totalTandas)),
            detalle:
              periodoResumen.diasConProduccion > 0
                ? `${(periodoResumen.totalTandas / periodoResumen.diasConProduccion).toLocaleString("es-CO", { maximumFractionDigits: 1 })} por día en promedio`
                : "sin producción aún",
            color: "var(--color-caramel)",
          },
          {
            icono: Scale,
            etiqueta: "Insumos utilizados",
            valor: valor(formatCantidad(pesoTotal)),
            detalle: `${rankingInsumos.length} insumo${rankingInsumos.length === 1 ? "" : "s"} distinto${rankingInsumos.length === 1 ? "" : "s"}`,
            color: "var(--color-pistachio)",
          },
        ]}
      />

      {error ? (
        <div className="card px-6 py-10 text-center">
          <p className="text-[14px] text-berry mb-3">{error}</p>
          <button onClick={() => setRecarga((n) => n + 1)} className="btn btn-secondary btn-sm" type="button">
            <RotateCcw size={13} /> Reintentar
          </button>
        </div>
      ) : cargando ? (
        <div className="card py-16 text-center text-[14px] text-muted">Cargando historial…</div>
      ) : dias.length === 0 ? (
        <div className="card py-16 px-6 text-center flex flex-col items-center">
          <span className="w-14 h-14 rounded-full bg-lilac/60 text-plum flex items-center justify-center mb-3">
            <History size={26} />
          </span>
          <p className="text-[16px] font-semibold">
            {periodo === "todo" ? "Todavía no hay producciones guardadas" : "No hay producciones en este período"}
          </p>
          <p className="text-[13px] text-muted mt-1 max-w-[46ch]">
            Las producciones se registran desde Resultados con el botón “Guardar y pasar a bodega”.
            {periodo !== "todo" && " Prueba con otro período o elige “Todo”."}
          </p>
        </div>
      ) : (
        <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_330px] items-start">
          <div className="min-w-0 space-y-7">
            <section className="card p-5">
              <div className="flex flex-wrap items-baseline justify-between gap-2 mb-4">
                <div>
                  <h2 className="font-display text-[22px] leading-tight text-plum">Porciones por día</h2>
                  <p className="text-[12px] text-muted mt-0.5">Pasa el mouse sobre una columna para ver el detalle.</p>
                </div>
                <p className="text-[12.5px] text-muted">
                  <b className="font-mono-num text-ink">{periodoResumen.totalTandas}</b> porciones en{" "}
                  <b className="font-mono-num text-ink">{periodoResumen.diasConProduccion}</b> día
                  {periodoResumen.diasConProduccion === 1 ? "" : "s"}
                </p>
              </div>
              <GraficaTandasPorDia puntos={puntos} />
            </section>

            <div>
              <div className="flex items-baseline justify-between gap-3 mb-3">
                <h2 className="font-display text-[24px] leading-none text-plum">Registro diario</h2>
                <span className="text-[12.5px] text-muted">Del más reciente al más antiguo</span>
              </div>
              {porMes.map(({ mes, dias: diasMes }, gi) => (
                <section key={mes} className="mb-6" aria-label={mes}>
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="text-[11.5px] font-bold uppercase tracking-[0.14em] text-ink-soft">{mes}</h3>
                    <span className="h-px flex-1 bg-line" aria-hidden="true" />
                    <span className="text-[11.5px] text-muted font-mono-num">
                      {diasMes.length} día{diasMes.length === 1 ? "" : "s"} ·{" "}
                      {diasMes.reduce((s, d) => s + d.totalTandas, 0)} porciones
                    </span>
                  </div>
                  <div className="space-y-2.5">
                    {diasMes.map((d, i) => (
                      <DiaHistorialCard
                        key={d.dia}
                        resumen={d}
                        abiertoInicial={gi === 0 && i === 0}
                        colorDeProducto={colorDeProducto}
                        onEliminar={setPorEliminar}
                        onDescargar={descargarDia}
                      />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </div>

          <aside className="space-y-5 lg:sticky lg:top-5">
            <RankingBarras
              titulo="Productos más producidos"
              subtitulo="Porciones sumadas en el período"
              items={rankingProductos}
              vacio="Sin productos en este período."
            />
            <RankingBarras
              titulo="Insumos más usados"
              subtitulo="Cantidad consumida en el período"
              items={rankingInsumos}
              vacio="Sin consumo en este período."
            />
          </aside>
        </div>
      )}

      {porEliminar && (
        <Modal
          titulo="¿Eliminar esta producción?"
          subtitulo={`Guardada a las ${horaDe(porEliminar.creadoEn)}. Se quitará del historial; no se puede deshacer.`}
          onClose={() => setPorEliminar(null)}
          pie={
            <>
              <button onClick={() => setPorEliminar(null)} className="btn btn-ghost btn-sm" type="button">
                Cancelar
              </button>
              <button onClick={confirmarEliminar} className="btn btn-primary btn-sm" type="button">
                <Trash2 size={14} /> Eliminar
              </button>
            </>
          }
        >
          <div className="flex flex-wrap gap-1.5">
            {porEliminar.productos.map((p) => (
              <span key={p.nombre} className="inline-flex items-center gap-1 rounded-full border border-line px-2.5 py-0.5 text-[12.5px]">
                {p.nombre} <b className="font-mono-num text-plum">×{p.tandas}</b>
              </span>
            ))}
          </div>
          <p className="text-[12.5px] text-muted mt-3">
            Eliminarla no devuelve los insumos a la bodega. Si fue un error al cerrar el día, usa “Deshacer” en Bodega.
          </p>
        </Modal>
      )}
    </div>
  );
}
