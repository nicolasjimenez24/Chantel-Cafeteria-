import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { api, guardarToken, leerToken, onSesionVencida } from "@/lib/api";

export type Rol = "ADMIN" | "OPERADOR";

export interface Usuario {
  id: string;
  usuario: string;
  nombre: string;
  rol: Rol;
}

interface AuthContextValue {
  usuario: Usuario | null;
  esAdmin: boolean;
  /** true mientras se comprueba si la sesión guardada sigue siendo válida. */
  verificando: boolean;
  login: (usuario: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [verificando, setVerificando] = useState(() => leerToken() !== null);

  const logout = useCallback(() => {
    guardarToken(null);
    setUsuario(null);
  }, []);

  useEffect(() => {
    onSesionVencida(logout);
    return () => onSesionVencida(null);
  }, [logout]);

  // Al recargar la página, recupera la sesión si el token guardado sigue vigente.
  useEffect(() => {
    if (leerToken() === null) return;
    let cancelado = false;
    api
      .get<Usuario>("/auth/yo")
      .then((u) => !cancelado && setUsuario(u))
      .catch(() => {
        /* 401 ya cierra la sesión; un fallo de red deja al usuario en el login */
      })
      .finally(() => !cancelado && setVerificando(false));
    return () => {
      cancelado = true;
    };
  }, []);

  const login = useCallback(async (nombreUsuario: string, password: string) => {
    const r = await api.post<{ token: string; usuario: Usuario }>("/auth/login", {
      usuario: nombreUsuario.trim(),
      password,
    });
    guardarToken(r.token);
    setUsuario(r.usuario);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ usuario, esAdmin: usuario?.rol === "ADMIN", verificando, login, logout }),
    [usuario, verificando, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
}
