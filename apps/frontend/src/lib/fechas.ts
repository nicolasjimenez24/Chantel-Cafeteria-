import { diaLocal } from "@pasteleria/core";

export type Periodo = "hoy" | "semana" | "mes" | "todo" | "personalizado";

/** Rango de días (AAAA-MM-DD) de cada filtro rápido. "todo" no limita. */
export function rangoDePeriodo(periodo: Exclude<Periodo, "personalizado">): { desde: string; hasta: string } {
  const hoy = new Date();
  const hasta = diaLocal(hoy);
  switch (periodo) {
    case "hoy":
      return { desde: hasta, hasta };
    case "semana":
      return { desde: diaLocal(new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() - 6)), hasta };
    case "mes":
      return { desde: diaLocal(new Date(hoy.getFullYear(), hoy.getMonth(), 1)), hasta };
    case "todo":
      return { desde: "", hasta: "" };
  }
}

/** "Hoy", "Ayer" o "Lunes 5 de octubre de 2026". */
export function nombreDelDia(dia: string): { principal: string; detalle: string | null } {
  const [a, m, d] = dia.split("-").map(Number);
  const fecha = new Date(a, m - 1, d);
  const largo = fecha.toLocaleDateString("es-CO", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const capitalizado = largo.charAt(0).toUpperCase() + largo.slice(1);

  const hoy = new Date();
  const ayer = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() - 1);
  if (dia === diaLocal(hoy)) return { principal: "Hoy", detalle: capitalizado };
  if (dia === diaLocal(ayer)) return { principal: "Ayer", detalle: capitalizado };
  return { principal: capitalizado, detalle: null };
}

export function horaDe(creadoEn: string): string {
  return new Date(creadoEn).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });
}
