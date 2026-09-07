import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/presentation/contexts/AuthContext";
import { useFactories, useCreateFactory } from "@/presentation/hooks/useFactories";
import { Button } from "@/presentation/components/ui/button";
import { Input } from "@/presentation/components/ui/input";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/presentation/components/ui/dialog";
import { LoadingState } from "@/presentation/components/shared/LoadingState";
import { EmptyState } from "@/presentation/components/shared/EmptyState";
import { factoryDetailPath } from "@/presentation/routes/routes";
import { Factory, Plus } from "lucide-react";

export default function Factories() {
  const location = useLocation();
  const { appUser } = useAuth();
  const { data: factories, isLoading } = useFactories(appUser?.uid);
  const createFactory = useCreateFactory(appUser?.uid);

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");

  const handleCreate = async () => {
    if (!name.trim()) return;
    await createFactory.mutateAsync({
      name: name.trim(),
      branchList: [],
      paymentType: [],
      defaultCommission: 0,
      segmentCommissions: {},
    });
    setName("");
    setOpen(false);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Fábricas</h1>
          <p className="text-sm text-muted-foreground">Condiciones de pago y comisiones por fábrica.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button><Plus className="h-4 w-4" />Nueva fábrica</Button>} />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nueva fábrica</DialogTitle>
            </DialogHeader>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre de fábrica" />
            <DialogFooter>
              <Button onClick={handleCreate} loading={createFactory.isPending}>
                {createFactory.isPending ? "Guardando..." : "Guardar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <LoadingState />
      ) : !factories?.length ? (
        <EmptyState icon={Factory} title="Sin fábricas" description="Creá la primera fábrica para configurar comisiones." />
      ) : (
        <div className="space-y-3">
          {factories.map((f) => (
            <div key={f.name} className="rounded-lg border border-border/60 bg-card p-4 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <Link
                    to={factoryDetailPath(f.name)}
                    state={{ backToPath: location.pathname + location.search }}
                    className="text-base font-semibold hover:underline"
                  >
                    {f.name}
                  </Link>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Segmentos: {f.branchList.join(", ") || "Sin segmentos"}
                  </p>
                </div>
                <div className="rounded-md border border-border/60 bg-muted/20 px-3 py-2 text-right">
                  <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">Comisión global</p>
                  <p className="tabular-nums font-semibold">{(f.defaultCommission * 100).toFixed(1)}%</p>
                </div>
              </div>

              {Object.keys(f.segmentCommissions || {}).length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {Object.entries(f.segmentCommissions || {}).map(([segment, value]) => (
                    <span key={segment} className="rounded-full border border-border/60 bg-muted/20 px-2.5 py-1 text-xs">
                      {segment}: {(value * 100).toFixed(1)}%
                    </span>
                  ))}
                </div>
              )}

              {f.paymentType.length > 0 && (
                <div className="mt-3 border-t border-border/50 pt-3">
                  <p className="mb-2 text-xs font-medium text-muted-foreground">Condiciones de pago</p>
                  <div className="flex flex-wrap gap-2">
                    {f.paymentType.map((condition) => (
                      <span
                        key={condition.paymentName}
                        className="rounded-full border border-border/60 bg-muted/20 px-2.5 py-1 text-xs"
                      >
                        {condition.paymentName || "Sin nombre"}
                        {condition.expiration > 0 && ` · ${condition.expiration} días`}
                        {condition.discount > 0 && ` · ${condition.discount}% dto.`}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
