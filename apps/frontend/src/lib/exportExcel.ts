import type { Workbook, Worksheet } from "exceljs";
import type { BalanceInsumo, Categoria, ResultadoProduccion, ResumenDia } from "@pasteleria/core";
import { fechaHoy } from "@/lib/format";
import { nombreDelDia, horaDe } from "@/lib/fechas";

/*
 * Exportación a Excel con formato: casillas con bordes, encabezados de color,
 * filas alternadas, totales resaltados y colores por categoría.
 * exceljs se carga solo al exportar, para no pesar al abrir la aplicación.
 */

// Colores de la marca, en ARGB (formato que usa Excel).
const C = {
  ciruela: "FF4B2348",
  ciruelaOscuro: "FF36172F",
  lila: "FFE6D3EE",
  lilaSuave: "FFF8F3F9",
  bosque: "FF0F2E22",
  borde: "FFDCCBE0",
  texto: "FF2A1A2A",
  apagado: "FF7D6A7C",
  blanco: "FFFFFFFF",
  rojo: "FFB03A64",
  rojoSuave: "FFFBE7EE",
  verde: "FF2F8A55",
};

/** Relleno suave y color de texto de cada categoría, iguales a los de la app. */
const CATEGORIA: Record<Categoria, { fondo: string; texto: string }> = {
  "Bebidas calientes": { fondo: "FFF0E6E1", texto: "FF7A4E3A" },
  "Bebidas frías": { fondo: "FFE2F1E8", texto: "FF2F8A55" },
  Comidas: { fondo: "FFF5EBD9", texto: "FFA8731F" },
  "Helados y postres": { fondo: "FFF6E1E8", texto: "FFB03A64" },
};

const FMT_G = '#,##0 "g"';
const FMT_KG = '#,##0.00 "kg"';
const FMT_ENTERO = "#,##0";

interface Columna {
  titulo: string;
  ancho: number;
  formato?: string;
  alinear?: "left" | "center" | "right";
}

type Celda = string | number | null;

interface OpcionesTabla {
  columnas: Columna[];
  filas: Celda[][];
  /** Fila final de totales (null en las columnas sin total). */
  total?: Celda[];
  /** Estilo especial por fila (por ejemplo, rojo para faltantes). */
  estiloFila?: (fila: Celda[], indice: number) => { fondo?: string; texto?: string; negrita?: boolean } | undefined;
  /** Estilo especial por casilla (por ejemplo, color de la categoría). */
  estiloCelda?: (fila: Celda[], col: number) => { fondo?: string; texto?: string; negrita?: boolean } | undefined;
}

const bordeFino = { style: "thin" as const, color: { argb: C.borde } };
const BORDES = { top: bordeFino, left: bordeFino, bottom: bordeFino, right: bordeFino };

function relleno(argb: string) {
  return { type: "pattern" as const, pattern: "solid" as const, fgColor: { argb } };
}

/** Franja de título de la marca en las primeras filas de la hoja. */
function encabezado(ws: Worksheet, titulo: string, subtitulo: string, columnas: number) {
  ws.mergeCells(1, 1, 1, columnas);
  const t = ws.getCell(1, 1);
  t.value = titulo;
  t.font = { name: "Calibri", size: 16, bold: true, color: { argb: C.blanco } };
  t.fill = relleno(C.ciruela);
  t.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
  ws.getRow(1).height = 32;

  ws.mergeCells(2, 1, 2, columnas);
  const s = ws.getCell(2, 1);
  s.value = subtitulo;
  s.font = { name: "Calibri", size: 10, italic: true, color: { argb: C.apagado } };
  s.fill = relleno(C.lilaSuave);
  s.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
  ws.getRow(2).height = 20;
}

