import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "@/state/AuthContext";

const ITEMS = [
  { to: "/", label: "Producción", activoEn: ["/", "/resultados"] },
  { to: "/bodega", label: "Bodega", activoEn: ["/bodega"] },
  { to: "/administracion", label: "Recetas", activoEn: ["/administracion"], soloAdmin: true },
  { to: "/historial", label: "Historial", activoEn: ["/historial"] },
];

export function NavTabs() {
  const { pathname } = useLocation();
  const { esAdmin } = useAuth();

  return (
    <nav aria-label="Secciones" className="flex items-center gap-0.5 md:gap-1 overflow-x-auto scrollbar-none py-2 md:py-0 justify-between md:justify-center">
      {ITEMS.filter((i) => !i.soloAdmin || esAdmin).map(({ to, label, activoEn }) => {
        const activo = activoEn.includes(pathname);
        return (
          <NavLink
            key={to}
            to={to}
            aria-current={activo ? "page" : undefined}
            className={`px-2.5 md:px-4 py-2 rounded-full text-[12px] md:text-[13px] font-bold tracking-[0.05em] uppercase whitespace-nowrap shrink-0 transition-colors ${
              activo ? "bg-lilac text-plum" : "text-forest hover:text-plum hover:bg-panel-alt"
            }`}
          >
            {label}
          </NavLink>
        );
      })}
    </nav>
  );
}
