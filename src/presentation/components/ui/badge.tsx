import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
  {
    variants: {
      variant: {
        default: "bg-primary/10 text-primary",
        success: "bg-emerald-100 text-emerald-700",
        warning: "bg-amber-100 text-amber-700",
        destructive: "bg-red-100 text-red-700",
        muted: "bg-muted text-muted-foreground",
        info: "bg-sky-100 text-sky-700",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant, className }))} {...props} />;
}

/** Mapea un estado de negocio (factura, movimiento) a variante semántica del badge. */
export function stateToBadgeVariant(state: string): BadgeProps["variant"] {
  const normalized = state.toLowerCase();
  if (normalized.includes("cobrado") || normalized.includes("imputado")) return "success";
  if (normalized.includes("vencido")) return "destructive";
  if (normalized.includes("por vencer")) return "warning";
  if (normalized.includes("pendiente")) return "info";
  return "muted";
}
