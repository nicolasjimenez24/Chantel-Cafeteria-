export function formatCantidad(gramos: number): string {
  if (gramos >= 1000) {
    return (
      (gramos / 1000).toLocaleString("es-CO", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }) + " kg"
    );
  }
  return Math.round(gramos).toLocaleString("es-CO") + " g";
}

/** Con signo explícito: un valor negativo es un faltante (se gastó más de lo que había). */
export function formatConSigno(gramos: number): string {
  const texto = formatCantidad(Math.abs(gramos));
  return gramos < 0 ? `− ${texto}` : texto;
}

export function formatCOP(valor: number | null | undefined): string {
  if (valor === null || valor === undefined) return "Pendiente";
  return valor.toLocaleString("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  });
}

export function fechaHoy(): string {
  return new Date().toLocaleDateString("es-CO", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

export function horaAhora(): string {
  return new Date().toLocaleTimeString("es-CO", {
    hour: "2-digit",
    minute: "2-digit",
  });
}
