"use client";

import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  useAddInvoiceComment,
  useApplyInvoicePayment,
  useInvoice,
  useUpdateInvoiceDetails,
  // useChangePaymentCondition,
  useDeleteInvoice,
  // useUpdateInvoicePayment,
  // useDeleteInvoicePayment,
  // useReconcileInvoicePayment,
} from "../hooks/useInvoices";
import { PageShell, PageHeader, KpiCard, DataTableShell, DataTableRow, DataTableCell, StatusBadge } from "../components/shared";
import { Card, CardContent, CardHeader, CardTitle } from "@/presentation/components/ui/card";
import { Button } from "@/presentation/components/ui/button";
import { Input } from "@/presentation/components/ui/input";
import { Skeleton } from "@/presentation/components/ui/skeleton";
import { ArrowLeft, AlertCircle, FileText, Share2, Wallet } from "lucide-react";
import type { ArticleModel, BillingComments } from "@/domain/entities/invoice";
import { toFormattedDate, toPrint } from "@/domain/entities/formatters";
import { shareText } from "../utils/shareUtils";
import { ReportGenerator } from "@/domain/logic/reportGenerator";
import { ROUTES } from "../routes/routes";
  
export default function InvoiceDetail() {
  const { invoiceNumber } = useParams<{ invoiceNumber: string }>();
  const { data: invoice, isLoading, error } = useInvoice(invoiceNumber ?? null);
  const updateDetails = useUpdateInvoiceDetails();
  const addComment = useAddInvoiceComment();
  const applyPayment = useApplyInvoicePayment();
  const deleteInvoice = useDeleteInvoice();
  const [copied, setCopied] = useState(false);
  const [commentDraft, setCommentDraft] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("0");
  const [paymentType, setPaymentType] = useState<"real" | "virtual">("real");
  const [paymentStatus, setPaymentStatus] = useState<"pendiente" | "imputado" | "conciliado">("imputado");
  const [paymentNote, setPaymentNote] = useState("");
  const [deliveryDateInput, setDeliveryDateInput] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleShare = async () => {
    if (!invoice) return;
    const reportText = ReportGenerator.generateInvoiceReport(invoice);
    const success = await shareText(reportText);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleUpdateDeliveryDate = async () => {
    if (!invoice || !deliveryDateInput) return;
    const deliveryDate = new Date(deliveryDateInput).getTime();
    await updateDetails.mutateAsync({
      billing: invoice,
      updates: {
        deliveryDate,
        comments: [...invoice.comments, { comments: `Fecha de recepción actualizada: ${toFormattedDate(deliveryDate)}`, date: Date.now() }],
      },
    });
    setDeliveryDateInput("");
  };

  const handleAddComment = async () => {
    if (!invoice || !commentDraft.trim()) return;
    await addComment.mutateAsync({ billing: invoice, comment: commentDraft.trim() });
    setCommentDraft("");
  };

  const handleApplyPayment = async () => {
    if (!invoice) return;
    const amount = Number(paymentAmount);
    if (!amount || Number.isNaN(amount)) return;

    await applyPayment.mutateAsync({
      billing: invoice,
      payment: {
        amount,
        type: paymentType,
        status: paymentStatus,
        note: paymentNote || (paymentType === "real" ? "Pago registrado" : "Mov. virtual aplicado"),
        virtualType: paymentType === "virtual" ? "pronto-pago" : undefined,
      },
    });

    setPaymentAmount("0");
    setPaymentNote("");
  };

  const handleDeleteInvoice = async () => {
    if (!invoice) return;
    try {
      await deleteInvoice.mutateAsync(invoice.billingNumber);
      // Redirect to invoices list after deletion
      setTimeout(() => {
        window.location.href = `/${ROUTES.INVOICES}`;
      }, 500);
    } catch (err) {
      console.error("Error deleting invoice:", err);
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
            <Button 
              variant="destructive" 
              size="sm" 
              onClick={() => setShowDeleteConfirm(true)}
              disabled={deleteInvoice.isPending}
            >
              Eliminar
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

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-border/50 shadow-sm bg-card">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Registrar pago</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tipo</label>
                <select
                  value={paymentType}
                  onChange={(e) => setPaymentType(e.target.value as "real" | "virtual")}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="real">Real</option>
                  <option value="virtual">Virtual</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Estado</label>
                <select
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value as "pendiente" | "imputado" | "conciliado")}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="imputado">Imputado</option>
                  <option value="pendiente">Pendiente</option>
                  <option value="conciliado">Conciliado</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Monto</label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Nota</label>
              <textarea
                value={paymentNote}
                onChange={(e) => setPaymentNote(e.target.value)}
                rows={3}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none"
                placeholder="Detalle del pago o movimiento virtual"
              />
            </div>

            <Button
              onClick={handleApplyPayment}
              disabled={applyPayment.isPending || Number(paymentAmount) <= 0}
              className="w-full"
            >
              {applyPayment.isPending ? "Guardando..." : "Guardar pago"}
            </Button>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm bg-card">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Actualizar recepción</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Fecha de recepción</label>
              <Input
                type="date"
                value={deliveryDateInput || (invoice.deliveryDate ? new Date(invoice.deliveryDate).toISOString().slice(0, 10) : "")}
                onChange={(e) => setDeliveryDateInput(e.target.value)}
              />
            </div>
            <Button
              variant="outline"
              onClick={handleUpdateDeliveryDate}
              disabled={updateDetails.isPending || !deliveryDateInput}
              className="w-full"
            >
              {updateDetails.isPending ? "Actualizando..." : "Guardar fecha"}
            </Button>
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

      <Card className="border-border/50 shadow-sm bg-card">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Pagos registrados ({invoice.payments?.length ?? 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {!invoice.payments || invoice.payments.length === 0 ? (
            <p className="text-muted-foreground text-center py-6">Sin pagos registrados</p>
          ) : (
            <div className="space-y-3">
              {invoice.payments.map((payment, i) => (
                <div key={i} className="p-3 bg-muted/40 border border-border/40 rounded-lg space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-semibold">
                        {payment.type === "real" ? "Pago Real" : `Movimiento Virtual (${payment.virtualType || "Descuento"})`}
                      </p>
                      <p className="text-sm font-mono">{toPrint(payment.amount)}</p>
                      <p className="text-xs text-muted-foreground">
                        Estado: {payment.status} • {toFormattedDate(payment.date)}
                      </p>
                      {payment.note && <p className="text-xs text-muted-foreground mt-1">{payment.note}</p>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-border/50 shadow-sm bg-card">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Comentarios ({invoice.comments.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <textarea
              value={commentDraft}
              onChange={(e) => setCommentDraft(e.target.value)}
              rows={3}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none"
              placeholder="Agregar un comentario a la factura"
            />
            <Button
              variant="outline"
              onClick={handleAddComment}
              disabled={addComment.isPending || !commentDraft.trim()}
              className="w-full"
            >
              {addComment.isPending ? "Guardando..." : "Agregar comentario"}
            </Button>
          </div>

          {invoice.comments.length > 0 && (
            <div className="space-y-3">
              {invoice.comments.map((comment: BillingComments, i: number) => (
                <div key={i} className="p-3 bg-muted/40 border border-border/40 rounded-lg space-y-1">
                  <p className="text-sm">{comment.comments}</p>
                  <p className="text-xs text-muted-foreground">{toFormattedDate(comment.date)}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-sm shadow-lg">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Eliminar Factura</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                ¿Está seguro de que desea eliminar la factura <strong>{invoice.billingNumber}</strong>? Esta acción no se puede deshacer.
              </p>
              <div className="flex gap-3 justify-end">
                <Button 
                  variant="outline" 
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={deleteInvoice.isPending}
                >
                  Cancelar
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={handleDeleteInvoice}
                  disabled={deleteInvoice.isPending}
                >
                  {deleteInvoice.isPending ? "Eliminando..." : "Eliminar"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </PageShell>
  );
}
