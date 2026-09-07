import { useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/presentation/contexts/AuthContext";
import { useAllBuyOrders } from "@/presentation/hooks/useBuyOrders";
import { buyOrderUseCase } from "@/di/container";
import { Input } from "@/presentation/components/ui/input";
import { Select } from "@/presentation/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/presentation/components/ui/table";
import { Button } from "@/presentation/components/ui/button";
import { LoadingState } from "@/presentation/components/shared/LoadingState";
import { EmptyState } from "@/presentation/components/shared/EmptyState";
import { ErrorState } from "@/presentation/components/shared/ErrorState";
import { formatMoney, formatDate } from "@/lib/utils";
import { orderDetailPath } from "@/presentation/routes/routes";
import {
  distinctBuyOrderValues,
  filterBuyOrders,
  sortBuyOrdersByRecency,
} from "@/domain/logic/buyOrderList";
import { ClipboardList, RefreshCcw, Search } from "lucide-react";

export default function BuyOrders() {
  const { appUser } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  const search = searchParams.get("q") ?? "";
  const factory = searchParams.get("factory") ?? "";
  const branch = searchParams.get("segment") ?? "";

  const ordersQuery = useAllBuyOrders(appUser?.uid);
  const { data: orders, isLoading } = ordersQuery;

  const factoryOptions = useMemo(
    () => [
      { value: "", label: "Todas las fábricas" },
      ...distinctBuyOrderValues(orders ?? [], (order) => order.factory).map((value) => ({ value, label: value })),
    ],
    [orders],
  );

  const branchOptions = useMemo(() => {
    // Si hay fábrica seleccionada, los segmentos se limitan a esa fábrica.
    const scoped = factory ? (orders ?? []).filter((order) => order.factory === factory) : (orders ?? []);
    return [
      { value: "", label: "Todos los segmentos" },
      ...distinctBuyOrderValues(scoped, (order) => order.branch).map((value) => ({ value, label: value })),
    ];
  }, [orders, factory]);

  const filteredOrders = useMemo(
    () => sortBuyOrdersByRecency(filterBuyOrders(orders ?? [], { search, factory, branch })),
    [orders, search, factory, branch],
  );

  const hasActiveFilters = !!search.trim() || !!factory || !!branch;

  const setFilterParams = (patch: { q?: string; factory?: string; segment?: string }) => {
    const next = new URLSearchParams(searchParams);
    for (const [key, value] of Object.entries(patch)) {
      if (value?.trim()) next.set(key, value);
      else next.delete(key);
    }
    setSearchParams(next, { replace: true });
  };

  const handleRefresh = () => {
    void queryClient.invalidateQueries({ queryKey: ["allBuyOrders", appUser?.uid] });
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pedidos</h1>
          <p className="text-sm text-muted-foreground">Explorador global de pedidos de clientes.</p>
        </div>
        <Button variant="outline" onClick={handleRefresh} loading={ordersQuery.isRefetching}>
          {!ordersQuery.isRefetching && <RefreshCcw className="h-4 w-4" />}
          Refrescar
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Cliente o N° de pedido..."
            className="pl-9"
            value={search}
            onChange={(e) => setFilterParams({ q: e.target.value })}
          />
        </div>
        <Select
          className="w-48"
          options={factoryOptions}
          value={factory}
          onChange={(e) => setFilterParams({ factory: e.target.value, segment: "" })}
          aria-label="Filtrar por fábrica"
        />
        <Select
          className="w-48"
          options={branchOptions}
          value={branch}
          onChange={(e) => setFilterParams({ segment: e.target.value })}
          aria-label="Filtrar por segmento"
        />
        {hasActiveFilters && (
          <Button variant="ghost" onClick={() => setSearchParams(new URLSearchParams(), { replace: true })}>
            Limpiar filtros
          </Button>
        )}
      </div>

      {isLoading ? (
        <LoadingState />
      ) : ordersQuery.isError ? (
        <div className="space-y-3">
          <ErrorState
            message={ordersQuery.error instanceof Error ? ordersQuery.error.message : "No se pudieron cargar los pedidos."}
          />
          <Button variant="outline" onClick={() => void ordersQuery.refetch()}>Reintentar</Button>
        </div>
      ) : !filteredOrders.length ? (
        <EmptyState
          icon={ClipboardList}
          title="Sin pedidos"
          description={hasActiveFilters ? "Ningún pedido coincide con los filtros aplicados." : "No hay pedidos cargados."}
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>N° Pedido</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Fábrica</TableHead>
              <TableHead>Segmento</TableHead>
              <TableHead>Entrega</TableHead>
              <TableHead>Pares</TableHead>
              <TableHead>Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrders.map((order) => (
              <TableRow
                key={`${order.clientId}-${order.id}`}
                className="cursor-pointer"
                onClick={() => navigate(orderDetailPath(order.clientId, order.id))}
              >
                <TableCell className="font-medium">{order.order || order.id}</TableCell>
                <TableCell className="max-w-[180px] truncate">{order.client}</TableCell>
                <TableCell>{order.factory}</TableCell>
                <TableCell>{order.branch}</TableCell>
                <TableCell className="text-muted-foreground">{formatDate(order.deliveryDate)}</TableCell>
                <TableCell className="tabular-nums">
                  {order.articles.reduce((sum, art) => sum + art.pairs, 0)}
                </TableCell>
                <TableCell className="tabular-nums">{formatMoney(buyOrderUseCase.calculateTotal(order))}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
