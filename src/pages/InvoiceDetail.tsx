"use client";

import { useParams, Link } from "react-router-dom";
import { useInvoice } from "@/hooks";
import { AppSidebar } from "@/components/AppSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Package, AlertCircle, CheckCircle, XCircle, Clock } from "lucide-react";
import type { ArticleModel, BillingComments } from "@/types/domain";

/**
 * Invoice Detail page — mirrors Kotlin DetailInvoiceScreen / DetailInvoiceViewModel
 * Shows invoice details, articles, payments, comments
 */
export default function InvoiceDetail() {
  const { invoiceNumber } = useParams<{ invoiceNumber: string }>();
  const { data: invoice, isLoading, error } = useInvoice(invoiceNumber ?? null);

  const getStatusBadge = (state: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      Pendiente: "default",
      "Por vencer": "secondary",
      Vencido: "destructive",
      Cobrado: "default",
      Cerrada: "outline",
      Devuelta: "destructive",
      Cancelado: "destructive",
    };
    return variants[state] || "default";
  };

  const getStatusIcon = (state: string) => {
    switch (state) {
      case "Cobrado":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "Vencido":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case "Por vencer":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "Cancelado":
      case "Devuelta":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Package className="h-4 w-4" />;
    }
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
    return new Date(timestamp).toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex">
        <AppSidebar />
        <main className="flex-1 min-w-0 p-6">
          <div className="mx-auto max-w-4xl space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Cargando factura...</CardTitle>
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
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen bg-background flex">
        <AppSidebar />
        <main className="flex-1 min-w-0 p-6">
          <div className="mx-auto max-w-4xl">
            <Card>
              <CardContent className="text-center py-8">
                <AlertCircle className="mx-auto h-12 w-12 text-destructive mb-4" />
                <h2 className="text-xl font-semibold mb-2">Factura no encontrada</h2>
                <p className="text-muted-foreground mb-4">
                  No se pudo cargar la factura {invoiceNumber}
                </p>
                <Link to="/invoices">
                  <Button variant="outline">Volver al listado</Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      <AppSidebar />
      <main className="flex-1 min-w-0 p-6">
        <div className="mx-auto max-w-4xl space-y-6">
          {/* Header with back button */}
          <div className="flex items-center gap-4">
            <Link to="/invoices">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">Factura {invoice.billingNumber}</h1>
              <p className="text-muted-foreground">Orden: {invoice.orderId}</p>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <Badge variant={getStatusBadge(invoice.stateBilling)} className="gap-1">
                {getStatusIcon(invoice.stateBilling)}
                {invoice.stateBilling}
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
                <p className="text-lg font-medium">{invoice.clientName}</p>
                <p className="text-sm text-muted-foreground">ID: {invoice.clientId}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Fábrica / Marca</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-medium">{invoice.brand}</p>
                <p className="text-sm text-muted-foreground">Segmento: {invoice.branch}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Condición de pago</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-medium">{invoice.paymentCondition}</p>
                <p className="text-sm text-muted-foreground">Dto. esperado: {invoice.expectedDiscount}%</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Tipo</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-medium">{invoice.type}</p>
              </CardContent>
            </Card>
          </div>

          {/* Financial Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Resumen financiero</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Total factura</p>
                  <p className="text-2xl font-bold">{formatCurrency(invoice.total)}</p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">A cobrar</p>
                  <p className="text-2xl font-bold text-primary">{formatCurrency(invoice.toPay)}</p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Pagado</p>
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(invoice.payed)}</p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg md:col-span-2">
                  <p className="text-sm text-muted-foreground">Saldo pendiente</p>
                  <p className="text-2xl font-bold text-destructive">{formatCurrency(invoice.rest)}</p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Fecha factura</p>
                  <p className="text-lg font-medium">{formatDate(invoice.loadDate)}</p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Fecha recepción</p>
                  <p className="text-lg font-medium">{formatDate(invoice.deliveryDate)}</p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Fecha pago</p>
                  <p className="text-lg font-medium">{formatDate(invoice.payDate)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Articles */}
          <Card>
            <CardHeader>
              <CardTitle>Artículos ({invoice.articles.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {invoice.articles.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">Sin artículos</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-muted-foreground">
                        <th className="pb-2 pr-4">Artículo</th>
                        <th className="pb-2 pr-4">Color</th>
                        <th className="pb-2 pr-4 text-right">Importe</th>
                        <th className="pb-2 text-right">Pares</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoice.articles.map((article: ArticleModel, i: number) => (
                        <tr key={i} className="border-b last:border-0">
                          <td className="py-2 pr-4">{article.name}</td>
                          <td className="py-2 pr-4">{article.color}</td>
                          <td className="py-2 pr-4 text-right">{formatCurrency(article.value)}</td>
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
          <Card>
            <CardHeader>
              <CardTitle>Comentarios ({invoice.comments.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {invoice.comments.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">Sin comentarios</p>
              ) : (
                <div className="space-y-4">
                  {invoice.comments.map((comment: BillingComments, i: number) => (
                    <div key={i} className="p-4 bg-muted/50 rounded-lg">
                      <p className="text-sm">{comment.comments}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDate(comment.date)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline">
              <Link to={`/invoices/${invoice.billingNumber}/edit`}>Editar factura</Link>
            </Button>
            <Button variant="outline">
              <Link to={`/invoices/${invoice.billingNumber}/payments`}>Registrar pago</Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}