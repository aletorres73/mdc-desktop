import { Sparkles, ArrowDownToLine, Loader2, X, CheckCircle2 } from "lucide-react";
import { Button } from "@/presentation/components/ui/button";
import type { useAppUpdater } from "@/presentation/hooks/useAppUpdater";

type Props = {
  updater: ReturnType<typeof useAppUpdater>;
};

export function UpdateNotification({ updater }: Props) {
  const { status, updateInfo, progress, isDismissed, startInstall, dismiss } = updater;

  if (isDismissed || !updateInfo || status === "idle" || status === "checking") {
    return null;
  }

  return (
    <aside
      aria-label="Aviso de actualización disponible"
      className="fixed bottom-5 right-5 z-50 w-80 animate-in fade-in slide-in-from-bottom-3 duration-300 rounded-xl border border-border/80 bg-card/95 p-4 shadow-xl backdrop-blur-md"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            {status === "ready" ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            ) : status === "downloading" ? (
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
          </div>
          <div>
            <h4 className="text-xs font-semibold tracking-tight text-foreground">
              {status === "downloading"
                ? "Actualizando MDCapp..."
                : status === "ready"
                  ? "Reiniciando..."
                  : `Versión ${updateInfo.version} disponible`}
            </h4>
            <p className="text-[11px] text-muted-foreground">
              {status === "downloading"
                ? `${progress}% descargado`
                : status === "ready"
                  ? "Instalación completada"
                  : "Mejoras y correcciones listas para instalar"}
            </p>
          </div>
        </div>

        {status === "available" && (
          <button
            onClick={dismiss}
            className="rounded-md p-1 text-muted-foreground/60 transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Cerrar notificación"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {status === "downloading" && (
        <div className="mt-3">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-primary transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {status === "available" && (
        <div className="mt-3 flex items-center justify-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={dismiss}
            className="h-7 px-2.5 text-xs text-muted-foreground hover:text-foreground"
          >
            Más tarde
          </Button>
          <Button
            size="sm"
            onClick={startInstall}
            className="h-7 gap-1.5 px-3 text-xs shadow-sm font-medium"
          >
            <ArrowDownToLine className="h-3.5 w-3.5" />
            Actualizar ahora
          </Button>
        </div>
      )}
    </aside>
  );
}
