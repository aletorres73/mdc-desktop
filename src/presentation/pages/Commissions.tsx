import { useCommissions } from "../hooks/useCommissions";
import { PageShell, PageHeader, KpiCard, DataTableShell, DataTableRow, DataTableCell, DataState } from "../components/shared";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard, DollarSign, Factory, TrendingUp } from "lucide-react";
import { toPrint } from "@/domain/entities/formatters";

export default function Commissions() {
  const { data: summaries, isLoading, error } = useCommissions();

  const totalEarned = (summaries || []).reduce((sum, s) => sum + s.totalCommissionEarned, 0);
  const totalCollected = (summaries || []).reduce((sum, s) => sum + s.totalCollected, 0);

  return (
    <PageShell>
      <PageHeader
        title="Comisiones"
        description="Cálculo de comisiones ganadas por fábrica y segmento comercial"
        icon={CreditCard}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard
          label="Total Comisiones Ganadas"
          value={toPrint(totalEarned)}
          icon={DollarSign}
          tone="success"
        />
        <KpiCard
          label="Total Cobrado Generado"
          value={toPrint(totalCollected)}
          icon={TrendingUp}
          tone="primary"
        />
        <KpiCard
          label="Fábricas Activas"
          value={summaries?.length ?? 0}
          icon={Factory}
          tone="info"
        />
      </div>

      <DataState
        isLoading={isLoading}
        error={error}
        isEmpty={!summaries || summaries.length === 0}
        emptyTitle="No hay datos de comisiones"
        emptyDescription="Configura fábricas y registra facturas para ver los cálculos."
      >
        <div className="grid gap-6 md:grid-cols-2">
          {(summaries || []).map((summary) => (
            <Card key={summary.factoryName} className="border-border/50 shadow-sm bg-card">
              <CardHeader className="pb-3 border-b border-border/40">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-bold">{summary.factoryName}</CardTitle>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    Base: {summary.defaultCommission}%
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm mt-2 pt-2 text-muted-foreground border-t border-border/30">
                  <span>Cobrado: {toPrint(summary.totalCollected)}</span>
                  <span className="font-semibold text-primary">Comisión: {toPrint(summary.totalCommissionEarned)}</span>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-3">
                  Desglose por Segmento
                </p>
                {Object.keys(summary.segmentBreakdown).length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-3">Sin desglose por segmento</p>
                ) : (
                  <DataTableShell headers={["Segmento", "Tasa", "Cobrado", "Comisión"]}>
                    {Object.entries(summary.segmentBreakdown).map(([segment, data]) => (
                      <DataTableRow key={segment}>
                        <DataTableCell className="font-medium">{segment}</DataTableCell>
                        <DataTableCell>{data.rate}%</DataTableCell>
                        <DataTableCell className="text-right text-muted-foreground">{toPrint(data.collected)}</DataTableCell>
                        <DataTableCell className="text-right font-semibold text-emerald-600">{toPrint(data.commission)}</DataTableCell>
                      </DataTableRow>
                    ))}
                  </DataTableShell>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </DataState>
    </PageShell>
  );
}
