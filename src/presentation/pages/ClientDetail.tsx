import { Link, useParams } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "@/presentation/contexts/AuthContext";
import { useClient, useUpdateClient } from "@/presentation/hooks/useClients";
import { useBuyOrders } from "@/presentation/hooks/useBuyOrders";
import { useInvoicesPage } from "@/presentation/hooks/useInvoices";
import { LoadingState } from "@/presentation/components/shared/LoadingState";
import { EmptyState } from "@/presentation/components/shared/EmptyState";
import { Card, CardContent, CardHeader, CardTitle } from "@/presentation/components/ui/card";
import { Button } from "@/presentation/components/ui/button";
import { Input } from "@/presentation/components/ui/input";
import { Label } from "@/presentation/components/ui/label";
import { Select } from "@/presentation/components/ui/select";
import { Badge, stateToBadgeVariant } from "@/presentation/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/presentation/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/presentation/components/ui/tabs";
import { buttonVariants } from "@/presentation/components/ui/button";
import { cn, formatDate, formatMoney } from "@/lib/utils";
import { invoiceDetailPath, orderDetailPath, createOrderPath } from "@/presentation/routes/routes";
import { ArrowLeft, FileText, PackagePlus, Pencil, Save, ShoppingBag, X } from "lucide-react";

export default function ClientDetail() {
  const { clientId } = useParams<{ clientId: string }>();
  const { appUser } = useAuth();
  const { data: client, isLoading: loadingClient } = useClient(appUser?.uid, clientId);
  const { data: orders, isLoading: loadingOrders } = useBuyOrders(appUser?.uid, clientId);
  const { data: invoicePage, isLoading: loadingInvoices, isError: invoicesError } = useInvoicesPage(
    appUser?.uid,
    { clientId },
    500,
  );
  const updateClient = useUpdateClient(appUser?.uid);
  const [editing, setEditing] = useState(false);
  const [clientName, setClientName] = useState("");
  const [error, setError] = useState("");
  const [brandFilter, setBrandFilter] = useState("");
  const [branchFilter, setBranchFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  if (loadingClient) return <LoadingState className="min-h-[60vh]" />;
  if (!client || !clientId) return <p className="text-muted-foreground">Cliente no encontrado.</p>;

  const invoices = invoicePage?.items ?? [];
  const brandOptions = Array.from(new Set(invoices.map((invoice) => invoice.brand).filter(Boolean))).map((value) => ({ value, label: value }));
  const branchOptions = Array.from(new Set(invoices.map((invoice) => invoice.branch).filter(Boolean))).map((value) => ({ value, label: value }));
  const typeOptions = Array.from(new Set(invoices.map((invoice) => invoice.type).filter(Boolean))).map((value) => ({ value, label: value }));
  const filteredInvoices = invoices.filter((invoice) =>
    (!brandFilter || invoice.brand === brandFilter) &&
    (!branchFilter || invoice.branch === branchFilter) &&
    (!typeFilter || invoice.type === typeFilter),
  );
  const billed = invoices.reduce((sum, invoice) => sum + invoice.toPay, 0);
  const paid = invoices.reduce((sum, invoice) => sum + invoice.payed, 0);
  const balance = invoices.reduce((sum, invoice) => sum + invoice.rest, 0);

  const startEditing = () => {
    setClientName(client.clientName);
    setError("");
    setEditing(true);
  };

  const cancelEditing = () => {
    setError("");
    setEditing(false);
  };

  const saveClient = async () => {
    const nextName = clientName.trim();
    if (!nextName) {
      setError("Ingresá la razón social del cliente.");
      return;
    }
    try {
      setError("");
      await updateClient.mutateAsync({ clientId, data: { clientName: nextName } });
      setEditing(false);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "No se pudo actualizar el cliente.");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <Link to="/clients" className="mb-1 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-3.5 w-3.5" /> Clientes
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">{client.clientName}</h1>
          <p className="text-sm text-muted-foreground">ID: {clientId}</p>
        </div>
        <Link to={createOrderPath(clientId)} className={cn(buttonVariants())}>
          <PackagePlus className="h-4 w-4" />
          Nuevo pedido
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { label: "Facturado", value: formatMoney(billed) },
          { label: "Cobrado", value: formatMoney(paid) },
          { label: "Saldo pendiente", value: formatMoney(balance), emphasis: true },
        ].map((item) => (
          <Card key={item.label} className={cn("border-border/50 shadow-sm", item.emphasis && "border-amber-500/40 bg-amber-500/[0.04]")}>
            <CardContent className="p-4">
              <p className="text-sm font-medium text-muted-foreground">{item.label}</p>
              <p className={cn("mt-1 text-2xl font-bold tracking-tight tabular-nums", item.emphasis && "text-amber-700 dark:text-amber-400")}>{item.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex w-full flex-col gap-6">
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="flex-row items-start justify-between space-y-0">
            <div>
              <CardTitle className="text-base">Información del cliente</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">Datos principales de la cuenta.</p>
            </div>
            {!editing && <Button variant="ghost" size="icon" aria-label="Editar cliente" onClick={startEditing}><Pencil className="h-4 w-4" /></Button>}
          </CardHeader>
          <CardContent>
            {editing ? (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="client-name">Razón social</Label>
                  <Input id="client-name" value={clientName} onChange={(event) => setClientName(event.target.value)} autoFocus />
                </div>
                {error && <p className="text-sm font-medium text-destructive">{error}</p>}
                <div className="flex gap-2">
                  <Button onClick={saveClient} disabled={updateClient.isPending}><Save className="h-4 w-4" />{updateClient.isPending ? "Guardando..." : "Guardar"}</Button>
                  <Button variant="outline" onClick={cancelEditing} disabled={updateClient.isPending}><X className="h-4 w-4" />Cancelar</Button>
                </div>
              </div>
            ) : (
              <dl className="space-y-4 text-sm">
                <div><dt className="text-muted-foreground">Razón social</dt><dd className="mt-1 font-medium">{client.clientName}</dd></div>
                <div><dt className="text-muted-foreground">Identificador</dt><dd className="mt-1 font-medium tabular-nums">{client.clientId}</dd></div>
              </dl>
            )}
          </CardContent>
        </Card>

        <Tabs defaultValue="orders" className="w-full min-w-0">
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="orders" className="flex-1 gap-2 sm:flex-none"><ShoppingBag className="h-4 w-4" />Pedidos</TabsTrigger>
            <TabsTrigger value="account" className="flex-1 gap-2 sm:flex-none"><FileText className="h-4 w-4" />Cuenta corriente</TabsTrigger>
          </TabsList>

          <TabsContent value="orders">
            <Card className="border-border/50 shadow-sm">
              <CardHeader><CardTitle className="text-base">Pedidos de compra</CardTitle></CardHeader>
              <CardContent>
                {loadingOrders ? <LoadingState /> : !orders?.length ? (
                  <EmptyState icon={ShoppingBag} title="Sin pedidos" description="Este cliente todavía no tiene pedidos cargados." />
                ) : (
                  <Table>
                    <TableHeader><TableRow><TableHead>Pedido</TableHead><TableHead>Fábrica</TableHead><TableHead>Marca</TableHead><TableHead>Entrega</TableHead></TableRow></TableHeader>
                    <TableBody>{orders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell><Link to={orderDetailPath(clientId, order.id)} className="font-medium hover:underline">{order.order}</Link></TableCell>
                        <TableCell>{order.factory}</TableCell><TableCell>{order.branch}</TableCell>
                        <TableCell className="text-muted-foreground">{formatDate(order.deliveryDate)}</TableCell>
                      </TableRow>
                    ))}</TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="account">
            <Card className="border-border/50 shadow-sm">
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <div><CardTitle className="text-base">Cuenta corriente</CardTitle><p className="mt-1 text-sm text-muted-foreground">Facturación, pagos y saldo de este cliente.</p></div>
                <FileText className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {loadingInvoices ? <LoadingState /> : invoicesError ? (
                  <p className="py-10 text-center text-sm text-destructive">No se pudo cargar la cuenta corriente. Revisá la conexión e intentá nuevamente.</p>
                ) : !invoices.length ? (
                  <EmptyState icon={FileText} title="Sin facturas" description="Todavía no hay facturaciones asociadas a este cliente." />
                ) : (
                  <>
                    <div className="mb-4 flex flex-wrap items-end gap-3">
                      <div className="min-w-44 flex-1 space-y-1.5 sm:flex-none">
                        <Label htmlFor="account-brand-filter">Fábrica</Label>
                        <Select id="account-brand-filter" className="w-full sm:w-44" placeholder="Todas" options={brandOptions} value={brandFilter} onChange={(event) => setBrandFilter(event.target.value)} />
                      </div>
                      <div className="min-w-44 flex-1 space-y-1.5 sm:flex-none">
                        <Label htmlFor="account-branch-filter">Segmento</Label>
                        <Select id="account-branch-filter" className="w-full sm:w-44" placeholder="Todos" options={branchOptions} value={branchFilter} onChange={(event) => setBranchFilter(event.target.value)} />
                      </div>
                      <div className="min-w-44 flex-1 space-y-1.5 sm:flex-none">
                        <Label htmlFor="account-type-filter">Tipo</Label>
                        <Select id="account-type-filter" className="w-full sm:w-44" placeholder="Todos" options={typeOptions} value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)} />
                      </div>
                      {(brandFilter || branchFilter || typeFilter) && (
                        <Button variant="ghost" onClick={() => { setBrandFilter(""); setBranchFilter(""); setTypeFilter(""); }}>Limpiar filtros</Button>
                      )}
                    </div>
                    {!filteredInvoices.length ? (
                      <EmptyState icon={FileText} title="Sin resultados" description="No hay facturas que coincidan con los filtros seleccionados." />
                    ) : (
                      <Table>
                        <TableHeader><TableRow><TableHead>Factura</TableHead><TableHead>Datos</TableHead><TableHead>Fecha</TableHead><TableHead>Vencimiento</TableHead><TableHead>Estado</TableHead><TableHead className="text-right">Saldo</TableHead></TableRow></TableHeader>
                        <TableBody>{filteredInvoices.map((invoice) => (
                          <TableRow key={invoice.id}>
                            <TableCell><Link to={invoiceDetailPath(invoice.id!)} className="font-medium hover:underline">{invoice.billingNumber}</Link></TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1.5">
                                <Badge variant="default">Marca: {invoice.brand}</Badge>
                                {invoice.branch && <Badge variant="muted">Segmento: {invoice.branch}</Badge>}
                                <Badge variant="info">{invoice.type}</Badge>
                              </div>
                            </TableCell>
                            <TableCell className="text-muted-foreground">{formatDate(invoice.loadDate)}</TableCell>
                            <TableCell className="text-muted-foreground">{formatDate(invoice.payDate)}</TableCell>
                            <TableCell><Badge variant={stateToBadgeVariant(invoice.stateBilling)}>{invoice.stateBilling}</Badge></TableCell>
                            <TableCell className="text-right font-medium tabular-nums">{formatMoney(invoice.rest)}</TableCell>
                          </TableRow>
                        ))}</TableBody>
                      </Table>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
