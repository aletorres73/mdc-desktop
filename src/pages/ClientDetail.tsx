import { Link, useParams } from "react-router-dom";
import { useClient } from "@/hooks/useClients";
import { useBuyOrders } from "@/hooks/useOrders";
import { useInvoices } from "@/hooks/useInvoices";
import { ROUTES, invoiceDetailRoute, orderDetailRoute } from "@/types/routes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, ArrowLeft, ClipboardList, FileText, Wallet } from "lucide-react";

function formatDate(timestamp: number) {
  if (!timestamp) return "Sin fecha";
  return new Date(timestamp).toLocaleDateString("es-AR");
}

export default function ClientDetail() {
  const { clientId } = useParams<{ clientId: string }>();
  const clientQuery = useClient(clientId ?? null);
  const ordersQuery = useBuyOrders(clientId ?? null);
  const invoicesQuery = useInvoices({
    state: "Todas",
    client: clientQuery.data?.clientName ?? "",
    number: "",
  });

  const invoices = invoicesQuery.data?.pages.flatMap((page) => page.items) ?? [];
  const balance = invoices.reduce((total, invoice) => total + invoice.rest, 0);
  const paid = invoices.reduce((total, invoice) => total + invoice.payed, 0);

  if (clientQuery.isLoading) {
    return <main className="min-h-svh w-full p-4 sm:p-6"><div className="mx-auto w-full max-w-6xl space-y-6"><Skeleton className="h-10 w-64" /><Skeleton className="h-48 w-full" /></div></main>;
  }

  if (clientQuery.error || !clientQuery.data) {
    return (
      <main className="min-h-svh w-full p-4 sm:p-6">
        <div className="mx-auto max-w-6xl">
          <Card><CardContent className="flex items-center gap-3 p-6 text-destructive"><AlertCircle className="h-5 w-5" />No se pudo cargar el cliente.</CardContent></Card>
        </div>
      </main>
    );
  }

  const client = clientQuery.data;

  return (
    <main className="min-h-svh w-full p-4 sm:p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-wrap items-center gap-4">
          <Link to={ROUTES.CLIENTS} aria-label="Volver a clientes">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{client.clientName}</h1>
            <p className="text-muted-foreground">Cliente {client.clientId}</p>
          </div>
        </header>

        <Tabs defaultValue="summary" className="w-full">
          <TabsList className="grid h-auto w-full grid-cols-2 md:grid-cols-4">
            <TabsTrigger value="summary"><Wallet className="h-4 w-4" />Resumen</TabsTrigger>
            <TabsTrigger value="orders"><ClipboardList className="h-4 w-4" />Pedidos</TabsTrigger>
            <TabsTrigger value="invoices"><FileText className="h-4 w-4" />Facturas</TabsTrigger>
            <TabsTrigger value="account"><Wallet className="h-4 w-4" />Cuenta corriente</TabsTrigger>
          </TabsList>

          <TabsContent value="summary" className="mt-4">
            <div className="grid gap-4 md:grid-cols-3">
              <Card><CardHeader><CardTitle className="text-sm">Razón social</CardTitle></CardHeader><CardContent>{client.clientName}</CardContent></Card>
              <Card><CardHeader><CardTitle className="text-sm">Pedidos</CardTitle></CardHeader><CardContent className="text-2xl font-semibold">{ordersQuery.data?.length ?? 0}</CardContent></Card>
              <Card><CardHeader><CardTitle className="text-sm">Saldo pendiente</CardTitle></CardHeader><CardContent className="text-2xl font-semibold">{balance.toLocaleString("es-AR", { style: "currency", currency: "ARS" })}</CardContent></Card>
            </div>
          </TabsContent>

          <TabsContent value="orders" className="mt-4">
            <Card><CardHeader><CardTitle>Pedidos del cliente ({ordersQuery.data?.length ?? 0})</CardTitle></CardHeader><CardContent>
              {ordersQuery.isLoading ? <Skeleton className="h-20 w-full" /> : ordersQuery.data?.length ? <div className="space-y-3">{ordersQuery.data.map((order) => <Link key={order.id} to={orderDetailRoute(client.clientId, order.id)} className="flex flex-wrap justify-between gap-2 border-b pb-3 last:border-0"><span><strong>Pedido {order.order}</strong><span className="ml-2 text-muted-foreground">{order.factory} · {order.branch}</span></span><span>{formatDate(order.loadedDate)}</span></Link>)}</div> : <p className="text-muted-foreground">No hay pedidos para este cliente.</p>}
            </CardContent></Card>
          </TabsContent>

          <TabsContent value="invoices" className="mt-4">
            <Card><CardHeader><CardTitle>Facturas del cliente ({invoices.length})</CardTitle></CardHeader><CardContent>
              {invoicesQuery.isLoading ? <Skeleton className="h-20 w-full" /> : invoices.length ? <div className="space-y-3">{invoices.map((invoice) => <Link key={invoice.billingNumber} to={invoiceDetailRoute(invoice.billingNumber)} className="flex flex-wrap justify-between gap-2 border-b pb-3 last:border-0"><span><strong>Factura {invoice.billingNumber}</strong><span className="ml-2 text-muted-foreground">{invoice.stateBilling}</span></span><span>{invoice.total.toLocaleString("es-AR", { style: "currency", currency: "ARS" })}</span></Link>)}</div> : <p className="text-muted-foreground">No hay facturas para este cliente.</p>}
            </CardContent></Card>
          </TabsContent>

          <TabsContent value="account" className="mt-4">
            <div className="grid gap-4 md:grid-cols-2"><Card><CardHeader><CardTitle>Total cobrado</CardTitle></CardHeader><CardContent className="text-2xl font-semibold">{paid.toLocaleString("es-AR", { style: "currency", currency: "ARS" })}</CardContent></Card><Card><CardHeader><CardTitle>Saldo pendiente</CardTitle></CardHeader><CardContent className="text-2xl font-semibold">{balance.toLocaleString("es-AR", { style: "currency", currency: "ARS" })}</CardContent></Card></div>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
