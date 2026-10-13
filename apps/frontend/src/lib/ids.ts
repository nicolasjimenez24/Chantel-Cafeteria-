/** Id estable y legible a partir de un nombre: "Torta de Limón" → "torta_de_limon_lx3k9a". */
export function crearId(nombre: string): string {
  const base = nombre
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return `${base || "item"}_${Date.now().toString(36)}`;
}

/** Normaliza para buscar: "limon" encuentra "Limón". */
export function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}
