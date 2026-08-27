export function toMoneyDouble(value: string | number): number {
  if (typeof value === "number") return value;
  if (!value) return 0.0;
  const cleaned = value.replace(/\$/g, "").replace(/,/g, "").trim();
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0.0 : parsed;
}

export function toPrint(value: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function discountToPrint(value: number): string {
  return `${Math.round(value * 100)}%`;
}

export function toLocalDate(millis: number): Date {
  return new Date(millis);
}

export function toEpochMillis(date: Date): number {
  return date.getTime();
}

export function toFormattedDate(millis: number): string {
  if (!millis || millis === 0) return "---";
  const date = new Date(millis);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}
