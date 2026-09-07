import { useMemo, useState } from "react";
import { useAuth } from "@/presentation/contexts/AuthContext";
import { usePaymentRegister, useReconcileMovement, useDeleteMovement } from "@/presentation/hooks/usePaymentRegister";
import { useAllInvoices } from "@/presentation/hooks/useInvoices";
import { Input } from "@/presentation/components/ui/input";
import { Select } from "@/presentation/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/presentation/components/ui/table";
import { Badge } from "@/presentation/components/ui/badge";
import { Button } from "@/presentation/components/ui/button";
import { LoadingState } from "@/presentation/components/shared/LoadingState";
import { EmptyState } from "@/presentation/components/shared/EmptyState";
import { ErrorState } from "@/presentation/components/shared/ErrorState";
import { formatMoney, formatDate } from "@/lib/utils";
import { MOVEMENT_METHOD_LABELS, MOVEMENT_STATUS_LABELS } from "@/domain/entities/paymentRegister";
import {
  EMPTY_MOVEMENT_FILTERS,
  buildSegmentByDocument,
  distinctMovementValues,
  filterMovements,
  type MovementFilters,
} from "@/domain/logic/paymentRegisterList";
import { Wallet, CheckCircle2, Trash2, Search } from "lucide-react";

export default function PaymentRegister() {
  const { appUser } = useAuth();
  const [filters, setFilters] = useState<MovementFilters>(EMPTY_MOVEMENT_FILTERS);

  const movementsQuery = usePaymentRegister(appUser?.uid);
  const { data: movements, isLoading } = movementsQuery;
  const invoicesQuery = useAllInvoices(appUser?.uid);
  const reconcile = useReconcileMovement(appUser?.uid);
  const remove = useDeleteMovement(appUser?.uid);

  // El segmento no se guarda en el movimiento: se resuelve desde la factura asociada.
  const segmentByDocument = useMemo(
    () => buildSegmentByDocument(invoicesQuery.data ?? []),
    [invoicesQuery.data],
  );

  const methodOptions = useMemo(
    () => [
      { value: "", label: "Todos los métodos" },
      ...Object.entries(MOVEMENT_METHOD_LABELS).map(([value, label]) => ({ value, label })),
    ],
    [],
  );

  const statusOptions = useMemo(
    () => [
      { value: "", label: "Todos los estados" },
      ...Object.entries(MOVEMENT_STATUS_LABELS).map(([value, label]) => ({ value, label })),
    ],
    [],
  );

  // En paymentRegister el campo "Marca" guarda la fábrica del documento cobrado.
  const factoryOptions = useMemo(
    () => [
      { value: "", label: "Todas las fábricas" },
      ...distinctMovementValues(movements ?? [], (m) => m.branch).map((value) => ({ value, label: value })),
    ],
    [movements],
  );

  const segmentOptions = useMemo(() => {
    const segments = [...new Set([...segmentByDocument.values()].map((v) => v.trim()).filter(Boolean))].sort((a, b) =>
      a.localeCompare(b),
    );
    return [{ value: "", label: "Todos los segmentos" }, ...segments.map((value) => ({ value, label: value }))];
  }, [segmentByDocument]);

  const filteredMovements = useMemo(
    () => filterMovements(movements ?? [], filters, segmentByDocument),
    [movements, filters, segmentByDocument],
  );

  const hasActiveFilters =
    !!filters.search.trim() || !!filters.method || !!filters.status || !!filters.factory || !!filters.segment;

  const setFilter = (patch: Partial<MovementFilters>) => setFilters((prev) => ({ ...prev, ...patch }));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Registro de pagos</h1>
        <p className="text-sm text-muted-foreground">Movimientos y conciliación de cobranzas.</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Razón social o N° de documento..."
            className="pl-9"
            value={filters.search}
            onChange={(e) => setFilter({ search: e.target.value })}
          />
        </div>
        <Select
          className="w-44"
          options={methodOptions}
          value={filters.method}
          onChange={(e) => setFilter({ method: e.target.value })}
          aria-label="Filtrar por método de pago"
        />
        <Select
          className="w-44"
          options={statusOptions}
          value={filters.status}
          onChange={(e) => setFilter({ status: e.target.value })}
          aria-label="Filtrar por estado"
        />
        <Select
          className="w-44"
          options={factoryOptions}
          value={filters.factory}
          onChange={(e) => setFilter({ factory: e.target.value })}
          aria-label="Filtrar por fábrica"
        />
        <Select
          className="w-44"
          options={segmentOptions}
          value={filters.segment}
          onChange={(e) => setFilter({ segment: e.target.value })}
          aria-label="Filtrar por segmento"
        />
        {hasActiveFilters && (
          <Button variant="ghost" onClick={() => setFilters(EMPTY_MOVEMENT_FILTERS)}>
            Limpiar filtros
          </Button>
        )}
      </div>

      {(reconcile.isError || remove.isError) && (
        <ErrorState message="No se pudo actualizar el movimiento. Intentá nuevamente." />
      )}

      {isLoading ? (
        <LoadingState />
      ) : movementsQuery.isError ? (
        <div className="space-y-3">
          <ErrorState message={movementsQuery.error instanceof Error ? movementsQuery.error.message : "No se pudo cargar el registro de pagos."} />
          <Button variant="outline" onClick={() => void movementsQuery.refetch()}>Reintentar</Button>
        </div>
      ) : !filteredMovements.length ? (
        <EmptyState
          icon={Wallet}
          title="Sin movimientos"
          description={hasActiveFilters ? "Ningún pago coincide con los filtros aplicados." : "No hay pagos registrados."}
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Fábrica</TableHead>
              <TableHead>Remito</TableHead>
              <TableHead>Método</TableHead>
              <TableHead>Monto</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="w-20" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredMovements.map((m) => (
              <TableRow key={m.id}>
                <TableCell className="text-muted-foreground">{formatDate(m.date)}</TableCell>
                <TableCell className="max-w-[160px] truncate">{m.clientName}</TableCell>
                <TableCell>{m.branch}</TableCell>
                <TableCell>{m.documentNumber}</TableCell>
                <TableCell>
                  {MOVEMENT_METHOD_LABELS[m.method] ?? m.method}
                  {m.isVirtual && <Badge variant="info" className="ml-2">Virtual</Badge>}
                </TableCell>
                <TableCell className="tabular-nums">{formatMoney(m.total)}</TableCell>
                <TableCell>
                  <Badge variant={m.status === "RECONCILIADO" || m.status === "IMPUTADO" ? "success" : "muted"}>
                    {MOVEMENT_STATUS_LABELS[m.status] ?? m.status}
                  </Badge>
                </TableCell>
                <TableCell className="flex gap-1">
                  {m.status !== "IMPUTADO" && m.status !== "RECONCILIADO" && (
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Conciliar"
                      loading={reconcile.isPending && reconcile.variables === m.id}
                      disabled={reconcile.isPending || remove.isPending}
                      onClick={() => reconcile.mutate(m.id)}
                    >
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Eliminar"
                    loading={remove.isPending && remove.variables === m.id}
                    disabled={reconcile.isPending || remove.isPending}
                    onClick={() => remove.mutate(m.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
