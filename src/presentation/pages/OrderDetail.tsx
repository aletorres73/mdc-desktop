"use client";

import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useBuyOrder } from "../hooks/useOrders";
import { PageShell, PageHeader, KpiCard, DataTableShell, DataTableRow, DataTableCell, StatusBadge } from "../components/shared";
import { Card, CardContent, CardHeader, CardTitle } from "@/presentation/components/ui/card";
import { Button } from "@/presentation/components/ui/button";
import { Skeleton } from "@/presentation/components/ui/skeleton";
import { ArrowLeft, Package, AlertCircle, Share2, Layers } from "lucide-react";
import type { ArticleOrderModel } from "@/domain/entities/order";
import { toFormattedDate } from "@/domain/entities/formatters";
import { shareText } from "../utils/shareUtils";
import { ReportGenerator } from "@/domain/logic/reportGenerator";
import { ROUTES } from "../routes/routes";

export default function OrderDetail() {
  const { clientId, orderId } = useParams<{ clientId: string; orderId: string }>();
  const { data: order, isLoading, error } = useBuyOrder(clientId ?? null, orderId ?? null);
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    if (!order) return;
    const reportText = ReportGenerator.generateOrderReport(order);
    const success = await shareText(reportText);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (isLoading) {
    return (
      <PageShell>
        <div className="space-y-6">
          <Skeleton className="h-16 w-1/3 rounded-xl" />
          <div className="grid gap-4 md:grid-cols-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-28 w-full rounded-xl" />)}
          </div>
          <Skeleton className="h-[300px] w-full rounded-xl" />
        </div>
      </PageShell>
    );
  }

  if (error || !order) {
    return (
      <PageShell>
        <div className="flex min-h-[50vh] w-full items-center justify-center p-6">
          <div className="text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-destructive mb-4" />
            <h2 className="text-xl font-semibold mb-2">Pedido no encontrado</h2>
            <p className="text-muted-foreground mb-4">No se pudo cargar el pedido {orderId}</p>
            <Link to={ROUTES.ORDERS}>
              <Button variant="outline">Volver al listado</Button>
            </Link>
          </div>
        </div>
      </PageShell>
    );
  }

  const totalPairs = (order.articles || []).reduce((sum, a) => sum + a.pairs, 0);

  return (
    <PageShell maxWidth="default">
      <PageHeader
        title={`Pedido #${order.order}`}
        description={`Cliente: ${order.client} • Fábrica: ${order.factory}`}
        icon={Package}
        actions={
          <div className="flex items-center gap-2">
            <Link to={ROUTES.ORDERS}>
              <Button variant="outline" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" /> Volver
              </Button>
            </Link>
            <Button variant="outline" size="sm" onClick={handleShare}>
              <Share2 className="mr-2 h-4 w-4" />
              {copied ? "¡Copiado!" : "Compartir Nota"}
            </Button>
            <StatusBadge status={order.type || "Proceso"} />
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Total Artículos" value={order.articles.length} icon={Package} tone="primary" />
        <KpiCard label="Total Pares" value={totalPairs} icon={Layers} tone="info" />
        <KpiCard label="Fábrica" value={order.factory} icon={Package} tone="primary" />
        <KpiCard label="Marca / Segmento" value={order.branch || "General"} icon={Package} tone="info" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="border-border/50 shadow-sm bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Cliente</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-base font-semibold">{order.client}</p>
            <p className="text-xs text-muted-foreground">ID: {order.clientId}</p>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Condición de Pago</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-base font-semibold">{order.paymentCondition || "Contado"}</p>
            <p className="text-xs text-muted-foreground">Dto: {order.discount}% • Vencimiento: {order.expirationDays} días</p>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Fechas Relevantes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-xs">
            <p><span className="text-muted-foreground">Carga:</span> {toFormattedDate(order.loadedDate)}</p>
            <p><span className="text-muted-foreground">Entrega estimada:</span> {toFormattedDate(order.deliveryDate)}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/50 shadow-sm bg-card">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Artículos del Pedido ({order.articles.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {order.articles.length === 0 ? (
            <p className="text-muted-foreground text-center py-6">Sin artículos</p>
          ) : (
            <DataTableShell headers={["Artículo", "Color", "Entregados", "Pares"]}>
              {order.articles.map((article: ArticleOrderModel, i: number) => (
                <DataTableRow key={i}>
                  <DataTableCell className="font-medium">{article.name}</DataTableCell>
                  <DataTableCell>{article.color}</DataTableCell>
                  <DataTableCell className="text-right font-mono text-muted-foreground">{article.delivered}</DataTableCell>
                  <DataTableCell className="text-right font-mono font-semibold">{article.pairs}</DataTableCell>
                </DataTableRow>
              ))}
            </DataTableShell>
          )}
        </CardContent>
      </Card>

      {order.comments && (
        <Card className="border-border/50 shadow-sm bg-card">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Comentarios</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{order.comments}</p>
          </CardContent>
        </Card>
      )}
    </PageShell>
  );
}
