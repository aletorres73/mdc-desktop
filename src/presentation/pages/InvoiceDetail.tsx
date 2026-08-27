"use client";

import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useInvoice } from "../hooks/useInvoices";
import { PageShell, PageHeader, KpiCard, DataTableShell, DataTableRow, DataTableCell, StatusBadge } from "../components/shared";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, AlertCircle, FileText, Share2, Wallet } from "lucide-react";
import type { ArticleModel, BillingComments } from "@/domain/entities/invoice";
import { toFormattedDate, toPrint } from "@/domain/entities/formatters";
import { shareText } from "../utils/shareUtils";
import { ReportGenerator } from "@/domain/logic/reportGenerator";
import { ROUTES } from "../routes/routes";

export default function InvoiceDetail() {
  const { invoiceNumber } = useParams<{ invoiceNumber: string }>();
  const { data: invoice, isLoading, error } = useInvoice(invoiceNumber ?? null);
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    if (!invoice) return;
    const reportText = ReportGenerator.generateInvoiceReport(invoice);
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
          <div className="grid gap-4 md:grid-cols-4">
            {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-28 w-full rounded-xl" />)}
          </div>
          <Skeleton className="h-[300px] w-full rounded-xl" />
        </div>
      </PageShell>
    );
  }

  if (error || !invoice) {
    return (
      <PageShell>
        <div className="flex min-h-[50vh] w-full items-center justify-center p-6">
          <div className="text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-destructive mb-4" />
            <h2 className="text-xl font-semibold mb-2">Factura no encontrada</h2>
            <p className="text-muted-foreground mb-4">No se pudo cargar la factura {invoiceNumber}</p>
            <Link to={ROUTES.INVOICES}>
              <Button variant="outline">Volver al listado</Button>
            </Link>
          </div>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell maxWidth="default">
      <PageHeader
        title={`Factura ${invoice.billingNumber}`}
        description={`Orden: ${invoice.orderId} • Cliente: ${invoice.clientName}`}
        icon={FileText}
        actions={
          <div className="flex items-center gap-2">
            <Link to={ROUTES.INVOICES}>
              <Button variant="outline" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" /> Volver
              </Button>
            </Link>
            <Button variant="outline" size="sm" onClick={handleShare}>
              <Share2 className="mr-2 h-4 w-4" />
              {copied ? "¡Copiado!" : "Compartir Factura"}
            </Button>
            <StatusBadge status={invoice.stateBilling || "Pendiente"} />
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Monto Total" value={toPrint(invoice.total)} icon={FileText} tone="primary" />
        <KpiCard label="Monto a Cobrar" value={toPrint(invoice.toPay)} icon={Wallet} tone="info" />
        <KpiCard label="Monto Pagado" value={toPrint(invoice.payed)} icon={Wallet} tone="success" />
        <KpiCard label="Saldo Pendiente" value={toPrint(invoice.rest)} icon={AlertCircle} tone={invoice.rest > 0 ? "danger" : "success"} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/50 shadow-sm bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Cliente</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-base font-semibold">{invoice.clientName}</p>
            <p className="text-xs text-muted-foreground">ID: {invoice.clientId}</p>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Fábrica / Marca</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-base font-semibold">{invoice.brand}</p>
            <p className="text-xs text-muted-foreground">Segmento: {invoice.branch || "General"}</p>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Condición de Pago</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-base font-semibold">{invoice.paymentCondition || "Sin especificar"}</p>
            <p className="text-xs text-muted-foreground">Descuento: {invoice.expectedDiscount}%</p>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Fechas Relevantes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-xs">
            <p><span className="text-muted-foreground">Emisión:</span> {toFormattedDate(invoice.loadDate)}</p>
            <p><span className="text-muted-foreground">Recepción:</span> {toFormattedDate(invoice.deliveryDate)}</p>
            <p><span className="text-muted-foreground">Vencimiento:</span> {toFormattedDate(invoice.payDate)}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/50 shadow-sm bg-card">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Artículos ({invoice.articles.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {invoice.articles.length === 0 ? (
            <p className="text-muted-foreground text-center py-6">Sin artículos cargados</p>
          ) : (
            <DataTableShell headers={["Artículo", "Color", "Importe", "Pares"]}>
              {invoice.articles.map((article: ArticleModel, i: number) => (
                <DataTableRow key={i}>
                  <DataTableCell className="font-medium">{article.name}</DataTableCell>
                  <DataTableCell>{article.color}</DataTableCell>
                  <DataTableCell className="text-right font-medium">{toPrint(article.value)}</DataTableCell>
                  <DataTableCell className="text-right font-mono">{article.pairs}</DataTableCell>
                </DataTableRow>
              ))}
            </DataTableShell>
          )}
        </CardContent>
      </Card>

      {invoice.comments.length > 0 && (
        <Card className="border-border/50 shadow-sm bg-card">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Comentarios ({invoice.comments.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {invoice.comments.map((comment: BillingComments, i: number) => (
              <div key={i} className="p-3 bg-muted/40 border border-border/40 rounded-lg space-y-1">
                <p className="text-sm">{comment.comments}</p>
                <p className="text-xs text-muted-foreground">{toFormattedDate(comment.date)}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </PageShell>
  );
}
