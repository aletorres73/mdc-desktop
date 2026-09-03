import { useAuth } from "../contexts/AuthContext";
import { useHomeStats } from "../hooks/useHomeStats";
import { PageShell, PageHeader, KpiCard, DataState } from "../components/shared";
import { Card, CardContent, CardHeader, CardTitle } from "@/presentation/components/ui/card";
import { Package, TrendingUp, Factory, LayoutDashboard } from "lucide-react";

export default function Home() {
  const { user } = useAuth();
  const { data: stats, isLoading, error } = useHomeStats();

  return (
    <PageShell>
      <PageHeader
        title="Panel de control"
        description={`Bienvenido, ${user?.displayName ?? user?.email}`}
        icon={LayoutDashboard}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <KpiCard
          label="Fábricas"
          value={stats?.totalFactories ?? 0}
          icon={Factory}
          tone="primary"
        />
        <KpiCard
          label="Marcas totales"
          value={stats?.totalBrands ?? 0}
          icon={Package}
          tone="info"
        />
        <KpiCard
          label="Comisión base promedio"
          value={stats?.averageCommission ? `${stats.averageCommission}%` : "0%"}
          icon={TrendingUp}
          tone="success"
        />
      </div>

      <Card className="border-border/50 shadow-sm bg-card">
        <CardHeader>
          <CardTitle>Fábricas configuradas</CardTitle>
        </CardHeader>
        <CardContent>
          <DataState
            isLoading={isLoading}
            error={error}
            isEmpty={!stats?.factories || stats.factories.length === 0}
            emptyTitle="No hay fábricas configuradas"
            emptyDescription="Crea una fábrica desde la sección Fábricas para comenzar."
          >
            <div className="space-y-3">
              {(stats?.factories ?? []).map((factory) => (
                <div
                  key={factory.name}
                  className="flex items-center justify-between p-4 border border-border/50 rounded-lg bg-background hover:bg-muted/20 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="font-medium truncate">{factory.name}</p>
                    <p className="text-sm text-muted-foreground truncate">
                      {factory.branchList.length} marcas • {factory.paymentType.length} condiciones de pago
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-primary shrink-0 ml-4">
                    {factory.defaultCommission}%
                  </span>
                </div>
              ))}
            </div>
          </DataState>
        </CardContent>
      </Card>
    </PageShell>
  );
}
