import { CircleAlert, CircleCheck } from "lucide-react";
import type { Producto } from "@pasteleria/core";
import { metaDeCategoria } from "@/lib/categorias";
import { Stepper } from "./Stepper";

interface ProductoCardProps {
  producto: Producto;
  tandas: number;
  onChange: (v: number) => void;
}

export function ProductoCard({ producto, tandas, onChange }: ProductoCardProps) {
  const { color, colorSoft, icono: Icono } = metaDeCategoria(producto.categoria);
  const sinReceta = producto.ingredientes.length === 0;
  const activo = tandas > 0;

  return (
    <article
      className="card relative flex flex-col p-4 transition-[transform,box-shadow,border-color,background-color] duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_30px_-18px_rgba(75,35,72,.45)]"
      style={
        activo
          ? {
              borderColor: color,
              boxShadow: `0 0 0 1px ${color}, 0 14px 30px -20px ${color}`,
              background: `color-mix(in srgb, ${color} 4%, white)`,
            }
          : undefined
      }
    >
      <div className="flex items-start gap-3">
        <span
          className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: activo ? color : colorSoft, color: activo ? "#fff" : color }}
          aria-hidden="true"
        >
          <Icono size={21} strokeWidth={1.9} />
        </span>
        <div className="min-w-0 flex-1 pt-0.5">
          <h3 className="text-[15px] font-semibold leading-snug text-ink line-clamp-2">{producto.nombre}</h3>
          {sinReceta ? (
            <p className="text-[12px] mt-0.5 flex items-center gap-1 text-copper font-medium">
              <CircleAlert size={12} /> Receta pendiente
            </p>
          ) : (
            <p className="text-[12px] mt-0.5 text-muted">
              {producto.ingredientes.length} insumo{producto.ingredientes.length === 1 ? "" : "s"} por porción
            </p>
          )}
        </div>
        {activo && <CircleCheck size={19} className="shrink-0 mt-0.5" style={{ color }} aria-label="En la orden" />}
      </div>

      <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-line">
        <span className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-muted">Porciones</span>
        <Stepper value={tandas} onChange={onChange} accentColor={color} />
      </div>
    </article>
  );
}
