import { useMemo } from "react";
import { useAuth } from "@/presentation/contexts/AuthContext";
import { useCommissionSummary } from "@/presentation/hooks/useCommissions";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/presentation/components/ui/table";
import { KpiCard } from "@/presentation/components/shared/KpiCard";
import { LoadingState } from "@/presentation/components/shared/LoadingState";
import { EmptyState } from "@/presentation/components/shared/EmptyState";
import { formatMoney } from "@/lib/utils";
import { Percent } from "lucide-react";

export default function Commissions() {
  const { appUser } = useAuth();
  const { data: summary, isLoading } = useCommissionSummary(appUser?.uid);

  const totalCommission = useMemo(() => (summary ?? []).reduce((sum, s) => sum + s.commission, 0), [summary]);

  if (isLoading) return <LoadingState className="min-h-[60vh]" />;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Comisiones</h1>
        <p className="text-sm text-muted-foreground">Cálculo de comisiones por factura y fábrica.</p>
      </div>

      <KpiCard label="Comisión total" value={formatMoney(totalCommission)} icon={Percent} tone="emerald" className="max-w-xs" />

      {!summary?.length ? (
        <EmptyState icon={Percent} title="Sin datos" description="No hay facturación para calcular comisiones." />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Factura</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Fábrica / segmento</TableHead>
              <TableHead>Pago</TableHead>
              <TableHead>Estado fábrica</TableHead>
              <TableHead>Comisión</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {summary.map((row) => (
              <TableRow key={row.paymentId}>
                <TableCell>{row.billingNumber}</TableCell>
                <TableCell className="max-w-[180px] truncate">{row.clientName}</TableCell>
                <TableCell>{row.brand}{row.segment ? ` / ${row.segment}` : ""}</TableCell>
                <TableCell className="tabular-nums">{formatMoney(row.paymentAmount)}</TableCell>
                <TableCell>
                  <span className={row.paymentStatus === "PENDIENTE" ? "text-amber-600" : "text-emerald-600"}>
                    {row.paymentStatus === "PENDIENTE" ? "Pendiente de imputación" : "Imputado"}
                  </span>
                </TableCell>
                <TableCell className="tabular-nums font-medium text-emerald-600">{formatMoney(row.commission)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
