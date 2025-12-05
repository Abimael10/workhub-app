import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

export function formatDate(value?: string | Date | null, pattern = "MMM d, yyyy") {
  if (!value) return "—";
  const date = typeof value === "string" ? parseISO(value) : value;
  return format(date, pattern, { locale: es });
}

export function isPastDate(value?: string | Date | null) {
  if (!value) return false;
  const date = typeof value === "string" ? parseISO(value) : value;
  return date.getTime() < Date.now();
}
