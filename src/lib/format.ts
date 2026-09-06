/**
 * Formatea una fecha límite (guardada como medianoche UTC, a partir de un
 * <input type="date">) en la zona UTC, no la del navegador. Si se formateara
 * en hora local, en cualquier zona horaria detrás de UTC (todo América)
 * aparecería un día antes del que el docente escribió.
 */
export function formatDueDate(iso: string | Date) {
  return new Intl.DateTimeFormat("es", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(iso));
}
