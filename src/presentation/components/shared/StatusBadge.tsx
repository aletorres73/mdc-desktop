import { cn } from "@/lib/utils";

export type StatusVariant = "success" | "warning" | "danger" | "info" | "neutral";

interface StatusBadgeProps {
  status: string;
  variant?: StatusVariant;
  className?: string;
}

const variantStyles: Record<StatusVariant, string> = {
  success: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  warning: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  danger: "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300",
  info: "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300",
  neutral: "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300",
};

export function getVariantFromStatus(status: string): StatusVariant {
  const normalized = status.toLowerCase().trim();
  if (normalized.includes("cobrado") || normalized.includes("pagado") || normalized.includes("activo") || normalized.includes("entregado")) {
    return "success";
  }
  if (normalized.includes("pendiente") || normalized.includes("por vencer")) {
    return "warning";
  }
  if (normalized.includes("vencido") || normalized.includes("cancelado") || normalized.includes("rechazado")) {
    return "danger";
  }
  if (normalized.includes("cerrada") || normalized.includes("devuelta") || normalized.includes("proceso")) {
    return "info";
  }
  return "neutral";
}

export function StatusBadge({ status, variant, className }: StatusBadgeProps) {
  const finalVariant = variant || getVariantFromStatus(status);

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium shrink-0",
        variantStyles[finalVariant],
        className
      )}
    >
      {status}
    </span>
  );
}
