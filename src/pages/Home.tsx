import { useAuth } from "@/contexts/AuthContext";
import { useFactories } from "@/hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Package, TrendingUp, Factory } from "lucide-react";

/**
 * Home screen — mirrors Kotlin MainScreen / HomeViewModel
 * Loads factories and shows dashboard
 */
export default function Home() {
  const { user } = useAuth();
  const { data: factories, isLoading, error } = useFactories();

  const stats = [
    { label: "Fábricas", value: factories?.length ?? 0, icon: Factory },
    { label: "Marcas totales", value: factories?.reduce((sum, f) => sum + f.branchList.length, 0) ?? 0, icon: Package },
    { label: "Comisión base promedio", value: factories?.length
      ? (factories.reduce((sum, f) => sum + f.defaultCommission, 0) / factories.length).toFixed(1) + "%"
      : "0%", icon: TrendingUp },
  ];

  return (
    <div className="min-h-svh w-full min-w-0 bg-muted/30 p-4 sm:p-6">
        <div className="mx-auto w-full max-w-7xl space-y-6">
          {/* Header */}
          <header className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Panel de control</h1>
              <p className="text-muted-foreground">
                Bienvenido, {user?.displayName ?? user?.email}
              </p>
            </div>
          </header>

          {/* Stats Grid */}
          <div className="grid gap-4 md:grid-cols-3">
            {stats.map((stat) => (
              <Card key={stat.label}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
                  <div className="rounded-full bg-emerald-600/10 p-2 text-emerald-600"><stat.icon className="h-4 w-4" /></div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Factories List */}
          <Card>
            <CardHeader>
              <CardTitle>Fábricas configuradas</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : error ? (
                <div className="text-center py-8 text-destructive">
                  Error al cargar fábricas
                </div>
              ) : factories && factories.length > 0 ? (
                <div className="space-y-4">
                  {factories.map((factory) => (
                    <div
                      key={factory.name}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
                    >
                      <div>
                        <p className="font-medium">{factory.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {factory.branchList.length} marcas • {factory.paymentType.length} condiciones
                        </p>
                      </div>
                      <span className="text-sm font-medium text-primary">
                        {factory.defaultCommission}%
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No hay fábricas configuradas
                </div>
              )}
            </CardContent>
          </Card>
        </div>
    </div>
  );
}
