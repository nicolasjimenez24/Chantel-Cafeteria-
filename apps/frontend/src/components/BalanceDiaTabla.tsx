import type { BalanceInsumo } from "@pasteleria/core";
import { formatCantidad, formatConSigno } from "@/lib/format";

interface BalanceDiaTablaProps {
  balance: BalanceInsumo[];
}

function celda(gramos: number) {
  if (gramos === 0) return <span className="text-muted">—</span>;
  return formatConSigno(gramos);
}

export function BalanceDiaTabla({ balance }: BalanceDiaTablaProps) {
  if (balance.length === 0) {
    return (
      <p className="text-[13.5px] text-muted card px-4 py-5">
        Todavía no hay datos de bodega. Regístralos en la pestaña Bodega y el balance del día
        aparecerá aquí.
      </p>
    );
  }

  const totales = balance.reduce(
    (acc, b) => ({
      ingresos: acc.ingresos + b.ingresos,
      bodega: acc.bodega + b.bodega,
      totalBodega: acc.totalBodega + b.totalBodega,
      gastosDiarios: acc.gastosDiarios + b.gastosDiarios,
      totalFinal: acc.totalFinal + b.totalFinal,
    }),
    { ingresos: 0, bodega: 0, totalBodega: 0, gastosDiarios: 0, totalFinal: 0 }
  );

  return (
    <div className="card overflow-x-auto">
      <table className="w-full text-[13.5px] min-w-[620px]">
        <thead>
          <tr className="thead-row border-b border-line">
            <th className="text-left font-normal py-2.5 px-4">Insumo</th>
            <th className="text-right font-normal py-2.5 px-3">Ingresos</th>
            <th className="text-right font-normal py-2.5 px-3">Bodega</th>
            <th className="text-right font-normal py-2.5 px-3">Total bodega</th>
            <th className="text-right font-normal py-2.5 px-3">Gastos del día</th>
            <th className="text-right font-normal py-2.5 px-4">Total final</th>
          </tr>
        </thead>
        <tbody className="font-mono-num">
          {balance.map((b) => (
            <tr key={b.insumoId} className="border-t border-line">
              <td className="py-2 px-4 font-sans">{b.nombre}</td>
              <td className="py-2 px-3 text-right">{celda(b.ingresos)}</td>
              <td className="py-2 px-3 text-right">{celda(b.bodega)}</td>
              <td className="py-2 px-3 text-right">{celda(b.totalBodega)}</td>
              <td className="py-2 px-3 text-right">{celda(b.gastosDiarios)}</td>
              <td
                className="py-2 px-4 text-right font-semibold"
                style={b.totalFinal < 0 ? { color: "var(--color-berry)" } : undefined}
              >
                {formatConSigno(b.totalFinal)}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t border-line font-mono-num font-semibold">
            <td className="py-2.5 px-4 font-sans">Total</td>
            <td className="py-2.5 px-3 text-right">{formatCantidad(totales.ingresos)}</td>
            <td className="py-2.5 px-3 text-right">{formatConSigno(totales.bodega)}</td>
            <td className="py-2.5 px-3 text-right">{formatConSigno(totales.totalBodega)}</td>
            <td className="py-2.5 px-3 text-right">{formatCantidad(totales.gastosDiarios)}</td>
            <td className="py-2.5 px-4 text-right">{formatConSigno(totales.totalFinal)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
