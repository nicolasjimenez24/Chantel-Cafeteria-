import { Coffee, CupSoda, IceCreamCone, Sandwich, type LucideIcon } from "lucide-react";
import type { Categoria } from "@pasteleria/core";

/**
 * Cada categoría tiene un color propio que funciona como guía visual:
 * café para lo caliente, menta para lo frío, caramelo para las comidas y
 * frambuesa para helados y postres.
 */
export const CATEGORIAS: {
  id: Categoria;
  color: string;
  colorSoft: string;
  nota: string;
  /** Nombre breve para filtros y chips. */
  corta: string;
  icono: LucideIcon;
}[] = [
  {
    id: "Bebidas calientes",
    color: "var(--color-cocoa)",
    colorSoft: "var(--color-cocoa-10)",
    nota: "Bebidas calientes",
    corta: "Calientes",
    icono: Coffee,
  },
  {
    id: "Bebidas frías",
    color: "var(--color-pistachio)",
    colorSoft: "var(--color-pistachio-10)",
    nota: "Bebidas frías",
    corta: "Frías",
    icono: CupSoda,
  },
  { id: "Comidas", color: "var(--color-caramel)", colorSoft: "var(--color-caramel-10)", nota: "Comidas", corta: "Comidas", icono: Sandwich },
  {
    id: "Helados y postres",
    color: "var(--color-berry)",
    colorSoft: "var(--color-berry-10)",
    nota: "Helados y postres",
    corta: "Helados",
    icono: IceCreamCone,
  },
];

export function metaDeCategoria(categoria: Categoria) {
  return CATEGORIAS.find((c) => c.id === categoria) ?? CATEGORIAS[0];
}

export function colorDeCategoria(categoria: Categoria): string {
  return CATEGORIAS.find((c) => c.id === categoria)?.color ?? "var(--color-ink)";
}

export function colorSuaveDeCategoria(categoria: Categoria): string {
  return CATEGORIAS.find((c) => c.id === categoria)?.colorSoft ?? "var(--color-line)";
}
