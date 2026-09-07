import { useMemo, useState } from "react";
import { useAuth } from "@/presentation/contexts/AuthContext";
import { useCommissionSummary } from "@/presentation/hooks/useCommissions";
import type { CommissionFilters } from "@/domain/usecases/CommissionUseCase";
import { useFactories } from "@/presentation/hooks/useFactories";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/presentation/components/ui/table";
import { KpiCard } from "@/presentation/components/shared/KpiCard";
import { LoadingState } from "@/presentation/components/shared/LoadingState";
import { EmptyState } from "@/presentation/components/shared/EmptyState";
import { DateInput } from "@/presentation/components/shared/DateInput";
import { formatDate, formatMoney } from "@/lib/utils";
import { Percent, X } from "lucide-react";

export default function Commissions() {
  const { appUser } = useAuth();
  const { data: factories } = useFactories(appUser?.uid);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [brand, setBrand] = useState("");
  const [segment, setSegment] = useState("");
  const [documentType, setDocumentType] = useState("");
  const [appliedFilters, setAppliedFilters] = useState<CommissionFilters>({});

  const { data: summary, isLoading } = useCommissionSummary(appUser?.uid, appliedFilters);

  const segmentOptions = useMemo(() => {
    if (brand) return factories?.find((factory) => factory.name === brand)?.branchList ?? [];
    return Array.from(new Set((summary ?? []).map((row) => row.segment).filter(Boolean)));
  }, [brand, factories, summary]);

  const clearFilters = () => {
    setStartDate("");
    setEndDate("");
    setBrand("");
    setSegment("");
    setDocumentType("");
    setAppliedFilters({});
  };

  const dateRangeIncomplete = Boolean((startDate && !endDate) || (!startDate && endDate));
  const applyFilters = () => {
    if (dateRangeIncomplete) return;
    setAppliedFilters({
      startDate: startDate ? new Date(`${startDate}T00:00:00`).getTime() : undefined,
      endDate: endDate ? new Date(`${endDate}T23:59:59.999`).getTime() : undefined,
      brand: brand || undefined,
      segment: segment || undefined,
      documentType: documentType || undefined,
    });
  };

  const totalCommission = useMemo(() => (summary ?? []).reduce((sum, s) => sum + s.commission, 0), [summary]);

  if (isLoading) return <LoadingState className="min-h-[60vh]" />;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Comisiones</h1>
          <p className="text-sm text-muted-foreground">Pagos reales por factura/remito y estado de imputación.</p>
      </div>

      <div className="grid gap-3 rounded-lg border border-border/50 bg-card p-4 shadow-sm md:grid-cols-2 lg:grid-cols-5">
        <label className="flex flex-col gap-1 text-sm font-medium">
          Desde
          <DateInput value={startDate} max={endDate || undefined} onChange={setStartDate} />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Hasta
          <DateInput value={endDate} min={startDate || undefined} onChange={setEndDate} />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Fábrica
          <select value={brand} onChange={(event) => { setBrand(event.target.value); setSegment(""); }} className="h-9 rounded-md border border-input bg-background px-3 text-sm font-normal">
            <option value="">Todas</option>
            {(factories ?? []).map((factory) => <option key={factory.name} value={factory.name}>{factory.name}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Segmento
          <select value={segment} onChange={(event) => setSegment(event.target.value)} className="h-9 rounded-md border border-input bg-background px-3 text-sm font-normal">
            <option value="">Todos</option>
            {segmentOptions.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Tipo
          <select value={documentType} onChange={(event) => setDocumentType(event.target.value)} className="h-9 rounded-md border border-input bg-background px-3 text-sm font-normal">
            <option value="">Todo</option>
            <option value="Factura">Factura</option>
            <option value="Remito">Remito</option>
          </select>
        </label>
        <div className="flex items-end gap-2 lg:col-span-5">
          <button type="button" onClick={applyFilters} disabled={dateRangeIncomplete} className="h-9 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50">
            Aplicar filtros
          </button>
          <button type="button" onClick={clearFilters} className="inline-flex h-9 items-center gap-1 rounded-md border border-border/70 px-3 text-sm text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" /> Limpiar filtros
          </button>
        </div>
      </div>

      <KpiCard label="Comisión total" value={formatMoney(totalCommission)} icon={Percent} tone="emerald" className="max-w-xs" />

      {!summary?.length ? (
        <EmptyState icon={Percent} title="Sin datos" description="No hay facturación para calcular comisiones." />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Factura</TableHead>
              <TableHead>Fecha pago</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Fábrica / segmento</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Pago</TableHead>
              <TableHead>Estado fábrica</TableHead>
              <TableHead>Comisión</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {summary.map((row) => (
              <TableRow key={row.paymentId}>
                <TableCell>{row.billingNumber}</TableCell>
                <TableCell className="text-muted-foreground">{formatDate(row.paymentDate)}</TableCell>
                <TableCell className="max-w-[180px] truncate">{row.clientName}</TableCell>
                <TableCell>{row.brand}{row.segment ? ` / ${row.segment}` : ""}</TableCell>
                <TableCell>{row.documentType}</TableCell>
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
