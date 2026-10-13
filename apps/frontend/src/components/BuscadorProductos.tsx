import { Search, X } from "lucide-react";

interface BuscadorProductosProps {
  valor: string;
  onChange: (v: string) => void;
  resultados: number;
}

export function BuscadorProductos({ valor, onChange, resultados }: BuscadorProductosProps) {
  return (
    <div className="no-print">
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
        <input
          value={valor}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Buscar producto…"
          className="field w-full h-10 !pl-9 !pr-9 font-sans text-[14px] placeholder:text-muted"
          type="search"
        />
        {valor && (
          <button
            onClick={() => onChange("")}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-ink transition-colors"
            aria-label="Borrar búsqueda"
            type="button"
          >
            <X size={15} />
          </button>
        )}
      </div>
      {/* Anunciado solo para lectores de pantalla: a la vista ya están los resultados. */}
      <p className="sr-only" aria-live="polite">
        {valor ? `${resultados} producto${resultados === 1 ? "" : "s"} encontrado${resultados === 1 ? "" : "s"}` : ""}
      </p>
    </div>
  );
}
