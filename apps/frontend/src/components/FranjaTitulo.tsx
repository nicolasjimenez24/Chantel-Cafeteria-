import { useLocation } from "react-router-dom";
import { TazaIlustracion } from "./TazaIlustracion";

const SECCIONES: Record<string, { color: string; titulo: string; texto: string }> = {
  "/": {
    color: "hero-menta",
    titulo: "Producción del día",
    texto: "Elige cuántas porciones vas a preparar de cada producto y calcula los insumos que necesitas.",
  },
  "/resultados": {
    color: "hero-menta",
    titulo: "Resultado de la producción",
    texto: "Insumos que vas a consumir, cómo queda la bodega y el gasto del día.",
  },
  "/bodega": {
    color: "hero-lila",
    titulo: "Bodega",
    texto: "Registra lo que entró hoy y lo que ya tenías de cada insumo, en gramos.",
  },
  "/administracion": {
    color: "hero-mantequilla",
    titulo: "Recetas e insumos",
    texto: "Agrega productos e insumos y define cómo está compuesta cada receta.",
  },
  "/historial": {
    color: "hero-rosa",
    titulo: "Historial de producción",
    texto: "Consulta lo que se produjo cada día, cuántas porciones y qué insumos se usaron.",
  },
};

export function FranjaTitulo() {
  const { pathname } = useLocation();
  const s = SECCIONES[pathname];
  if (!s) return null;

  return (
    <section className={`hero ${s.color} no-print`}>
      <div className="max-w-6xl mx-auto px-5 md:px-8 py-5 md:py-6 flex items-center gap-8">
        <div className="hero-mancha px-7 py-5 md:px-10 md:py-6 w-full md:w-auto md:max-w-[600px]">
          <h1 className="font-display text-plum text-[30px] md:text-[40px] leading-[1.05]">{s.titulo}</h1>
          <p className="text-plum/85 text-[14.5px] md:text-[16px] mt-2 max-w-[44ch] leading-snug">{s.texto}</p>
        </div>
        <TazaIlustracion className="hidden md:block ml-auto w-[150px] shrink-0 drop-shadow-[0_10px_14px_rgba(15,46,34,0.25)]" />
      </div>
    </section>
  );
}
