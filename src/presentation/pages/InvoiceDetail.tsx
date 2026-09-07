import { useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/presentation/contexts/AuthContext";
import {
  useInvoiceDetail,
  useDeleteInvoice,
  useAddInvoiceComment,
  useApplyInvoicePayment,
  useChangePaymentCondition,
  useDeleteInvoicePayment,
  useReconcileInvoicePayment,
} from "@/presentation/hooks/useInvoices";
import { usePaymentRegister } from "@/presentation/hooks/usePaymentRegister";
import { useFactory } from "@/presentation/hooks/useFactories";
import { InvoiceHeader } from "@/presentation/components/invoices/InvoiceHeader";
import { InvoiceDates } from "@/presentation/components/invoices/InvoiceDates";
import { InvoiceTotals } from "@/presentation/components/invoices/InvoiceTotals";
import { InvoiceDocuments } from "@/presentation/components/invoices/InvoiceDocuments";
import { PaymentCondition } from "@/presentation/components/invoices/PaymentCondition";
import { Card, CardContent, CardHeader, CardTitle } from "@/presentation/components/ui/card";
import { Badge } from "@/presentation/components/ui/badge";
import { Button } from "@/presentation/components/ui/button";
import { Input } from "@/presentation/components/ui/input";
import { Textarea } from "@/presentation/components/ui/textarea";
import { Select } from "@/presentation/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/presentation/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/presentation/components/ui/dialog";
import { LoadingState } from "@/presentation/components/shared/LoadingState";
import { ErrorState } from "@/presentation/components/shared/ErrorState";
import { EmptyState } from "@/presentation/components/shared/EmptyState";
import { formatMoney, formatDate } from "@/lib/utils";
import { editInvoicePath, ROUTES } from "@/presentation/routes/routes";
import type { MovementMethod } from "@/domain/entities/paymentRegister";
import { Link2, Pencil, Plus, Receipt, Trash2, CheckCircle2 } from "lucide-react";

const METHOD_OPTIONS: { value: MovementMethod; label: string }[] = [
  { value: "EFECTIVO", label: "Efectivo" },
  { value: "TRANSFERENCIA", label: "Transferencia" },
  { value: "CHEQUE", label: "Cheque" },
  { value: "PRONTO_PAGO", label: "Pronto pago" },
  { value: "NOTA_CREDITO", label: "Nota de crédito" },
  { value: "DESCUENTO_EXTRA", label: "Descuento extra" },
];

export default function InvoiceDetail() {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { appUser } = useAuth();
  const invoiceQuery = useInvoiceDetail(appUser?.uid, invoiceId);
  const invoice = invoiceQuery.data;

  const deleteInvoice = useDeleteInvoice(appUser?.uid);
  const addComment = useAddInvoiceComment(appUser?.uid, invoiceId ?? "");
  const applyPayment = useApplyInvoicePayment(appUser?.uid, invoiceId ?? "");
  const deletePayment = useDeleteInvoicePayment(appUser?.uid, invoiceId ?? "");
  const reconcilePayment = useReconcileInvoicePayment(appUser?.uid, invoiceId ?? "");
  const changePaymentCondition = useChangePaymentCondition(appUser?.uid, invoiceId ?? "");

  const { data: factory } = useFactory(appUser?.uid, invoice?.brand);

  const [comment, setComment] = useState("");
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<MovementMethod>("TRANSFERENCIA");
  const [notes, setNotes] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const backToSearch = typeof location.state?.backToSearch === "string"
    ? location.state.backToSearch
    : "";
  const backToInvoicesPath = `${ROUTES.INVOICES}${backToSearch}`;

  const { data: movements } = usePaymentRegister(appUser?.uid, { clientId: invoice?.clientId });
  const invoiceMovements = (movements ?? []).filter((m) => m.documentNumber === invoice?.billingNumber);

  if (invoiceQuery.uiState === "loading") {
    return (
      <div className="min-h-[60vh]">
        <LoadingState className="min-h-[60vh]" />
        <p className="text-center text-sm text-muted-foreground">Cargando detalle de invoice...</p>
      </div>
    );
  }

  if (invoiceQuery.uiState === "error") {
    const message = invoiceQuery.error instanceof Error
      ? invoiceQuery.error.message
      : "Error al cargar el detalle de la factura.";

    return (
      <div className="space-y-4">
        <ErrorState message={message} />
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate(backToInvoicesPath)}>Volver</Button>
          <Button onClick={() => void invoiceQuery.retry()}>Reintentar</Button>
        </div>
      </div>
    );
  }

  if (invoiceQuery.uiState === "notFound" || !invoice) {
    return (
      <EmptyState
        icon={Receipt}
        title="Factura no encontrada"
        description="La factura no existe o fue eliminada."
        action={<Link to={backToInvoicesPath}><Button variant="outline">Volver al listado</Button></Link>}
      />
    );
  }

  const handleDelete = async () => {
    await deleteInvoice.mutateAsync(invoiceId ?? "");
    navigate(backToInvoicesPath);
  };

  const handleAddPayment = async () => {
    const value = parseFloat(amount);
    if (!value) return;
    await applyPayment.mutateAsync({ amount: value, method, notes });
    setAmount("");
    setNotes("");
    setPaymentOpen(false);
  };

  const documentLinks = Array.from(
    new Set(
      invoice.comments.flatMap((entry) => {
        const matches = entry.comments.match(/https?:\/\/\S+/g);
        return matches ?? [];
      }),
    ),
  );

  return (
    <div className="flex flex-col gap-6">
      <InvoiceHeader
        invoice={invoice}
        backToPath={backToInvoicesPath}
        actions={(
          <>
            <Link to={editInvoicePath(invoiceId ?? "")} state={{ backToSearch }}>
              <Button variant="outline"><Pencil className="h-4 w-4" />Editar</Button>
            </Link>
            <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
              <DialogTrigger render={<Button variant="destructive"><Trash2 className="h-4 w-4" />Eliminar</Button>} />
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Eliminar factura</DialogTitle>
                </DialogHeader>
                <p className="text-sm text-muted-foreground">Esta acción no se puede deshacer.</p>
                <DialogFooter>
                  <Button variant="destructive" onClick={handleDelete} loading={deleteInvoice.isPending}>
                    {deleteInvoice.isPending ? "Eliminando..." : "Confirmar eliminación"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </>
        )}
      />

      <div className="grid grid-cols-1 items-stretch gap-4 md:grid-cols-2">
        <InvoiceTotals invoice={invoice} />
        <div className="flex h-full flex-col gap-4">
          <InvoiceDates invoice={invoice} />
          <PaymentCondition
            value={invoice.paymentCondition}
            options={factory?.paymentType ?? []}
            loading={changePaymentCondition.isPending}
            onChange={async (nextPaymentName) => {
              await changePaymentCondition.mutateAsync(nextPaymentName);
            }}
          />
        </div>
      </div>

      <InvoiceDocuments documents={documentLinks} />

      <Card className="border-border/50 shadow-sm">
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Pagos registrados</CardTitle>
          <Dialog open={paymentOpen} onOpenChange={setPaymentOpen}>
            <DialogTrigger render={<Button size="sm"><Plus className="h-4 w-4" />Registrar pago</Button>} />
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Registrar pago</DialogTitle>
              </DialogHeader>
              <div className="flex flex-col gap-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Monto</label>
                  <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Método</label>
                  <Select
                    options={METHOD_OPTIONS}
                    value={method}
                    onChange={(e) => setMethod(e.target.value as MovementMethod)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Notas</label>
                  <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleAddPayment} loading={applyPayment.isPending}>
                  {applyPayment.isPending ? "Guardando..." : "Guardar pago"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Método</TableHead>
                <TableHead>Monto</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="w-20" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {!invoiceMovements.length && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    Sin pagos registrados
                  </TableCell>
                </TableRow>
              )}
              {invoiceMovements.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="text-muted-foreground">{formatDate(m.date)}</TableCell>
                  <TableCell>
                    {m.method}
                    {m.isVirtual && <Badge variant="info" className="ml-2">Virtual</Badge>}
                  </TableCell>
                  <TableCell className="tabular-nums">{formatMoney(m.total)}</TableCell>
                  <TableCell>
                    <Badge variant={m.status === "IMPUTADO" ? "success" : "muted"}>
                      {m.status === "IMPUTADO" ? "Conciliado" : "Pendiente"}
                    </Badge>
                  </TableCell>
                  <TableCell className="flex gap-1">
                    {m.status !== "IMPUTADO" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Conciliar pago"
                        loading={reconcilePayment.isPending && reconcilePayment.variables === m.id}
                        disabled={reconcilePayment.isPending || deletePayment.isPending}
                        onClick={() => reconcilePayment.mutate(m.id)}
                      >
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Eliminar pago"
                      loading={deletePayment.isPending && deletePayment.variables === m.id}
                      disabled={reconcilePayment.isPending || deletePayment.isPending}
                      onClick={() => deletePayment.mutate(m.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base inline-flex items-center gap-2">
            <Link2 className="h-4 w-4" />
            Comentarios y referencias
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {invoice.comments.map((c, idx) => (
            <div key={idx} className="rounded-md bg-muted/40 px-3 py-2 text-sm">
              <p>{c.comments}</p>
              <p className="text-xs text-muted-foreground">{formatDate(c.date)}</p>
            </div>
          ))}
          <div className="flex gap-2">
            <Input value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Agregar comentario..." />
            <Button
              aria-label="Agregar comentario"
              loading={addComment.isPending}
              onClick={async () => {
                if (!comment.trim()) return;
                await addComment.mutateAsync(comment.trim());
                setComment("");
              }}
            >
              <CheckCircle2 className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
