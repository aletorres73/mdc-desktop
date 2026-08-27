"use client";

import { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { useInvoices, INVOICE_STATES } from "@/hooks";
import type { InvoiceFilters } from "@/types/domain";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Filter, ChevronDown, Download } from "lucide-react";
import { invoiceDetailRoute } from "@/types/routes";

/**
 * Invoices page — mirrors Kotlin InvoicesPagedScreen / InvoicesPagedViewModel
 * Features: pagination, state filter, client/number search, infinite scroll
 */
export default function Invoices() {
  const [filters, setFilters] = useState<InvoiceFilters>({
    state: "Todas",
    client: "",
    number: "",
  });

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, error } = useInvoices(filters);

  // Flatten all pages into single array
  const invoices = data?.pages.flatMap((page) => page.items) ?? [];

  // Handle filter changes - reset pagination
  const handleFilterChange = useCallback(
    (key: keyof InvoiceFilters, value: string | null) => {
      setFilters((prev) => ({ ...prev, [key]: value ?? "" }));
    },
    []
  );

  // Status badge color mapping
  const getStatusBadge = (state: string) => {
    const variants: Record<string, string> = {
      Pendiente: "bg-amber-100 text-amber-700",
      "Por vencer": "bg-yellow-100 text-yellow-700",
      Vencido: "bg-red-100 text-red-700",
      Cobrado: "bg-emerald-100 text-emerald-700",
      Cerrada: "bg-slate-100 text-slate-700",
      Devuelta: "bg-red-100 text-red-700",
      Cancelado: "bg-red-100 text-red-700",
    };
    return variants[state] || "bg-slate-100 text-slate-700";
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 2,
    }).format(value);
  };

  const formatDate = (timestamp: number) => {
    if (!timestamp || timestamp === 0) return "---";
    return new Date(timestamp).toLocaleDateString("es-AR");
  };

  return (
    <div className="min-h-svh w-full min-w-0 bg-muted/30 p-4 sm:p-6">
      <div className="mx-auto w-full max-w-7xl space-y-6">
          {/* Header */}
          <header className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Facturas</h1>
              <p className="text-muted-foreground">
                Gestión de facturación y cobranzas
              </p>
            </div>
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Exportar
            </Button>
          </header>

          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Filtros</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-end gap-4">
                {/* State Filter */}
                <div className="flex-1 min-w-[180px]">
                  <label className="text-sm font-medium mb-1 block">Estado</label>
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

                {/* Client Search */}
                <div className="flex-1 min-w-[200px]">
                  <label className="text-sm font-medium mb-1 block">Cliente</label>
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

                {/* Number Search */}
                <div className="flex-1 min-w-[180px]">
                  <label className="text-sm font-medium mb-1 block">Número</label>
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

                {/* Clear Filters */}
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

          {/* Invoices Table */}
          <Card>
            <CardHeader>
              <CardTitle>
                Listado de facturas ({invoices.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Número</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Vencimiento</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Saldo</TableHead>
                      <TableHead>Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[...Array(5)].map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : error ? (
                <div className="text-center py-8 text-destructive">
                  Error al cargar facturas: {error.message}
                </div>
              ) : invoices.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No se encontraron facturas
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Número</TableHead>
                          <TableHead>Cliente</TableHead>
                          <TableHead>Fecha</TableHead>
                          <TableHead>Vencimiento</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                          <TableHead className="text-right">Saldo</TableHead>
                          <TableHead>Estado</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {invoices.map((invoice) => (
                          <TableRow key={invoice.billingNumber} className="hover:bg-accent/50">
                            <TableCell className="font-mono text-sm">
                              <Link className="hover:underline" to={invoiceDetailRoute(invoice.billingNumber)}>
                                {invoice.billingNumber}
                              </Link>
                            </TableCell>
                            <TableCell className="max-w-xs truncate">{invoice.clientName}</TableCell>
                            <TableCell>{formatDate(invoice.loadDate)}</TableCell>
                            <TableCell>{formatDate(invoice.payDate)}</TableCell>
                            <TableCell className="text-right font-medium">{formatCurrency(invoice.total)}</TableCell>
                            <TableCell className="text-right text-muted-foreground">{formatCurrency(invoice.rest)}</TableCell>
                            <TableCell>
                              <Badge className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusBadge(invoice.stateBilling)}`}>
                                {invoice.stateBilling}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Load More / Pagination */}
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
                            <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
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
                </>
              )}
            </CardContent>
          </Card>
        </div>
    </div>
  );
}