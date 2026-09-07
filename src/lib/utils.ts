import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatMoney(value: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
  }).format(value || 0);
}

export function formatDate(epochMs: number): string {
  if (!epochMs) return "-";
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(epochMs));
}

export function daysUntil(epochMs: number): number {
  const MS_DAY = 1000 * 60 * 60 * 24;
  return Math.ceil((epochMs - Date.now()) / MS_DAY);
}
