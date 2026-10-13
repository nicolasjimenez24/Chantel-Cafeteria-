import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useEffect,
  type ReactNode,
} from "react";
import {
  calcularProduccion,
  PRODUCTOS_INICIALES,
  INSUMOS_INICIALES,
  type Catalogo,
  type TandasMap,
  type ResultadoProduccion,
  type BodegaMap,
} from "@pasteleria/core";
import { ApiError } from "@/lib/api";
import {
  cargarCatalogo,
  guardarCatalogo,
  guardarProduccion,
  cargarBodega,
  guardarBodegaInsumo,
  limpiarBodega as limpiarBodegaApi,
} from "@/lib/persistence";

interface AppContextValue {
  catalogo: Catalogo;
  setCatalogo: (updater: Catalogo | ((c: Catalogo) => Catalogo)) => void;
  persistirCatalogo: () => void;
  /** Hay cambios en recetas o insumos que todavía no se guardaron. */
  catalogoConCambios: boolean;
  guardandoCatalogo: boolean;
  descartarCambiosCatalogo: () => void;
  cargando: boolean;

  tandasMap: TandasMap;
  setTandasMap: (updater: TandasMap | ((m: TandasMap) => TandasMap)) => void;
  limpiarTandas: () => void;

  bodegaMap: BodegaMap;
  actualizarBodega: (insumoId: string, campo: "ingresos" | "bodega", valor: number) => void;
  limpiarBodega: () => void;
  /** Sustituye la bodega completa por la que devolvió el servidor (tras un cierre). */
  reemplazarBodega: (mapa: BodegaMap) => void;

  resultado: ResultadoProduccion | null;
  calcular: () => void;
  guardarProduccionActual: () => void;
  /** Hay una producción calculada que todavía no está en el historial. */
  produccionSinGuardar: boolean;
  /** Guarda en el historial la producción calculada (la del balance que se ve) y devuelve su id. */
  guardarResultadoPendiente: () => Promise<string>;
  /** Tras cerrar el día: vacía la orden y el resultado para empezar de cero. */
  iniciarNuevoDia: () => void;

  toast: string | null;
  notify: (msg: string) => void;
  cerrarToast: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

function mensajeError(err: unknown, fallback: string): string {
  return err instanceof ApiError ? err.message : fallback;
}

/** Tandas exactas con las que se calculó un resultado (no las que haya en pantalla ahora). */
function tandasDe(r: ResultadoProduccion): TandasMap {
  return Object.fromEntries(r.porProducto.map((p) => [p.productoId, p.tandas]));
}

/** Identifica un conjunto de tandas, para saber si ese mismo cálculo ya se guardó. */
function claveTandas(t: TandasMap): string {
  return JSON.stringify(
    Object.entries(t)
      .filter(([, v]) => Number(v) > 0)
      .sort(([a], [b]) => a.localeCompare(b))
  );
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [catalogo, setCatalogoState] = useState<Catalogo>({
    productos: PRODUCTOS_INICIALES,
    insumos: INSUMOS_INICIALES,
  });
  const [tandasMap, setTandasMapState] = useState<TandasMap>({});
  const [bodegaMap, setBodegaMap] = useState<BodegaMap>({});
  const [resultado, setResultado] = useState<ResultadoProduccion | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);
  const [catalogoGuardado, setCatalogoGuardado] = useState<Catalogo | null>(null);
  const [guardandoCatalogo, setGuardandoCatalogo] = useState(false);

  const notify = useCallback((msg: string) => setToast(msg), []);
  const cerrarToast = useCallback(() => setToast(null), []);

  // Carga inicial desde la API. Si el backend no responde, se queda con el
  // catálogo por defecto para que la app siga siendo usable.
  useEffect(() => {
    let cancelado = false;
    (async () => {
      try {
        // El historial no se carga aquí: la pantalla de Historial pide solo el
        // rango de fechas que se está consultando.
        const [catalogoApi, bodegaApi] = await Promise.all([cargarCatalogo(), cargarBodega()]);
        if (cancelado) return;
        setCatalogoState(catalogoApi);
        setCatalogoGuardado(catalogoApi);
        setBodegaMap(bodegaApi);
      } catch (err) {
        if (cancelado) return;
        notify(mensajeError(err, "No se pudieron cargar los datos del servidor"));
      } finally {
        if (!cancelado) setCargando(false);
      }
    })();
    return () => {
      cancelado = true;
    };
  }, [notify]);

  const setCatalogo = useCallback((updater: Catalogo | ((c: Catalogo) => Catalogo)) => {
    setCatalogoState((prev) => (typeof updater === "function" ? (updater as (c: Catalogo) => Catalogo)(prev) : updater));
  }, []);

  const persistirCatalogo = useCallback(() => {
    void (async () => {
      setGuardandoCatalogo(true);
      try {
        const guardado = await guardarCatalogo(catalogo);
        setCatalogoState(guardado);
        setCatalogoGuardado(guardado);
        notify("Cambios guardados");
      } catch (err) {
        notify(mensajeError(err, "No se pudo guardar"));
      } finally {
        setGuardandoCatalogo(false);
      }
    })();
  }, [catalogo, notify]);

