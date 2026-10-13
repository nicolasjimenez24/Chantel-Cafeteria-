import { Info, LogOut } from "lucide-react";
import { NavLink } from "react-router-dom";
import { fechaHoy } from "@/lib/format";
import { useAuth } from "@/state/AuthContext";
import { NavTabs } from "./NavTabs";

interface HeaderProps {
  onShowInfo: () => void;
}

export function Header({ onShowInfo }: HeaderProps) {
  const { usuario, esAdmin, logout } = useAuth();

  return (
    <header className="no-print">
      <div className="bg-forest text-white">
        <div className="max-w-6xl mx-auto px-5 md:px-8 h-9 flex items-center justify-center relative">
          <p className="text-[11.5px] font-semibold tracking-[0.12em] uppercase">Control de cafetería</p>
          <span className="absolute right-5 md:right-8 text-[11.5px] text-white/70 font-mono-num hidden sm:block">
            {fechaHoy()}
          </span>
        </div>
      </div>

      <div className="bg-panel border-b border-line">
        <div className="max-w-6xl mx-auto px-5 md:px-8 py-3 flex items-center gap-6">
          <NavLink to="/" className="shrink-0 leading-none text-forest" aria-label="Chantel, ir a producción">
            <span className="block text-[25px] md:text-[28px] font-bold tracking-[0.06em]">CHANTEL</span>
            <span className="flex items-center gap-1.5 mt-1">
              <span className="h-px w-3 bg-forest/50" />
              <span className="text-[9.5px] font-semibold tracking-[0.32em] uppercase">Cafetería</span>
              <span className="h-px w-3 bg-forest/50" />
            </span>
          </NavLink>

          <div className="hidden md:block flex-1 min-w-0">
            <NavTabs />
          </div>

          <div className="ml-auto md:ml-0 flex items-center gap-3 shrink-0">
            <span className="hidden sm:block text-right leading-tight">
              <span className="block text-[13px] font-semibold text-ink">{usuario?.nombre}</span>
              <span className="block text-[10.5px] uppercase tracking-[0.1em] text-muted">
                {/* Si el nombre ya es el rol, se muestra el usuario para no repetir */}
                {usuario?.nombre === (esAdmin ? "Administrador" : "Operador")
                  ? `@${usuario.usuario}`
                  : esAdmin
                    ? "Administrador"
                    : "Operador"}
              </span>
            </span>
            <button
              onClick={logout}
              className="w-10 h-10 rounded-full border-[1.5px] border-forest text-forest flex items-center justify-center hover:bg-forest hover:text-white transition-colors"
              aria-label="Cerrar sesión"
              title="Cerrar sesión"
              type="button"
            >
              <LogOut size={17} />
            </button>
          </div>

          <button
            onClick={onShowInfo}
            className="md:ml-0 w-10 h-10 rounded-full border-[1.5px] border-forest text-forest flex items-center justify-center hover:bg-forest hover:text-white transition-colors shrink-0"
            aria-label="Notas de la migración del Excel"
            type="button"
          >
            <Info size={18} />
          </button>
        </div>

        {/* En pantallas pequeñas el menú va en su propia fila */}
        <div className="md:hidden border-t border-line px-3">
          <NavTabs />
        </div>
      </div>
    </header>
  );
}
