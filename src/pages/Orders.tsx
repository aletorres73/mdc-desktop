"use client";

import { useState, useCallback } from "react";
import { useOrders, useFactoriesForOrders } from "@/hooks";
import { AppSidebar } from "@/components/AppSidebar";
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Search } from "lucide-react";
import type { OrderFilters } from "@/types/domain";

/**
 * Orders page — mirrors Kotlin OrdersScreen / OrdersViewModel
 * Features: factory filter, search, pagination
 */
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

  const formatCurrency = (value: string) => {
    const num = parseFloat(value) || 0;
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 2,
    }).format(num);
  };

  const formatDate = (timestamp: number) => {
    if (!timestamp || timestamp === 0) return "---";
    return new Date(timestamp).toLocaleDateString("es-AR");
  };

  return (
    <div className="min-h-screen bg-background flex">
      <AppSidebar />
      <main className="flex-1 min-w-0 p-6">
        <div className="mx-auto max-w-7xl space-y-6">
          {/* Header */}
          <header className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Pedidos</h1>
              <p className="text-muted-foreground">
                Gestión de órdenes de compra
              </p>
            </div>
            <Button variant="outline" onClick={() => refetch()}>
              Actualizar
            </Button>
          </header>

          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Filtros</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-end gap-4">
                {/* Factory Filter */}
                <div className="flex-1 min-w-[200px]">
                  <label className="text-sm font-medium mb-1 block">Fábrica</label>
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

                {/* Search */}
                <div className="flex-1 min-w-[250px]">
                  <label className="text-sm font-medium mb-1 block">Buscar</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Cliente o N° orden..."
                      value={filters.search}
                      onChange={(e) => handleFilterChange("search", e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Clear Filters */}
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

          {/* Orders Table */}
          <Card>
            <CardHeader>
              <CardTitle>Listado de pedidos ({orders?.length ?? 0})</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>N° Orden</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Marca</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Despacho</TableHead>
                      <TableHead>Cobranza</TableHead>
                      <TableHead className="text-right">Importe</TableHead>
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
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : error ? (
                <div className="text-center py-8 text-destructive">
                  Error al cargar pedidos: {error.message}
                </div>
              ) : !orders || orders.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No se encontraron pedidos
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>N° Orden</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Marca</TableHead>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Despacho</TableHead>
                        <TableHead>Cobranza</TableHead>
                        <TableHead className="text-right">Importe</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orders.map((order) => (
                        <TableRow key={order.orderNumber} className="cursor-pointer hover:bg-accent/50">
                          <TableCell className="font-mono text-sm">{order.orderNumber}</TableCell>
                          <TableCell className="max-w-xs truncate">{order.nameClient}</TableCell>
                          <TableCell>{order.branch}</TableCell>
                          <TableCell>{formatDate(order.documentDate)}</TableCell>
                          <TableCell>
                            <span className="capitalize">{order.trackingState}</span>
                          </TableCell>
                          <TableCell>
                            <span className="capitalize">{order.payState}</span>
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(order.valueDocument)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}