/** Tabla con encabezado de color, filas alternadas, bordes y fila de totales. Devuelve la fila siguiente libre. */
function tabla(ws: Worksheet, filaInicio: number, op: OpcionesTabla): number {
  const { columnas, filas } = op;
  columnas.forEach((c, i) => {
    const col = ws.getColumn(i + 1);
    col.width = Math.max(col.width ?? 0, c.ancho);
  });

  const cab = ws.getRow(filaInicio);
  columnas.forEach((c, i) => {
    const cell = cab.getCell(i + 1);
    cell.value = c.titulo;
    cell.font = { bold: true, color: { argb: C.blanco }, size: 11 };
    cell.fill = relleno(C.bosque);
    cell.border = BORDES;
    cell.alignment = { vertical: "middle", horizontal: c.alinear ?? (c.formato ? "right" : "left"), wrapText: true };
  });
  cab.height = 24;

  filas.forEach((datos, idx) => {
    const fila = ws.getRow(filaInicio + 1 + idx);
    const especial = op.estiloFila?.(datos, idx);
    datos.forEach((v, i) => {
      const c = columnas[i];
      const cell = fila.getCell(i + 1);
      cell.value = v ?? "";
      cell.border = BORDES;
      cell.alignment = { vertical: "middle", horizontal: c.alinear ?? (c.formato ? "right" : "left") };
      if (c.formato && typeof v === "number") cell.numFmt = c.formato;
      const propio = op.estiloCelda?.(datos, i);
      const fondo = propio?.fondo ?? especial?.fondo ?? (idx % 2 === 1 ? C.lilaSuave : C.blanco);
      cell.fill = relleno(fondo);
      cell.font = {
        color: { argb: propio?.texto ?? especial?.texto ?? C.texto },
        bold: propio?.negrita ?? especial?.negrita ?? false,
      };
    });
    fila.height = 19;
  });

  let siguiente = filaInicio + 1 + filas.length;
  if (op.total) {
    const fila = ws.getRow(siguiente);
    op.total.forEach((v, i) => {
      const c = columnas[i];
      const cell = fila.getCell(i + 1);
      cell.value = v ?? "";
      cell.font = { bold: true, color: { argb: C.ciruelaOscuro } };
      cell.fill = relleno(C.lila);
      cell.border = { ...BORDES, top: { style: "medium", color: { argb: C.ciruela } } };
      cell.alignment = { vertical: "middle", horizontal: c.alinear ?? (c.formato ? "right" : "left") };
      if (c.formato && typeof v === "number") cell.numFmt = c.formato;
    });
    fila.height = 22;
    siguiente++;
  }

  // Filtros en el encabezado (solo si hay filas).
  if (filas.length > 0) {
    ws.autoFilter = {
      from: { row: filaInicio, column: 1 },
      to: { row: filaInicio + filas.length, column: columnas.length },
    };
  }
  return siguiente + 1;
}

