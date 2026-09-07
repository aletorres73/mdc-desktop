import * as React from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/presentation/components/ui/card";

interface KpiCardProps {
  label: string;
  value: string;
  icon: React.ElementType;
  tone?: "emerald" | "amber" | "red" | "sky" | "zinc";
  className?: string;
}

const toneClasses: Record<NonNullable<KpiCardProps["tone"]>, string> = {
  emerald: "bg-emerald-600/10 text-emerald-600",
  amber: "bg-amber-600/10 text-amber-600",
  red: "bg-red-600/10 text-red-600",
  sky: "bg-sky-600/10 text-sky-600",
  zinc: "bg-zinc-600/10 text-zinc-600",
};

export function KpiCard({ label, value, icon: Icon, tone = "zinc", className }: KpiCardProps) {
  return (
    <Card className={cn("border-border/50 shadow-sm", className)}>
      <CardContent className="flex items-center gap-4 p-5">
        <div className={cn("rounded-full p-2.5", toneClasses[tone])}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-muted-foreground truncate">{label}</p>
          <p className="text-2xl font-bold tracking-tight truncate">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
