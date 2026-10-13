import { X } from "lucide-react";

interface InfoModalProps {
  onClose: () => void;
}

const NOTAS: { titulo: string; texto: string }[] = [
  {
    titulo: "Origen de los datos",
    texto:
      "Las 52 recetas y los 65 insumos vienen del Excel INVENTARIO CAFETERIA FINAL. El cálculo se validó contra la hoja TOTAL_DIA: con las mismas porciones, el consumo de cada insumo coincide con el del Excel.",
  },
  {
    titulo: "Correcciones confirmadas por la pastelería",
    texto:
      "Aromática de hierbabuena: la harina de trigo (130) era agua. Porción de helado: las claras de huevo (130) eran helado. Jugo en agua: azúcar pulverizada 40, no 400. Huevos cremosos: huevos 100, no 650.",
  },
  {
    titulo: "Nombres normalizados",
    texto:
      "Cappuccino (el Excel lo escribía de dos formas), Crepe (estaba como Creepe), Té chai, Café Nuestra Tierra y Aromática de hierbabuena. Malteada y sodas pasaron a singular porque se cuentan por porción.",
  },
  {
    titulo: "Unidades",
    texto:
      "Todas las cantidades son por porción, en gramos o mililitros, igual que en el Excel. Empanadas, arepas, panes y huevos también se controlan en gramos.",
  },
  {
    titulo: "Bodega propia",
    texto:
      "Esta aplicación tiene su propia base de datos: sus insumos, bodega e historial son independientes de los de la producción de pastelería.",
  },
  {
    titulo: "Balance del día en bodega",
    texto:
      "Reproduce las columnas INGRESOS, BODEGA, TOTAL BODEGA, GASTOS DIARIOS y TOTAL FINAL de la hoja TOTAL_DIA, con las mismas fórmulas: total bodega = ingresos + bodega, y total final = total bodega − gastos del día. A diferencia del Excel, los insumos que no alcanzan se marcan en rojo y aparecen primero.",
  },
];

export function InfoModal({ onClose }: InfoModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-espresso/50"
      onClick={onClose}
    >
      <div
        className="max-w-lg w-full rounded-xl bg-paper p-6 max-h-[85vh] overflow-y-auto shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-[20px]">Notas de la migración del Excel</h3>
          <button onClick={onClose} aria-label="Cerrar" type="button">
            <X size={18} className="text-muted" />
          </button>
        </div>
        <ul className="space-y-4 text-[13.5px] leading-relaxed">
          {NOTAS.map((n) => (
            <li key={n.titulo}>
              <p className="font-semibold mb-0.5">{n.titulo}</p>
              <p className="text-ink/85">{n.texto}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