/** Hoja con encabezado de marca + una tabla, con la cabecera fija al desplazarse. */
function hojaConTabla(wb: Workbook, nombre: string, titulo: string, subtitulo: string, op: OpcionesTabla) {
  const ws = wb.addWorksheet(nombre, {
    views: [{ state: "frozen", ySplit: 4 }],
    properties: { tabColor: { argb: C.ciruela } },
    pageSetup: { orientation: "portrait", fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
  });
  encabezado(ws, titulo, subtitulo, op.columnas.length);
  tabla(ws, 4, op);
  return ws;
}

/** Hoja de resumen: datos clave en dos columnas (etiqueta / valor). */
function hojaResumen(wb: Workbook, titulo: string, subtitulo: string, datos: [string, Celda, string?][]) {
  const ws = wb.addWorksheet("Resumen", { properties: { tabColor: { argb: C.bosque } } });
  encabezado(ws, titulo, subtitulo, 2);
  ws.getColumn(1).width = 34;
  ws.getColumn(2).width = 24;
  datos.forEach(([etiqueta, valor, formato], i) => {
    const fila = ws.getRow(4 + i);
    const a = fila.getCell(1);
    const b = fila.getCell(2);
    a.value = etiqueta;
    a.font = { bold: true, color: { argb: C.texto } };
    a.fill = relleno(C.lila);
    b.value = valor ?? "";
    b.font = { bold: true, size: 12, color: { argb: C.ciruela } };
    b.fill = relleno(C.blanco);
    b.alignment = { horizontal: "right" };
    if (formato && typeof valor === "number") b.numFmt = formato;
    a.border = BORDES;
    b.border = BORDES;
    fila.height = 22;
  });
  return ws;
}

function hojaBalance(wb: Workbook, balance: BalanceInsumo[], subtitulo: string) {
  hojaConTabla(wb, "Balance de bodega", "Balance de bodega", subtitulo, {
    columnas: [
      { titulo: "Insumo", ancho: 30 },
      { titulo: "Ingresos", ancho: 14, formato: FMT_G },
      { titulo: "Bodega", ancho: 14, formato: FMT_G },
      { titulo: "Total bodega", ancho: 15, formato: FMT_G },
      { titulo: "Gastos del día", ancho: 15, formato: FMT_G },
      { titulo: "Total final", ancho: 15, formato: FMT_G },
      { titulo: "Estado", ancho: 13, alinear: "center" },
    ],
    filas: balance.map((b) => [
      b.nombre,
      Math.round(b.ingresos),
      Math.round(b.bodega),
      Math.round(b.totalBodega),
      Math.round(b.gastosDiarios),
      Math.round(b.totalFinal),
      b.totalFinal < 0 ? "Faltante" : "Alcanza",
    ]),
    total: [
      "Total",
      Math.round(balance.reduce((s, b) => s + b.ingresos, 0)),
      Math.round(balance.reduce((s, b) => s + b.bodega, 0)),
      Math.round(balance.reduce((s, b) => s + b.totalBodega, 0)),
      Math.round(balance.reduce((s, b) => s + b.gastosDiarios, 0)),
      Math.round(balance.reduce((s, b) => s + b.totalFinal, 0)),
      null,
    ],
    // Faltantes en rojo; el estado "Alcanza" en verde.
    estiloCelda: (fila, col) => {
      const faltante = (fila[5] as number) < 0;
      if (col === 6) return faltante ? { fondo: C.rojo, texto: C.blanco, negrita: true } : { texto: C.verde, negrita: true };
      if (col === 5 && faltante) return { fondo: C.rojoSuave, texto: C.rojo, negrita: true };
      return undefined;
    },
  });
}

async function descargar(wb: Workbook, archivo: string) {
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = archivo;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function nuevoLibro(): Promise<Workbook> {
  const ExcelJS = (await import("exceljs")).default;
  const wb = new ExcelJS.Workbook();
  wb.creator = "Chantel Cafetería";
  wb.created = new Date();
  return wb;
}

const kg = (g: number) => Math.round(g) / 1000;

/** Excel del cálculo actual (pantalla Resultados). */
export async function exportarProduccionAExcel(resultado: ResultadoProduccion) {
  const wb = await nuevoLibro();
  const fecha = fechaHoy();
  const pesoTotal = resultado.consumoConsolidado.reduce((s, c) => s + c.totalGramos, 0);

  hojaResumen(wb, "Control de producción", `Chantel Cafetería · ${fecha}`, [
    ["Fecha", fecha],
    ["Productos", resultado.cantidadProductos, FMT_ENTERO],
    ["Tandas totales", resultado.totalTandas, FMT_ENTERO],
    ["Insumos distintos", resultado.consumoConsolidado.length, FMT_ENTERO],
    ["Insumos a usar", kg(pesoTotal), FMT_KG],
    ["Insumos con faltante en bodega", resultado.insumosFaltantes, FMT_ENTERO],
  ]);

  hojaConTabla(wb, "Productos", "Productos a producir", `Porciones por producto · ${fecha}`, {
    columnas: [
      { titulo: "#", ancho: 6, alinear: "center" },
      { titulo: "Producto", ancho: 30 },
      { titulo: "Categoría", ancho: 20 },
      { titulo: "Porciones", ancho: 11, formato: FMT_ENTERO },
      { titulo: "Insumos (kg)", ancho: 15, formato: FMT_KG },
    ],
    filas: resultado.porProducto.map((p, i) => [
      i + 1,
      p.nombre,
      p.categoria,
      p.tandas,
      kg(p.items.reduce((s, it) => s + it.totalGramos, 0)),
    ]),
    total: [null, "Total", null, resultado.totalTandas, kg(pesoTotal)],
    estiloCelda: (fila, col) => {
      const cat = CATEGORIA[fila[2] as Categoria];
      return col === 2 && cat ? { fondo: cat.fondo, texto: cat.texto, negrita: true } : undefined;
    },
  });

  hojaConTabla(wb, "Consumo total", "Consumo total de insumos", `Suma de todas las recetas · ${fecha}`, {
    columnas: [
      { titulo: "#", ancho: 6, alinear: "center" },
      { titulo: "Insumo", ancho: 32 },
      { titulo: "Cantidad (g)", ancho: 16, formato: FMT_G },
      { titulo: "Cantidad (kg)", ancho: 16, formato: FMT_KG },
    ],
    filas: resultado.consumoConsolidado.map((c, i) => [i + 1, c.nombre, Math.round(c.totalGramos), kg(c.totalGramos)]),
    total: [null, "Total", Math.round(pesoTotal), kg(pesoTotal)],
  });

  // Detalle: cada producto con sus insumos; el color de fondo cambia por producto.
  const detalle: Celda[][] = [];
  const grupo: number[] = [];
  resultado.porProducto.forEach((p, gi) => {
    p.items.forEach((it) => {
      detalle.push([p.nombre, p.categoria, it.nombre, it.gramosPorTanda, p.tandas, Math.round(it.totalGramos)]);
      grupo.push(gi);
    });
  });
  hojaConTabla(wb, "Detalle por producto", "Detalle por producto", "Gramos por porción × porciones = total", {
    columnas: [
      { titulo: "Producto", ancho: 26 },
      { titulo: "Categoría", ancho: 18 },
      { titulo: "Insumo", ancho: 28 },
      { titulo: "Por porción", ancho: 13, formato: FMT_G },
      { titulo: "Porciones", ancho: 10, formato: FMT_ENTERO },
      { titulo: "Total", ancho: 14, formato: FMT_G },
    ],
    filas: detalle,
    estiloFila: (_f, i) => ({ fondo: grupo[i] % 2 === 0 ? C.blanco : C.lilaSuave }),
    estiloCelda: (fila, col) => {
      const cat = CATEGORIA[fila[1] as Categoria];
      if (col === 1 && cat) return { fondo: cat.fondo, texto: cat.texto, negrita: true };
      if (col === 0) return { negrita: true };
      return undefined;
    },
  });

  if (resultado.balance.length > 0) hojaBalance(wb, resultado.balance, `Total final = total bodega − gastos del día · ${fecha}`);

  await descargar(wb, `cafeteria_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

/** Excel de un día del historial. */
export async function exportarDiaAExcel(resumen: ResumenDia, categoriaDe: (nombre: string) => Categoria | undefined) {
  const wb = await nuevoLibro();
  const { principal, detalle } = nombreDelDia(resumen.dia);
  const fechaLarga = detalle ?? principal;
  const pesoTotal = resumen.consumo.reduce((s, c) => s + c.totalGramos, 0);

  hojaResumen(wb, "Historial de producción", `Chantel Cafetería · ${fechaLarga}`, [
    ["Día", fechaLarga],
    ["Producciones guardadas", resumen.cantidadProducciones, FMT_ENTERO],
    ["Productos distintos", resumen.productos.length, FMT_ENTERO],
    ["Tandas totales", resumen.totalTandas, FMT_ENTERO],
    ["Insumos distintos", resumen.consumo.length, FMT_ENTERO],
    ["Insumos utilizados", kg(pesoTotal), FMT_KG],
  ]);

  hojaConTabla(wb, "Productos del día", "Productos del día", `Porciones sumadas de todas las producciones · ${fechaLarga}`, {
    columnas: [
      { titulo: "#", ancho: 6, alinear: "center" },
      { titulo: "Producto", ancho: 30 },
      { titulo: "Categoría", ancho: 20 },
      { titulo: "Porciones", ancho: 11, formato: FMT_ENTERO },
    ],
    filas: resumen.productos.map((p, i) => [i + 1, p.nombre, categoriaDe(p.nombre) ?? "—", p.tandas]),
    total: [null, "Total", null, resumen.totalTandas],
    estiloCelda: (fila, col) => {
      const cat = CATEGORIA[fila[2] as Categoria];
      return col === 2 && cat ? { fondo: cat.fondo, texto: cat.texto, negrita: true } : undefined;
    },
  });

  hojaConTabla(wb, "Insumos consumidos", "Insumos consumidos", `De mayor a menor · ${fechaLarga}`, {
    columnas: [
      { titulo: "#", ancho: 6, alinear: "center" },
      { titulo: "Insumo", ancho: 32 },
      { titulo: "Cantidad (g)", ancho: 16, formato: FMT_G },
      { titulo: "Cantidad (kg)", ancho: 16, formato: FMT_KG },
    ],
    filas: resumen.consumo.map((c, i) => [i + 1, c.nombre, Math.round(c.totalGramos), kg(c.totalGramos)]),
    total: [null, "Total", Math.round(pesoTotal), kg(pesoTotal)],
  });

  // Cada producción guardada con sus productos; el fondo alterna por producción.
  const filas: Celda[][] = [];
  const grupo: number[] = [];
  const ordenadas = [...resumen.producciones].sort((a, b) => a.creadoEn.localeCompare(b.creadoEn));
  ordenadas.forEach((p, gi) => {
    p.productos.forEach((prod, j) => {
      filas.push([j === 0 ? horaDe(p.creadoEn) : "", prod.nombre, categoriaDe(prod.nombre) ?? "—", prod.tandas]);
      grupo.push(gi);
    });
  });
  hojaConTabla(wb, "Producciones", "Producciones guardadas", `${resumen.cantidadProducciones} producción(es) en el día`, {
    columnas: [
      { titulo: "Hora", ancho: 13, alinear: "center" },
      { titulo: "Producto", ancho: 30 },
      { titulo: "Categoría", ancho: 20 },
      { titulo: "Porciones", ancho: 11, formato: FMT_ENTERO },
    ],
    filas,
    total: [null, "Total", null, resumen.totalTandas],
    estiloFila: (_f, i) => ({ fondo: grupo[i] % 2 === 0 ? C.blanco : C.lilaSuave }),
    estiloCelda: (fila, col) => {
      const cat = CATEGORIA[fila[2] as Categoria];
      if (col === 2 && cat) return { fondo: cat.fondo, texto: cat.texto, negrita: true };
      if (col === 0 && fila[0]) return { texto: C.ciruela, negrita: true };
      return undefined;
    },
  });

  // Balance de la última producción del día: es el que quedó en bodega.
  const ultima = [...resumen.producciones].sort((a, b) => b.creadoEn.localeCompare(a.creadoEn))[0];
  if (ultima?.balance?.length) {
    hojaBalance(wb, ultima.balance, `Según la última producción del día (${horaDe(ultima.creadoEn)})`);
  }

  await descargar(wb, `cafeteria_historial_${resumen.dia}.xlsx`);
}
