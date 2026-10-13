export type Categoria = "Bebidas calientes" | "Bebidas frías" | "Comidas" | "Helados y postres";

export interface Insumo {
  id: string;
  nombre: string;
  unidad: "g";
  costoPorKg: number | null;
}

export interface RecetaItem {
  insumoId: string;
  gramosPorTanda: number;
}

export interface Producto {
  id: string;
  nombre: string;
  categoria: Categoria;
  activo: boolean;
  ingredientes: RecetaItem[];
}

/** Datos de bodega que el usuario ingresa manualmente cada día, por insumo. */
export interface BodegaInsumo {
  ingresos: number;
  bodega: number;
}

export interface BodegaMap {
  [insumoId: string]: BodegaInsumo;
}

/** Una fila del balance diario, equivalente a las columnas E–M de TOTAL_DIA. */
export interface BalanceInsumo {
  insumoId: string;
  nombre: string;
  ingresos: number;
  bodega: number;
  totalBodega: number;
  gastosDiarios: number;
  totalFinal: number;
  faltante: boolean;
}

export interface Catalogo {
  productos: Producto[];
  insumos: Insumo[];
}

export interface TandasMap {
  [productoId: string]: number;
}

export interface DetalleIngrediente {
  insumoId: string;
  nombre: string;
  gramosPorTanda: number;
  tandas: number;
  totalGramos: number;
  costoPorKg: number | null;
  costoItem: number | null;
}

export interface ResultadoProducto {
  productoId: string;
  nombre: string;
  categoria: Categoria;
  tandas: number;
  items: DetalleIngrediente[];
  costo: number;
  tieneTodosLosCostos: boolean;
  sinReceta: boolean;
}

export interface ConsumoConsolidado {
  insumoId: string;
  nombre: string;
  totalGramos: number;
  costoPorKg: number | null;
  costo: number | null;
}

export interface ResultadoProduccion {
  porProducto: ResultadoProducto[];
  consumoConsolidado: ConsumoConsolidado[];
  totalTandas: number;
  cantidadProductos: number;
  costoTotal: number;
  todosLosCostosConocidos: boolean;
  algunCostoConocido: boolean;
  balance: BalanceInsumo[];
  insumosFaltantes: number;
}

export interface ProduccionGuardada {
  id: string;
  /** Día de la producción, AAAA-MM-DD, en la hora local del servidor. */
  dia: string;
  /** Momento exacto en que se guardó (ISO 8601). Sirve para ordenar. */
  creadoEn: string;
  fecha: string;
  hora: string;
  productos: { nombre: string; tandas: number }[];
  consumo: ConsumoConsolidado[];
  costoTotal: number;
  algunCostoConocido: boolean;
  balance: BalanceInsumo[];
}

/** Producción guardada cuyo consumo todavía no se ha descontado de la bodega. */
export interface ProduccionPendiente {
  id: string;
  dia: string;
  fecha: string;
  hora: string;
  productos: { nombre: string; tandas: number }[];
  consumo: { insumoId: string; totalGramos: number }[];
}

export interface EstadoCierre {
  pendientes: ProduccionPendiente[];
  ultimoCierre: { id: string; creadoEn: string; producciones: number } | null;
}

export interface ResultadoCierre {
  bodega: BodegaMap;
  /** Insumos que pasan a bodega en negativo (faltante por reponer). */
  enNegativo: number;
}
