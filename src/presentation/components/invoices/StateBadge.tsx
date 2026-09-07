import { Badge } from "@/presentation/components/ui/badge";

interface StateBadgeProps {
  state: string;
}

function variantByState(state: string) {
  const normalized = state.trim().toLowerCase();
  if (normalized === "cobrado") return "success" as const;
  if (normalized === "vencido") return "destructive" as const;
  if (normalized === "por vencer") return "warning" as const;
  if (normalized === "pendiente") return "warning" as const;
  return "muted" as const;
}

export function StateBadge({ state }: StateBadgeProps) {
  return <Badge variant={variantByState(state)}>{state || "Sin estado"}</Badge>;
}
