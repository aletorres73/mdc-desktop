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
  const [appliedDateFilters, setAppliedDateFilters] = useState<CommissionFilters | null>(null);

  const { data: summary, isFetching } = useCommissionSummary(appUser?.uid, appliedDateFilters);

  const segmentOptions = useMemo(() => {
    if (brand) return factories?.find((factory) => factory.name === brand)?.branchList ?? [];
    return Array.from(new Set((summary ?? []).map((row) => row.segment).filter(Boolean)));
  }, [brand, factories, summary]);

  const filteredSummary = useMemo(() => (summary ?? []).filter((row) => (
    (!brand || row.brand === brand) &&
    (!segment || row.segment === segment) &&
    (!documentType || row.documentType === documentType)
  )), [brand, documentType, segment, summary]);

  const clearFilters = () => {
    setStartDate("");
    setEndDate("");
    setBrand("");
    setSegment("");
    setDocumentType("");
    setAppliedDateFilters(null);
  };

  const hasCompleteDateRange = Boolean(startDate && endDate);
  const applyFilters = () => {
    if (!hasCompleteDateRange) return;
    setAppliedDateFilters({
      startDate: startDate ? new Date(`${startDate}T00:00:00`).getTime() : undefined,
      endDate: endDate ? new Date(`${endDate}T23:59:59.999`).getTime() : undefined,
    });
  };

  const totalCommission = useMemo(() => filteredSummary.reduce((sum, row) => sum + row.commission, 0), [filteredSummary]);

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
          <select value={brand} disabled={!appliedDateFilters} onChange={(event) => { setBrand(event.target.value); setSegment(""); }} className="h-9 rounded-md border border-input bg-background px-3 text-sm font-normal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
            <option value="">Todas</option>
            {(factories ?? []).map((factory) => <option key={factory.name} value={factory.name}>{factory.name}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Segmento
          <select value={segment} disabled={!appliedDateFilters} onChange={(event) => setSegment(event.target.value)} className="h-9 rounded-md border border-input bg-background px-3 text-sm font-normal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
            <option value="">Todos</option>
            {segmentOptions.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Tipo
          <select value={documentType} disabled={!appliedDateFilters} onChange={(event) => setDocumentType(event.target.value)} className="h-9 rounded-md border border-input bg-background px-3 text-sm font-normal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
            <option value="">Todo</option>
            <option value="Factura">Factura</option>
            <option value="Remito">Remito</option>
          </select>
        </label>
        <div className="flex items-end gap-2 lg:col-span-5">
          <button type="button" onClick={applyFilters} disabled={!hasCompleteDateRange} className="h-9 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
            Consultar rango
          </button>
          <button type="button" onClick={clearFilters} className="inline-flex h-9 items-center gap-1 rounded-md border border-border/70 px-3 text-sm text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
            <X className="h-4 w-4" /> Limpiar filtros
          </button>
        </div>
      </div>

      {isFetching ? (
        <LoadingState className="min-h-48 rounded-lg border border-border/50 bg-card" />
      ) : (
        <>
          <KpiCard label="Comisión total" value={formatMoney(totalCommission)} icon={Percent} tone="emerald" className="max-w-xs" />

          {appliedDateFilters === null ? (
        <EmptyState icon={Percent} title="Consultá un rango de fechas" description="Seleccioná Desde y Hasta para cargar las comisiones." />
          ) : !filteredSummary.length ? (
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
            {filteredSummary.map((row) => (
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
        </>
      )}
    </div>
  );
}
