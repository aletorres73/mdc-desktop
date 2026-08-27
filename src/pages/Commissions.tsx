import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useFactories } from "@/hooks";
import { AlertCircle, CreditCard } from "lucide-react";

export default function Commissions() {
  const { data: factories, isLoading, error } = useFactories();

  return (
    <div className="min-h-svh w-full min-w-0 bg-muted/30 p-4 sm:p-6">
      <div className="mx-auto w-full max-w-7xl space-y-6">
          <header className="flex items-center gap-3">
            <CreditCard className="h-7 w-7 text-primary" />
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Comisiones</h1>
              <p className="text-muted-foreground">Configuración vigente por fábrica y segmento</p>
            </div>
          </header>

          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2">
              {[1, 2].map((item) => <Skeleton key={item} className="h-48 w-full" />)}
            </div>
          ) : error ? (
            <Card><CardContent className="flex items-center gap-3 p-6 text-destructive"><AlertCircle className="h-5 w-5" />Error al cargar comisiones: {error.message}</CardContent></Card>
          ) : !factories?.length ? (
            <Card><CardContent className="p-6 text-center text-muted-foreground">No hay fábricas configuradas</CardContent></Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {factories.map((factory) => (
                <Card key={factory.name}>
                  <CardHeader>
                    <CardTitle>{factory.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">Base: {factory.defaultCommission}%</p>
                  </CardHeader>
                  <CardContent>
                    {Object.keys(factory.segmentCommissions).length === 0 ? (
                      <p className="text-sm text-muted-foreground">Sin comisiones por segmento</p>
                    ) : (
                      <div className="space-y-2">
                        {Object.entries(factory.segmentCommissions).map(([segment, commission]) => (
                          <div key={segment} className="flex justify-between border-b pb-2 last:border-0">
                            <span>{segment}</span>
                            <span className="font-medium">{commission}%</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
    </div>
  );
}
