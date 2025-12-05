const formatter = new Intl.NumberFormat("es-DO", {
  style: "currency",
  currency: "DOP",
  maximumFractionDigits: 2,
});

export function formatCurrency(value?: number | null) {
  if (value == null) return formatter.format(0);
  return formatter.format(value);
}
