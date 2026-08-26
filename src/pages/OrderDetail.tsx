"use client";

import { useParams, Link, useNavigate } from "react-router-dom";
import { useBuyOrder } from "@/hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Package, Truck, AlertCircle, CheckCircle, XCircle } from "lucide-react";
import type { ArticleOrderModel } from "@/types/domain";

/**
 * Order Detail page — mirrors Kotlin OrderDetailScreen / OrderDetailViewModel
 * Shows buy order details, articles, tracking
 */
export default function OrderDetail() {
  const { clientId, orderId } = useParams<{ clientId: string; orderId: string }>();
  const navigate = useNavigate();
  const { data: order, isLoading, error } = useBuyOrder(clientId ?? null, orderId ?? null);

  const getTrackingBadge = (state: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      "Pendiente": "default",
      "En camino": "secondary",
      "Entregado": "default",
      "Cancelado": "destructive",
    };
    return variants[state] || "default";
  };

  const getTrackingIcon = (state: string) => {
    switch (state) {
      case "Entregado":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "Cancelado":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "En camino":
        return <Truck className="h-4 w-4 text-blue-500" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  const formatDate = (timestamp: number) => {
    if (!timestamp || timestamp === 0) return "---";
    return new Date(timestamp).toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  if (isLoading) {
    return (
      <main className="min-h-svh w-full p-4 sm:p-6">
          <div className="mx-auto max-w-4xl space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Cargando pedido...</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <Skeleton className="h-10 w-10 rounded" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
      </main>
    );
  }

  if (error || !order) {
    return (
      <main className="min-h-svh w-full p-4 sm:p-6">
          <div className="mx-auto max-w-4xl">
            <Card>
              <CardContent className="text-center py-8">
                <AlertCircle className="mx-auto h-12 w-12 text-destructive mb-4" />
                <h2 className="text-xl font-semibold mb-2">Pedido no encontrado</h2>
                <p className="text-muted-foreground mb-4">
                  No se pudo cargar el pedido {orderId}
                </p>
                <Link to="/orders">
                  <Button variant="outline">Volver al listado</Button>
                </Link>
              </CardContent>
            </Card>
          </div>
      </main>
    );
  }

  return (
    <main className="min-h-svh w-full p-4 sm:p-6">
        <div className="mx-auto max-w-4xl space-y-6">
          {/* Header with back button */}
          <div className="flex items-center gap-4">
            <Link to="/orders">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">Pedido {order.order}</h1>
              <p className="text-muted-foreground">Cliente: {order.client}</p>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <Badge variant={getTrackingBadge(order.type)} className="gap-1">
                {getTrackingIcon(order.type)}
                {order.type}
              </Badge>
            </div>
          </div>

          {/* Main Info Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Cliente</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-medium">{order.client}</p>
                <p className="text-sm text-muted-foreground">ID: {order.clientId}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Fábrica / Marca</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-medium">{order.factory}</p>
                <p className="text-sm text-muted-foreground">Marca: {order.branch}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Condición de pago</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-medium">{order.paymentCondition}</p>
                <p className="text-sm text-muted-foreground">Dto: {order.discount}% • Venc: {order.expirationDays} días</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Tipo</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-medium">{order.billing}</p>
              </CardContent>
            </Card>
          </div>

          {/* Dates */}
          <Card>
            <CardHeader>
              <CardTitle>Fechas importantes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Fecha carga</p>
                  <p className="text-lg font-medium">{formatDate(order.loadedDate)}</p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Fecha entrega</p>
                  <p className="text-lg font-medium">{formatDate(order.deliveryDate)}</p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Timestamp</p>
                  <p className="text-lg font-medium">{formatDate(order.timeStamp)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Articles */}
          <Card>
            <CardHeader>
              <CardTitle>Artículos ({order.articles.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {order.articles.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">Sin artículos</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-muted-foreground">
                        <th className="pb-2 pr-4">Artículo</th>
                        <th className="pb-2 pr-4">Color</th>
                        <th className="pb-2 pr-4 text-right">Entregados</th>
                        <th className="pb-2 text-right">Pares</th>
                      </tr>
                    </thead>
                    <tbody>
                      {order.articles.map((article: ArticleOrderModel, i: number) => (
                        <tr key={i} className="border-b last:border-0">
                          <td className="py-2 pr-4">{article.name}</td>
                          <td className="py-2 pr-4">{article.color}</td>
                          <td className="py-2 pr-4 text-right">{article.delivered}</td>
                          <td className="py-2 text-right">{article.pairs}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Comments */}
          {order.comments && (
            <Card>
              <CardHeader>
                <CardTitle>Comentarios</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{order.comments}</p>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => navigate(`/orders/${order.id}/edit`)}>
                Editar pedido
              </Button>
              <Button variant="outline" onClick={() => navigate(`/orders/${order.id}/billings`)}>
                Ver facturas
              </Button>
          </div>
        </div>
    </main>
  );
}