import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/presentation/contexts/AuthContext";
import { useBuyOrder } from "@/presentation/hooks/useBuyOrders";
import { useCreateInvoiceFromOrder } from "@/presentation/hooks/useBuyOrders";
import { buyOrderUseCase, invoiceUseCase } from "@/di/container";
import { Card, CardContent, CardHeader, CardTitle } from "@/presentation/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/presentation/components/ui/table";
import { Button } from "@/presentation/components/ui/button";
import { Input } from "@/presentation/components/ui/input";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/presentation/components/ui/dialog";
import { LoadingState } from "@/presentation/components/shared/LoadingState";
import { formatMoney, formatDate } from "@/lib/utils";
import { clientDetailPath } from "@/presentation/routes/routes";
import { ArrowLeft, Receipt } from "lucide-react";

export default function OrderDetail() {
  const { clientId, orderId } = useParams<{ clientId: string; orderId: string }>();
  const { appUser } = useAuth();
  const { data: order, isLoading } = useBuyOrder(appUser?.uid, clientId, orderId);
  const createInvoice = useCreateInvoiceFromOrder(appUser?.uid);

  const [billingNumber, setBillingNumber] = useState("");
  const [open, setOpen] = useState(false);

  const normalizedBillingNumber = billingNumber.trim();
  const duplicateInvoiceQuery = useQuery({
    queryKey: ["invoiceByNumber", appUser?.uid, normalizedBillingNumber],
    queryFn: () => invoiceUseCase.getInvoiceByBillingNumber(appUser!.uid, normalizedBillingNumber),
    enabled: !!appUser?.uid && normalizedBillingNumber.length > 0,
    staleTime: 0,
  });

  const duplicateInvoice = duplicateInvoiceQuery.data;
  const hasDuplicateInvoice = !!duplicateInvoice;

  const total = useMemo(() => (order ? buyOrderUseCase.calculateTotal(order) : 0), [order]);

  if (isLoading) return <LoadingState className="min-h-[60vh]" />;
  if (!order) return <p className="text-muted-foreground">Pedido no encontrado.</p>;

  const handleCreateInvoice = async () => {
    const value = billingNumber.trim();
    if (!value) return;
    if (hasDuplicateInvoice) return;
    await createInvoice.mutateAsync({ clientId: clientId!, orderId: orderId!, billingNumber: value });
    setOpen(false);
    setBillingNumber("");
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <Link to={clientDetailPath(clientId!)} className="mb-1 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-3.5 w-3.5" /> Cliente
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">Pedido {order.order}</h1>
          <p className="text-sm text-muted-foreground">{order.client} · {order.factory} · {order.branch}</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button><Receipt className="h-4 w-4" />Facturar pedido</Button>} />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Generar factura</DialogTitle>
            </DialogHeader>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Número de factura</label>
              <Input value={billingNumber} onChange={(e) => setBillingNumber(e.target.value)} />
              {hasDuplicateInvoice && (
                <p className="text-xs font-medium text-destructive">
                  Este número ya existe en la base de datos y no se puede pisar.
                </p>
              )}
            </div>
            <DialogFooter>
              <Button onClick={handleCreateInvoice} disabled={hasDuplicateInvoice} loading={createInvoice.isPending}>
                {createInvoice.isPending ? "Generando..." : "Generar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="border-border/50 shadow-sm">
          <CardContent className="p-4">
            <p className="text-sm font-medium text-muted-foreground">Total estimado</p>
            <p className="text-2xl font-bold tracking-tight tabular-nums">{formatMoney(total)}</p>
          </CardContent>
        </Card>
        <Card className="border-border/50 shadow-sm">
          <CardContent className="p-4">
            <p className="text-sm font-medium text-muted-foreground">Condición de pago</p>
            <p className="text-lg font-semibold">{order.paymentCondition || "-"}</p>
          </CardContent>
        </Card>
        <Card className="border-border/50 shadow-sm">
          <CardContent className="p-4">
            <p className="text-sm font-medium text-muted-foreground">Entrega</p>
            <p className="text-lg font-semibold">{formatDate(order.deliveryDate)}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Artículos</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Artículo</TableHead>
                <TableHead>Color</TableHead>
                <TableHead>Pares</TableHead>
                <TableHead>Entregados</TableHead>
                <TableHead>Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {order.articles.map((art, idx) => (
                <TableRow key={idx}>
                  <TableCell>{art.name}</TableCell>
                  <TableCell>{art.color}</TableCell>
                  <TableCell className="tabular-nums">{art.pairs}</TableCell>
                  <TableCell className="tabular-nums">{art.delivered}</TableCell>
                  <TableCell className="tabular-nums">{formatMoney(art.value ?? 0)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
