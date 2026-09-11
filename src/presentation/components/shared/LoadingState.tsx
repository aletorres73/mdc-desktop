import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function LoadingState({ className }: { className?: string }) {
  return (
    <div role="status" aria-live="polite" className={cn("flex items-center justify-center py-16 text-muted-foreground", className)}>
      <Loader2 className="h-6 w-6 animate-spin" />
      <span className="sr-only">Cargando…</span>
    </div>
  );
}