  // Recetas e insumos se editan en memoria y se guardan de un golpe: se compara
  // con lo último guardado para avisar si hay cambios pendientes.
  const catalogoConCambios = useMemo(
    () => catalogoGuardado !== null && JSON.stringify(catalogo) !== JSON.stringify(catalogoGuardado),
    [catalogo, catalogoGuardado]
  );

  const descartarCambiosCatalogo = useCallback(() => {
    if (catalogoGuardado) setCatalogoState(catalogoGuardado);
  }, [catalogoGuardado]);

  useEffect(() => {
    if (!catalogoConCambios) return;
    const avisar = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", avisar);
    return () => window.removeEventListener("beforeunload", avisar);
  }, [catalogoConCambios]);

  const setTandasMap = useCallback((updater: TandasMap | ((m: TandasMap) => TandasMap)) => {
    setTandasMapState((prev) => (typeof updater === "function" ? (updater as (m: TandasMap) => TandasMap)(prev) : updater));
  }, []);

  const limpiarTandas = useCallback(() => setTandasMapState({}), []);

  const actualizarBodega = useCallback(
    (insumoId: string, campo: "ingresos" | "bodega", valor: number) => {
      setBodegaMap((prev) => {
        const actual = prev[insumoId] ?? { ingresos: 0, bodega: 0 };
        const nuevo = { ...prev, [insumoId]: { ...actual, [campo]: valor } };
        void guardarBodegaInsumo(insumoId, nuevo[insumoId]).catch((err) => {
          notify(mensajeError(err, "No se pudo guardar el dato de bodega"));
        });
        return nuevo;
      });
    },
    [notify]
  );

  const limpiarBodega = useCallback(() => {
    setBodegaMap({});
    void limpiarBodegaApi()
      .then(() => notify("Datos de bodega borrados"))
      .catch((err) => notify(mensajeError(err, "No se pudo borrar la bodega")));
  }, [notify]);

  const calcular = useCallback(() => {
    const r = calcularProduccion(tandasMap, catalogo.productos, catalogo.insumos, bodegaMap);
    setResultado(r);
  }, [tandasMap, catalogo, bodegaMap]);

  // Clave de la última producción guardada, para no guardarla dos veces al cerrar el día.
  const [claveGuardada, setClaveGuardada] = useState<string | null>(null);

  const produccionSinGuardar =
    resultado !== null && resultado.cantidadProductos > 0 && claveTandas(tandasDe(resultado)) !== claveGuardada;

  // Guardar la producción descuenta su consumo de la bodega en el servidor: el
  // total final queda como bodega. Se recarga para verlo al instante.
  const guardarResultadoPendiente = useCallback(async () => {
    if (!resultado) throw new ApiError("No hay una producción calculada");
    const tandas = tandasDe(resultado);
    const guardada = await guardarProduccion(tandas);
    setClaveGuardada(claveTandas(tandas));
    setBodegaMap(await cargarBodega());
    return guardada.id;
  }, [resultado]);

  const guardarProduccionActual = useCallback(() => {
    if (!resultado) return;
    // Guardar dos veces el mismo cálculo descontaría dos veces la bodega.
    if (!produccionSinGuardar) {
      notify("Esta producción ya está guardada y su total final ya pasó a bodega");
      return;
    }
    void (async () => {
      try {
        await guardarResultadoPendiente();
        notify("Producción guardada: el total final pasó a bodega");
      } catch (err) {
        notify(mensajeError(err, "No se pudo guardar la producción"));
      }
    })();
  }, [resultado, produccionSinGuardar, guardarResultadoPendiente, notify]);

  const iniciarNuevoDia = useCallback(() => {
    setResultado(null);
    setTandasMapState({});
    setClaveGuardada(null);
  }, []);

  const value = useMemo<AppContextValue>(
    () => ({
      catalogo,
      setCatalogo,
      persistirCatalogo,
      catalogoConCambios,
      guardandoCatalogo,
      descartarCambiosCatalogo,
      cargando,
      tandasMap,
      setTandasMap,
      limpiarTandas,
      bodegaMap,
      actualizarBodega,
      limpiarBodega,
      reemplazarBodega: setBodegaMap,
      resultado,
      calcular,
      guardarProduccionActual,
      produccionSinGuardar,
      guardarResultadoPendiente,
      iniciarNuevoDia,
      toast,
      notify,
      cerrarToast,
    }),
    [
      produccionSinGuardar,
      guardarResultadoPendiente,
      iniciarNuevoDia,
      catalogo,
      setCatalogo,
      persistirCatalogo,
      catalogoConCambios,
      guardandoCatalogo,
      descartarCambiosCatalogo,
      cargando,
      tandasMap,
      setTandasMap,
      limpiarTandas,
      bodegaMap,
      actualizarBodega,
      limpiarBodega,
      resultado,
      calcular,
      guardarProduccionActual,
      toast,
      notify,
      cerrarToast,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp debe usarse dentro de <AppProvider>");
  return ctx;
}
