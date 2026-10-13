import type {
  BodegaInsumo,
  BodegaMap,
  Catalogo,
  EstadoCierre,
  ProduccionGuardada,
  ResultadoCierre,
  TandasMap,
} from "@pasteleria/core";
import { api } from "./api";

/**
 * Capa de persistencia: habla con la API del backend (@pasteleria/backend).
 * El resto de la aplicación no conoce fetch ni rutas HTTP, solo estas funciones.
 */

export function cargarCatalogo(): Promise<Catalogo> {
  return api.get<Catalogo>("/catalogo");
}

/** Sincroniza el catálogo completo, tal como lo dejó el usuario en Recetas. */
export function guardarCatalogo(catalogo: Catalogo): Promise<Catalogo> {
  return api.put<Catalogo>("/catalogo", catalogo);
}

/** Historial del rango de días indicado (AAAA-MM-DD, ambos inclusive). Sin fechas, trae todo. */
export function cargarHistorial(desde?: string, hasta?: string): Promise<ProduccionGuardada[]> {
  const params = new URLSearchParams();
  if (desde) params.set("desde", desde);
  if (hasta) params.set("hasta", hasta);
  const query = params.toString();
  return api.get<ProduccionGuardada[]>(`/produccion${query ? `?${query}` : ""}`);
}

/** Calcula en el servidor a partir de las tandas y guarda el resultado en el historial. */
export function guardarProduccion(tandas: TandasMap): Promise<ProduccionGuardada> {
  return api.post<ProduccionGuardada>("/produccion", { tandas });
}

export function eliminarProduccion(id: string): Promise<void> {
  return api.delete<void>(`/produccion/${id}`);
}

export function cargarBodega(): Promise<BodegaMap> {
  return api.get<BodegaMap>("/bodega");
}

export function guardarBodegaInsumo(insumoId: string, datos: BodegaInsumo): Promise<BodegaInsumo> {
  return api.put<BodegaInsumo>(`/bodega/${insumoId}`, datos);
}

export function limpiarBodega(): Promise<void> {
  return api.delete<void>("/bodega");
}

export function cargarEstadoCierre(): Promise<EstadoCierre> {
  return api.get<EstadoCierre>("/bodega/cierre");
}

/** Descuenta esas producciones y pasa lo que quedó como bodega del día siguiente. */
export function cerrarDia(produccionIds: string[]): Promise<ResultadoCierre> {
  return api.post<ResultadoCierre>("/bodega/cierre", { produccionIds });
}

export function deshacerUltimoCierre(): Promise<BodegaMap> {
  return api.delete<BodegaMap>("/bodega/cierre/ultimo");
}
