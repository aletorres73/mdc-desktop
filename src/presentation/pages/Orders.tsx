"use client";

import { useState, useCallback } from "react";
import { useOrders, useFactoriesForOrders } from "../hooks/useOrders";
import type { OrderFilters } from "@/domain/entities/order";
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
import { Search, Package, RefreshCw } from "lucide-react";
import { toFormattedDate, toPrint, toMoneyDouble } from "@/domain/entities/formatters";

export default function Orders() {
  const [filters, setFilters] = useState<OrderFilters>({
    factory: "all",
    search: "",
  });

  const { data: factories } = useFactoriesForOrders();
  const { data: orders, isLoading, error, refetch } = useOrders(filters);

  const handleFilterChange = useCallback(
    (key: keyof OrderFilters, value: string | null) => {
      setFilters((prev) => ({ ...prev, [key]: value ?? "" }));
    },
    []
  );

  return (
    <PageShell>
      <PageHeader
        title="Pedidos"
        description="Gestión y seguimiento de órdenes de compra"
        icon={Package}
        actions={
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="mr-2 h-4 w-4" /> Actualizar
          </Button>
        }
      />

      <Card className="border-border/50 shadow-sm bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Filtros de búsqueda</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Fábrica</label>
              <Select value={filters.factory} onValueChange={(v) => handleFilterChange("factory", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las fábricas</SelectItem>
                  {factories?.map((factory) => (
                    <SelectItem key={factory} value={factory}>
                      {factory}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 min-w-[250px]">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Buscar</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar cliente o N° orden..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange("search", e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Button
              variant="outline"
              onClick={() => setFilters({ factory: "all", search: "" })}
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
        isEmpty={!orders || orders.length === 0}
        emptyTitle="No se encontraron pedidos"
        emptyDescription="Prueba ajustando la búsqueda o el filtro por fábrica."
      >
        <DataTableShell headers={["N° Orden", "Cliente", "Marca", "Fecha", "Despacho", "Cobranza", "Importe"]}>
          {(orders ?? []).map((order) => (
            <DataTableRow key={order.orderNumber}>
              <DataTableCell className="font-mono text-sm font-medium">{order.orderNumber}</DataTableCell>
              <DataTableCell className="max-w-xs truncate">{order.nameClient}</DataTableCell>
              <DataTableCell>{order.branch}</DataTableCell>
              <DataTableCell>{toFormattedDate(order.documentDate)}</DataTableCell>
              <DataTableCell>
                <StatusBadge status={order.trackingState || "Sin estado"} />
              </DataTableCell>
              <DataTableCell>
                <StatusBadge status={order.payState || "Sin estado"} />
              </DataTableCell>
              <DataTableCell className="text-right font-medium">
                {toPrint(toMoneyDouble(order.valueDocument))}
              </DataTableCell>
            </DataTableRow>
          ))}
        </DataTableShell>
      </DataState>
    </PageShell>
  );
}
