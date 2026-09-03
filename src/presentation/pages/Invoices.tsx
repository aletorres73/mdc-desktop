"use client";

import { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { useInvoices, INVOICE_STATES } from "../hooks/useInvoices";
import type { InvoiceFilters } from "@/domain/entities/invoice";
import { PageShell, PageHeader, DataTableShell, DataTableRow, DataTableCell, DataState, StatusBadge } from "../components/shared";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/presentation/components/ui/select";
import { Input } from "@/presentation/components/ui/input";
import { Button } from "@/presentation/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/presentation/components/ui/card";
import { Search, Filter, ChevronDown, FileText } from "lucide-react";
import { invoiceDetailRoute } from "../routes/routes";
import { toFormattedDate, toPrint } from "@/domain/entities/formatters";

export default function Invoices() {
  const [filters, setFilters] = useState<InvoiceFilters>({
    state: "Todas",
    client: "",
    number: "",
  });

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, error } = useInvoices(filters);

  const invoices = data?.pages.flatMap((page) => page.items) ?? [];

  const handleFilterChange = useCallback(
    (key: keyof InvoiceFilters, value: string | null) => {
      setFilters((prev) => ({ ...prev, [key]: value ?? "" }));
    },
    []
  );

  return (
    <PageShell>
      <PageHeader
        title="Facturas"
        description="Gestión de facturación, cobranzas y vencimientos"
        icon={FileText}
      />

      <Card className="border-border/50 shadow-sm bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Filtros de búsqueda</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-[180px]">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Estado</label>
              <Select value={filters.state} onValueChange={(v) => handleFilterChange("state", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  {INVOICE_STATES.map((state) => (
                    <SelectItem key={state} value={state}>
                      {state}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 min-w-[200px]">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Cliente</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por razón social..."
                  value={filters.client}
                  onChange={(e) => handleFilterChange("client", e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="flex-1 min-w-[180px]">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Número</label>
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por número..."
                  value={filters.number}
                  onChange={(e) => handleFilterChange("number", e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Button
              variant="outline"
              onClick={() => setFilters({ state: "Todas", client: "", number: "" })}
              className="h-10"
            >
              Limpiar
            </Button>
          </div>
        </CardContent>
      </Card>

      <DataState
        isLoading={isLoading}
        error={error}
        isEmpty={invoices.length === 0}
        emptyTitle="No se encontraron facturas"
        emptyDescription="Prueba ajustando los filtros de búsqueda."
      >
        <DataTableShell headers={["Número", "Cliente", "Fecha", "Vencimiento", "Total", "Saldo", "Estado"]}>
          {invoices.map((invoice) => (
            <DataTableRow key={invoice.billingNumber}>
              <DataTableCell className="font-mono text-sm font-medium">
                <Link className="text-primary hover:underline" to={invoiceDetailRoute(invoice.billingNumber)}>
                  {invoice.billingNumber}
                </Link>
              </DataTableCell>
              <DataTableCell className="max-w-xs truncate">{invoice.clientName}</DataTableCell>
              <DataTableCell>{toFormattedDate(invoice.loadDate)}</DataTableCell>
              <DataTableCell>{toFormattedDate(invoice.payDate)}</DataTableCell>
              <DataTableCell className="text-right font-medium">{toPrint(invoice.total)}</DataTableCell>
              <DataTableCell className="text-right text-muted-foreground font-medium">{toPrint(invoice.rest)}</DataTableCell>
              <DataTableCell className="text-center">
                <StatusBadge status={invoice.stateBilling || "Pendiente"} />
              </DataTableCell>
            </DataTableRow>
          ))}
        </DataTableShell>

        {hasNextPage && (
          <div className="mt-4 flex justify-center">
            <Button
              variant="outline"
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
              className="w-full max-w-xs"
            >
              {isFetchingNextPage ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  Cargando más...
                </>
              ) : (
                <>
                  <ChevronDown className="mr-2 h-4 w-4" />
                  Cargar más facturas
                </>
              )}
            </Button>
          </div>
        )}
      </DataState>
    </PageShell>
  );
}
