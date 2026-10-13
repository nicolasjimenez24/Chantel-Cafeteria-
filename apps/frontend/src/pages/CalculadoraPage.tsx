import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SearchX } from "lucide-react";
import { calcularProduccion, type Categoria, type Producto } from "@pasteleria/core";
import { useApp } from "@/state/AppContext";
import { CATEGORIAS } from "@/lib/categorias";
import { CategoriaSeccion } from "@/components/CategoriaSeccion";
import { BarraResumen } from "@/components/BarraResumen";
import { BuscadorProductos } from "@/components/BuscadorProductos";
import { FiltroCategorias, type FiltroCategoria } from "@/components/FiltroCategorias";
import { IndicadoresProduccion } from "@/components/IndicadoresProduccion";
import { OrdenProduccion } from "@/components/OrdenProduccion";

/** Normaliza para que "limon" encuentre "Limón" y "cafe" encuentre "Café". */
function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function CalculadoraPage() {
  const { catalogo, bodegaMap, tandasMap, setTandasMap, limpiarTandas, calcular } = useApp();
  const navigate = useNavigate();
  const [busqueda, setBusqueda] = useState("");
  const [filtro, setFiltro] = useState<FiltroCategoria>("todas");

  const activos = useMemo(() => catalogo.productos.filter((p) => p.activo), [catalogo.productos]);

  const visibles = useMemo(() => {
    const q = normalizar(busqueda.trim());
    return activos.filter((p) => {
      if (filtro !== "todas" && p.categoria !== filtro) return false;
      if (!q) return true;
      // Los productos ya seleccionados siguen visibles para no perderlos de vista al filtrar.
      return normalizar(p.nombre).includes(q) || (tandasMap[p.id] || 0) > 0;
    });
  }, [activos, busqueda, filtro, tandasMap]);

  const porCategoria = useMemo(() => {
    const map = new Map<Categoria, Producto[]>();
    CATEGORIAS.forEach((c) => map.set(c.id, []));
    visibles.forEach((p) => {
      const arr = map.get(p.categoria) ?? [];
      arr.push(p);
      map.set(p.categoria, arr);
    });
    return map;
  }, [visibles]);

  const productosSeleccionados = Object.values(tandasMap).filter((v) => Number(v) > 0).length;
  const totalTandas = Object.values(tandasMap).reduce((s, v) => s + (Number(v) || 0), 0);

  // Vista previa en vivo: el mismo cálculo que "Calcular", sin cambiar de pantalla.
  const previa = useMemo(
    () =>
      productosSeleccionados > 0
        ? calcularProduccion(tandasMap, catalogo.productos, catalogo.insumos, bodegaMap)
        : null,
    [productosSeleccionados, tandasMap, catalogo, bodegaMap]
  );

  const cambiarTandas = (id: string, v: number) => setTandasMap((m) => ({ ...m, [id]: Math.max(0, v) }));

  const handleCalcular = () => {
    calcular();
    navigate("/resultados");
  };

  const handleLimpiar = () => {
    limpiarTandas();
    setBusqueda("");
  };

  return (
    <div className="pb-32 lg:pb-12">
      <IndicadoresProduccion resultado={previa} productosActivos={activos.length} />

      <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_320px] items-start">
        <div className="min-w-0">
          {/* Si no caben en una fila, el buscador pasa debajo de las categorías. */}
          <div className="no-print flex flex-wrap items-center gap-x-3 gap-y-2 mb-6">
            <div className="min-w-0 max-w-full">
              <FiltroCategorias valor={filtro} onChange={setFiltro} productos={activos} tandasMap={tandasMap} />
            </div>
            <div className="flex-1 min-w-[220px]">
              <BuscadorProductos valor={busqueda} onChange={setBusqueda} resultados={visibles.length} />
            </div>
          </div>

          {visibles.length === 0 && (
            <div className="card py-14 px-6 text-center flex flex-col items-center">
              <span className="w-12 h-12 rounded-full bg-panel-alt text-muted flex items-center justify-center mb-3">
                <SearchX size={22} />
              </span>
              <p className="text-[15px] font-semibold">Ningún producto coincide</p>
              <p className="text-[13px] text-muted mt-1">
                Prueba con otro nombre u otra categoría, o revisa que el producto esté activo en Recetas.
              </p>
            </div>
          )}

          {CATEGORIAS.filter((c) => (porCategoria.get(c.id) ?? []).length > 0).map((c) => (
            <CategoriaSeccion
              key={c.id}
              categoria={c.id}
              productos={porCategoria.get(c.id) ?? []}
              tandasMap={tandasMap}
              onChangeTandas={cambiarTandas}
            />
          ))}
        </div>

        <div className="hidden lg:block sticky top-5">
          <OrdenProduccion
            productos={activos}
            tandasMap={tandasMap}
            onChangeTandas={cambiarTandas}
            onCalcular={handleCalcular}
            onLimpiar={handleLimpiar}
          />
        </div>
      </div>

      <div className="lg:hidden">
        <BarraResumen
          productosSeleccionados={productosSeleccionados}
          totalTandas={totalTandas}
          puedeCalcular={productosSeleccionados > 0}
          onCalcular={handleCalcular}
          onLimpiar={handleLimpiar}
        />
      </div>
    </div>
  );
}
