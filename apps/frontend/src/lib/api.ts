// Ruta relativa: en el servidor, frontend y API comparten dirección y puerto,
// así la app funciona desde cualquier equipo de la red. En desarrollo, Vite
// reenvía /api al backend (ver vite.config.ts).
const API_BASE = import.meta.env.VITE_API_URL ?? "/api";

export class ApiError extends Error {}

const TOKEN_KEY = "chantel-cafeteria.token";

export function leerToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function guardarToken(token: string | null) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* sin almacenamiento disponible: la sesión dura hasta recargar */
  }
}

// El contexto de sesión se suscribe aquí para cerrar sesión cuando el servidor
// responde 401 (token vencido o cuenta desactivada).
let alSesionVencida: (() => void) | null = null;
export function onSesionVencida(fn: (() => void) | null) {
  alSesionVencida = fn;
}

async function req<T>(path: string, options?: RequestInit): Promise<T> {
  let res: Response;
  const token = leerToken();
  try {
    res = await fetch(`${API_BASE}${path}`, {
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...options,
    });
  } catch {
    throw new ApiError("No se pudo conectar con el servidor. ¿Está corriendo el backend?");
  }

  if (res.status === 401 && path !== "/auth/login") alSesionVencida?.();

  if (!res.ok) {
    const cuerpo = await res.json().catch(() => null);
    const mensaje = Array.isArray(cuerpo?.message) ? cuerpo.message.join(", ") : cuerpo?.message;
    throw new ApiError(mensaje ?? `Error ${res.status} al llamar ${path}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  get: <T>(path: string) => req<T>(path),
  post: <T>(path: string, body?: unknown) =>
    req<T>(path, { method: "POST", body: body === undefined ? undefined : JSON.stringify(body) }),
  put: <T>(path: string, body?: unknown) =>
    req<T>(path, { method: "PUT", body: body === undefined ? undefined : JSON.stringify(body) }),
  delete: <T>(path: string) => req<T>(path, { method: "DELETE" }),
};
