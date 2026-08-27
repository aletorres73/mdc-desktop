import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  tone?: "primary" | "success" | "warning" | "danger" | "info";
  className?: string;
}

const toneStyles = {
  primary: "bg-primary/10 text-primary",
  success: "bg-emerald-600/10 text-emerald-600",
  warning: "bg-amber-600/10 text-amber-600",
  danger: "bg-rose-600/10 text-rose-600",
  info: "bg-sky-600/10 text-sky-600",
};

export function KpiCard({
  label,
  value,
  icon: Icon,
  description,
  tone = "primary",
  className,
}: KpiCardProps) {
  return (
    <Card className={cn("border-border/50 shadow-sm bg-card", className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1 min-w-0">
            <p className="text-sm font-medium text-muted-foreground truncate">{label}</p>
            <p className="text-2xl font-bold tracking-tight truncate">{value}</p>
            {description && (
              <p className="text-xs text-muted-foreground truncate">{description}</p>
            )}
          </div>
          <div className={cn("p-2.5 rounded-full shrink-0", toneStyles[tone])}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
