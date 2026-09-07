import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/presentation/contexts/AuthContext";
import { useInvoicesPage } from "@/presentation/hooks/useInvoices";
import { KpiCard } from "@/presentation/components/shared/KpiCard";
import { LoadingState } from "@/presentation/components/shared/LoadingState";
import { Card, CardContent, CardHeader, CardTitle } from "@/presentation/components/ui/card";
import { Badge } from "@/presentation/components/ui/badge";
import { stateToBadgeVariant } from "@/presentation/components/ui/badge";
import { formatMoney, formatDate } from "@/lib/utils";
import { invoiceDetailPath, ROUTES } from "@/presentation/routes/routes";
import { Wallet, AlertTriangle, Clock, Users, ArrowRight } from "lucide-react";

export default function Home() {
  const { appUser, userProfile } = useAuth();
  const { data: page, isLoading } = useInvoicesPage(appUser?.uid, {}, 100);

  const summary = useMemo(() => {
    const items = page?.items ?? [];
    const totalDebt = items.reduce((sum, i) => sum + i.rest, 0);
    const overdue = items.filter((i) => i.stateBilling === "Vencido");
    const dueSoon = items.filter((i) => i.stateBilling === "Por vencer");
    return { totalDebt, overdue, dueSoon };
  }, [page]);

  if (isLoading) return <LoadingState className="min-h-[60vh]" />;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Hola, {userProfile?.name || "bienvenido"}</h1>
        <p className="text-sm text-muted-foreground">Resumen general de la cartera.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard label="Deuda total" value={formatMoney(summary.totalDebt)} icon={Wallet} tone="sky" />
        <KpiCard label="Facturas vencidas" value={String(summary.overdue.length)} icon={AlertTriangle} tone="red" />
        <KpiCard label="Por vencer" value={String(summary.dueSoon.length)} icon={Clock} tone="amber" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Vencidas urgentes</CardTitle>
            <Link to={ROUTES.AGENDA} className="text-xs text-muted-foreground hover:text-foreground hover:underline">
              Ver agenda
            </Link>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {summary.overdue.slice(0, 5).map((invoice) => (
              <Link
                key={invoice.id}
                to={invoiceDetailPath(invoice.id!)}
                className="flex items-center justify-between rounded-md px-2 py-2 text-sm hover:bg-muted/40"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{invoice.clientName}</p>
                  <p className="text-xs text-muted-foreground">
                    #{invoice.billingNumber} · {formatDate(invoice.payDate)}
                  </p>
                </div>
                <Badge variant={stateToBadgeVariant(invoice.stateBilling)}>{formatMoney(invoice.rest)}</Badge>
              </Link>
            ))}
            {!summary.overdue.length && <p className="py-4 text-center text-sm text-muted-foreground">Sin facturas vencidas.</p>}
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Accesos rápidos</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            {[
              { to: ROUTES.CLIENTS, label: "Clientes", icon: Users },
              { to: ROUTES.INVOICES, label: "Facturas", icon: Wallet },
            ].map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className="flex items-center justify-between rounded-md border border-border/50 bg-card px-3 py-3 text-sm font-medium shadow-sm transition-colors hover:bg-muted/30"
              >
                <span className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  {label}
                </span>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
