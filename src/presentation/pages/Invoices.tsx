import { useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/presentation/contexts/AuthContext";
import { useInvoicesList } from "@/presentation/hooks/useInvoices";
import { usePaymentRegister } from "@/presentation/hooks/usePaymentRegister";
import { Input } from "@/presentation/components/ui/input";
import { Select } from "@/presentation/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/presentation/components/ui/table";
import { Badge, stateToBadgeVariant } from "@/presentation/components/ui/badge";
import { Button } from "@/presentation/components/ui/button";
import { LoadingState } from "@/presentation/components/shared/LoadingState";
import { ErrorState } from "@/presentation/components/shared/ErrorState";
import { EmptyState } from "@/presentation/components/shared/EmptyState";
import { formatMoney, formatDate } from "@/lib/utils";
import { invoiceDetailPath, ROUTES } from "@/presentation/routes/routes";
import {
  INVOICE_STATE_OPTIONS,
  type InvoiceStateFilter,
} from "@/domain/logic/invoiceList";
import { Loader2, Plus, Receipt, RefreshCcw, Search } from "lucide-react";

const STATE_OPTIONS = INVOICE_STATE_OPTIONS.map((value) => ({ value, label: value }));

function parseStateFilter(value: string | null): InvoiceStateFilter {
  if (value && INVOICE_STATE_OPTIONS.includes(value as InvoiceStateFilter)) {
    return value as InvoiceStateFilter;
  }
  return "Todas";
}

export default function Invoices() {
  const { appUser, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [refreshKey, setRefreshKey] = useState(0);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const clientSearch = searchParams.get("q") ?? "";
  const state = parseStateFilter(searchParams.get("state"));

  const invoices = useInvoicesList(appUser?.uid, {
    state,
    searchText: clientSearch,
    pageSize: 20,
    refreshKey,
  });
  const { data: movements } = usePaymentRegister(appUser?.uid);

  const pendingDocuments = useMemo(() => {
    const docs = new Set<string>();
    for (const movement of movements ?? []) {
      if (movement.status === "PENDIENTE") docs.add(movement.documentNumber.toLowerCase());
    }
    return docs;
  }, [movements]);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return;

    const observer = new IntersectionObserver((entries) => {
      const [entry] = entries;
      if (!entry?.isIntersecting) return;
      if (!invoices.hasNextPage || invoices.isFetchingNextPage) return;
      void invoices.fetchNextPage();
    }, { rootMargin: "220px" });

    observer.observe(node);
    return () => observer.disconnect();
  }, [invoices]);

  const setFilterParams = (nextState: InvoiceStateFilter, nextSearch: string) => {
    const next = new URLSearchParams(searchParams);
    if (nextState === "Todas") next.delete("state");
    else next.set("state", nextState);
    if (nextSearch.trim()) next.set("q", nextSearch);
    else next.delete("q");
    setSearchParams(next, { replace: true });
  };

  const handleRefresh = () => {
    void queryClient.invalidateQueries({ queryKey: ["invoicesList", appUser?.uid] });
    void queryClient.invalidateQueries({ queryKey: ["invoice", appUser?.uid] });
    setRefreshKey((value) => value + 1);
  };

  const handleRetry = () => {
    void invoices.refetch();
  };

  const isInitialLoading = authLoading || invoices.uiState === "loading";
  const isEmpty = invoices.uiState === "empty";
  const isError = invoices.uiState === "error";
  const isUpdating = invoices.uiState === "updating";

  const errorMessage = invoices.error instanceof Error
    ? invoices.error.message
    : "Error al cargar facturas.";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Facturas</h1>
          <p className="text-sm text-muted-foreground">Explorador global de facturación.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleRefresh} loading={isUpdating}>
            {!isUpdating && <RefreshCcw className="h-4 w-4" />}
            Refrescar
          </Button>
          <Link to={ROUTES.CREATE_INVOICE} className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90">
            <Plus className="h-4 w-4" /> Nueva factura
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative w-56">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por cliente o número..."
            className="pl-9"
            value={clientSearch}
            onChange={(e) => {
              setFilterParams(state, e.target.value);
            }}
          />
        </div>
        <Select
          className="w-48"
          options={STATE_OPTIONS}
          value={state}
          onChange={(e) => {
            setFilterParams(e.target.value as InvoiceStateFilter, clientSearch);
          }}
        />
      </div>

      {isInitialLoading ? (
        <LoadingState />
      ) : isError ? (
        <div className="space-y-3">
          <ErrorState message={errorMessage || "Error al cargar"} />
          <Button variant="outline" onClick={handleRetry}>Reintentar</Button>
        </div>
      ) : isEmpty ? (
        <EmptyState icon={Receipt} title="Sin facturas" description="No hay facturas para los filtros aplicados." />
      ) : (
        <>
          {isUpdating && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Actualizando listado...
            </div>
          )}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Marca</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Saldo</TableHead>
                <TableHead>Vencimiento</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Pagos</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.items.map((invoice) => (
                <TableRow
                  key={invoice.id}
                  className="cursor-pointer"
                  onClick={() => navigate(invoiceDetailPath(invoice.id!), { state: { backToSearch: location.search } })}
                >
                  <TableCell>
                    <Link
                      to={invoiceDetailPath(invoice.id!)}
                      state={{ backToSearch: location.search }}
                      className="font-medium hover:underline"
                      onClick={(event) => event.stopPropagation()}
                    >
                      {invoice.billingNumber}
                    </Link>
                  </TableCell>
                  <TableCell className="max-w-[180px] truncate">{invoice.clientName}</TableCell>
                  <TableCell>{invoice.brand}</TableCell>
                  <TableCell className="tabular-nums">{formatMoney(invoice.total)}</TableCell>
                  <TableCell className="tabular-nums">{formatMoney(invoice.rest)}</TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(invoice.payDate)}</TableCell>
                  <TableCell>
                    <Badge variant={stateToBadgeVariant(invoice.stateBilling)}>{invoice.stateBilling}</Badge>
                  </TableCell>
                  <TableCell>
                    {pendingDocuments.has(invoice.billingNumber.toLowerCase()) ? (
                      <Badge variant="warning">Pendiente</Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">-</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div ref={sentinelRef} className="h-2" />
          <div className="flex justify-end">
            <Button variant="outline" disabled={!invoices.hasNextPage || invoices.isFetchingNextPage} onClick={() => void invoices.fetchNextPage()}>
              {invoices.isFetchingNextPage ? "Cargando..." : invoices.hasNextPage ? "Cargar más" : "Fin del listado"}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
