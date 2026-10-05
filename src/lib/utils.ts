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

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

export function toLocalISODate(epochMs: number): string {
  const date = new Date(epochMs);
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

export function todayLocalISODate(): string {
  return toLocalISODate(Date.now());
}

export function parseLocalISODate(isoDate: string): number {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  if (!match) return NaN;
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])).getTime();
}

export function dateWithCurrentTime(isoDate: string): number {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  if (!match) return NaN;
  const now = new Date();
  return new Date(
    Number(match[1]), Number(match[2]) - 1, Number(match[3]),
    now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds(),
  ).getTime();
}

export function daysUntil(epochMs: number): number {
  const MS_DAY = 1000 * 60 * 60 * 24;
  return Math.ceil((epochMs - Date.now()) / MS_DAY);
}
