import { Navigate, useNavigate } from "react-router-dom";
import { ArrowLeft, Save, Download, Printer, RotateCcw } from "lucide-react";
import { useApp } from "@/state/AppContext";
import { formatCantidad, fechaHoy } from "@/lib/format";
import { exportarProduccionAExcel } from "@/lib/exportExcel";
import { DetalleProductoCard } from "@/components/DetalleProductoCard";
import { BalanceDiaTabla } from "@/components/BalanceDiaTabla";

export function ResultadosPage() {
  const { resultado, guardarProduccionActual, limpiarTandas, notify } = useApp();
  const navigate = useNavigate();

  if (!resultado) return <Navigate to="/" replace />;

  const tarjetas = [
    { label: "Fecha", value: fechaHoy(), destacada: false },
    { label: "Productos", value: String(resultado.cantidadProductos), destacada: false },
    { label: "Tandas totales", value: String(resultado.totalTandas), destacada: false },
    {
      label: "Insumos a usar",
      value: formatCantidad(resultado.consumoConsolidado.reduce((s, c) => s + c.totalGramos, 0)),
      destacada: true,
    },
  ];

  return (
    <div className="pb-10">
      <button
        onClick={() => navigate("/")}
        className="no-print flex items-center gap-1.5 text-[13px] text-muted mb-5 hover:text-ink transition-colors"
        type="button"
      >
        <ArrowLeft size={14} /> Volver a producción
      </button>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {tarjetas.map((c) => (
          <div
            key={c.label}
            className={
              c.destacada
                ? "rounded-[0.625rem] px-4 py-3 bg-espresso text-cream border border-espresso"
                : "card px-4 py-3"
            }
            style={c.destacada ? { boxShadow: "0 2px 6px rgba(33,22,15,.18)" } : undefined}
          >
            <div className={`text-[11.5px] ${c.destacada ? "text-cream/60" : "text-muted"}`}>
              {c.label}
            </div>
            <div className="font-display text-[23px] mt-1 leading-none">{c.value}</div>
          </div>
        ))}
      </div>

      <h2 className="font-display text-[17px] mb-2.5 px-0.5">Consumo total de ingredientes</h2>
      <div className="card overflow-hidden mb-7">
        <table className="w-full text-[13.5px]">
          <thead>
            <tr className="thead-row border-b border-line">
              <th className="text-left font-normal py-2.5 px-4">Ingrediente</th>
              <th className="text-right font-normal py-2.5 px-4">Cantidad requerida</th>
            </tr>
          </thead>
          <tbody className="font-mono-num">
            {resultado.consumoConsolidado.map((c) => (
              <tr key={c.insumoId} className="border-t border-line">
                <td className="py-2 px-4 font-sans">{c.nombre}</td>
                <td className="py-2 px-4 text-right">{formatCantidad(c.totalGramos)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="font-display text-[17px] mb-2.5 px-0.5">Balance del día en bodega</h2>
      <div className="mb-7">
        <BalanceDiaTabla balance={resultado.balance} />
      </div>

      <h2 className="font-display text-[17px] mb-2.5 px-0.5">Resultado por producto</h2>
      <div className="space-y-2 mb-8">
        {resultado.porProducto.map((item) => (
          <DetalleProductoCard key={item.productoId} item={item} />
        ))}
      </div>

      <div className="no-print flex flex-wrap gap-2">
        <button
          onClick={guardarProduccionActual}
          className="btn btn-primary"
          type="button"
        >
          <Save size={15} /> Guardar y pasar a bodega
        </button>
        <button
          onClick={async () => {
            try {
              await exportarProduccionAExcel(resultado);
              notify("Excel exportado");
            } catch {
              notify("No se pudo generar el Excel");
            }
          }}
          className="btn btn-secondary"
          type="button"
        >
          <Download size={15} /> Exportar a Excel
        </button>
        <button
          onClick={() => window.print()}
          className="btn btn-secondary"
          type="button"
        >
          <Printer size={15} /> Imprimir / PDF
        </button>
        <button
          onClick={() => {
            limpiarTandas();
            navigate("/");
          }}
          className="btn btn-ghost ml-auto"
          type="button"
        >
          <RotateCcw size={15} /> Nueva producción
        </button>
      </div>
    </div>
  );
}
