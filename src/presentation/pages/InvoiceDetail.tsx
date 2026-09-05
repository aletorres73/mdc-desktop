import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/presentation/contexts/AuthContext";
import {
  useInvoice,
  useDeleteInvoice,
  useAddInvoiceComment,
  useApplyInvoicePayment,
  useDeleteInvoicePayment,
  useReconcileInvoicePayment,
} from "@/presentation/hooks/useInvoices";
import { usePaymentRegister } from "@/presentation/hooks/usePaymentRegister";
import { Card, CardContent, CardHeader, CardTitle } from "@/presentation/components/ui/card";
import { Badge, stateToBadgeVariant } from "@/presentation/components/ui/badge";
import { Button } from "@/presentation/components/ui/button";
import { Input } from "@/presentation/components/ui/input";
import { Textarea } from "@/presentation/components/ui/textarea";
import { Select } from "@/presentation/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/presentation/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/presentation/components/ui/dialog";
import { LoadingState } from "@/presentation/components/shared/LoadingState";
import { formatMoney, formatDate } from "@/lib/utils";
import { editInvoicePath, ROUTES } from "@/presentation/routes/routes";
import type { MovementMethod } from "@/domain/entities/paymentRegister";
import { ArrowLeft, Pencil, Plus, Trash2, CheckCircle2 } from "lucide-react";

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
  const navigate = useNavigate();
  const { appUser } = useAuth();
  const { data: invoice, isLoading } = useInvoice(appUser?.uid, invoiceId);

  const deleteInvoice = useDeleteInvoice(appUser?.uid);
  const addComment = useAddInvoiceComment(appUser?.uid, invoiceId!);
  const applyPayment = useApplyInvoicePayment(appUser?.uid, invoiceId!);
  const deletePayment = useDeleteInvoicePayment(appUser?.uid, invoiceId!);
  const reconcilePayment = useReconcileInvoicePayment(appUser?.uid, invoiceId!);

  const [comment, setComment] = useState("");
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<MovementMethod>("TRANSFERENCIA");
  const [notes, setNotes] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const { data: movements } = usePaymentRegister(appUser?.uid, { clientId: invoice?.clientId });
  const invoiceMovements = (movements ?? []).filter((m) => m.documentNumber === invoice?.billingNumber);

  if (isLoading) return <LoadingState className="min-h-[60vh]" />;
  if (!invoice) return <p className="text-muted-foreground">Factura no encontrada.</p>;

  const handleDelete = async () => {
    await deleteInvoice.mutateAsync(invoiceId!);
    navigate(ROUTES.INVOICES);
  };

  const handleAddPayment = async () => {
    const value = parseFloat(amount);
    if (!value) return;
    await applyPayment.mutateAsync({ amount: value, method, notes });
    setAmount("");
    setNotes("");
    setPaymentOpen(false);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <Link to={ROUTES.INVOICES} className="mb-1 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-3.5 w-3.5" /> Facturas
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">Factura #{invoice.billingNumber}</h1>
          <p className="text-sm text-muted-foreground">{invoice.clientName} · {invoice.brand}</p>
        </div>
        <div className="flex gap-2">
          <Link to={editInvoicePath(invoiceId!)}><Button variant="outline"><Pencil className="h-4 w-4" />Editar</Button></Link>
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
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        {[
          { label: "Total", value: formatMoney(invoice.total) },
          { label: "Pagado", value: formatMoney(invoice.payed) },
          { label: "Saldo", value: formatMoney(invoice.rest) },
          { label: "Vencimiento", value: formatDate(invoice.payDate) },
        ].map((item) => (
          <Card key={item.label} className="border-border/50 shadow-sm">
            <CardContent className="p-4">
              <p className="text-sm font-medium text-muted-foreground">{item.label}</p>
              <p className="text-2xl font-bold tracking-tight tabular-nums">{item.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div>
        <Badge variant={stateToBadgeVariant(invoice.stateBilling)}>{invoice.stateBilling}</Badge>
      </div>

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
          <CardTitle className="text-base">Comentarios</CardTitle>
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
