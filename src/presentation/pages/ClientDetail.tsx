import { Link, useParams } from "react-router-dom";
import { useClient } from "../hooks/useClients";
import { useBuyOrders } from "../hooks/useOrders";
import { useInvoices } from "../hooks/useInvoices";
import { ROUTES, invoiceDetailRoute, orderDetailRoute } from "../routes/routes";
import { PageShell, PageHeader, KpiCard, DataTableShell, DataTableRow, DataTableCell, StatusBadge } from "../components/shared";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { shareText } from "../utils/shareUtils";
import { ReportGenerator } from "@/domain/logic/reportGenerator";
import { toFormattedDate, toPrint } from "@/domain/entities/formatters";
import { 
  AlertCircle, ArrowLeft, ClipboardList, FileText, 
  Wallet, User, Building2, MapPin, Phone, Mail, Plus, Share2
} from "lucide-react";
import { useState } from "react";

const valueOrEmpty = (value?: string) => value || "No informado";

export default function ClientDetail() {
  const { clientId } = useParams<{ clientId: string }>();
  const [copied, setCopied] = useState(false);
  
  const clientQuery = useClient(clientId ?? null);
  const ordersQuery = useBuyOrders(clientId ?? null);
  const invoicesQuery = useInvoices({ state: "Todas", client: clientQuery.data?.clientName ?? "", number: "" });
  
  const invoices = invoicesQuery.data?.pages.flatMap((page) => page.items) ?? [];
  const balance = invoices.reduce((sum, invoice) => sum + invoice.rest, 0);
  const paid = invoices.reduce((sum, invoice) => sum + invoice.payed, 0);
  const overdue = invoices
    .filter((invoice) => invoice.rest > 0 && invoice.payDate > 0 && invoice.payDate < Date.now())
    .reduce((sum, invoice) => sum + invoice.rest, 0);

  const handleShareCurrentAccount = async () => {
    if (!clientQuery.data) return;
    const reportText = ReportGenerator.generateCurrentAccountReport(clientQuery.data.clientName, invoices);
    const success = await shareText(reportText);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (clientQuery.isLoading) {
    return (
      <PageShell>
        <div className="space-y-6">
          <Skeleton className="h-16 w-1/3 rounded-xl" />
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-28 w-full rounded-xl" />)}
          </div>
          <Skeleton className="h-[400px] w-full rounded-xl" />
        </div>
      </PageShell>
    );
  }

  if (clientQuery.error || !clientQuery.data) {
    return (
      <PageShell>
        <div className="flex min-h-[50vh] w-full items-center justify-center p-6">
          <div className="text-center">
            <AlertCircle className="mx-auto h-10 w-10 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold">Cliente no encontrado</h2>
            <p className="text-muted-foreground mt-2">No se pudo cargar la información del cliente.</p>
            <Link to={ROUTES.CLIENTS} className="mt-6 inline-flex text-primary hover:underline">
              Volver al listado
            </Link>
          </div>
        </div>
      </PageShell>
    );
  }

  const client = clientQuery.data;

  return (
    <PageShell maxWidth="default">
      <PageHeader
        title={client.clientName}
        description={`ID: ${client.clientId} • CUIT: ${client.cuit || "N/A"}`}
        actions={
          <div className="flex items-center gap-2">
            <Link to={ROUTES.CLIENTS}>
              <Button variant="outline" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" /> Volver
              </Button>
            </Link>
            <Button variant="outline" size="sm" onClick={handleShareCurrentAccount}>
              <Share2 className="mr-2 h-4 w-4" />
              {copied ? "¡Copiado!" : "Compartir Estado"}
            </Button>
            <Link to={ROUTES.CREATE_ORDER}>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" /> Nuevo Pedido
              </Button>
            </Link>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Total Pedidos"
          value={ordersQuery.data?.length ?? 0}
          icon={ClipboardList}
          tone="info"
        />
        <KpiCard
          label="Total Facturas"
          value={invoices.length}
          icon={FileText}
          tone="primary"
        />
        <KpiCard
          label="Saldo Pendiente"
          value={toPrint(balance)}
          icon={Wallet}
          tone={balance > 0 ? "warning" : "success"}
        />
        <KpiCard
          label="Monto Vencido"
          value={toPrint(overdue)}
          icon={AlertCircle}
          tone={overdue > 0 ? "danger" : "primary"}
        />
      </div>

      <Tabs defaultValue="summary" className="w-full">
        <TabsList className="mb-6 h-12 w-full justify-start gap-6 rounded-none border-b border-border/50 bg-transparent p-0">
          <TabsTrigger value="summary" className="rounded-none px-2 py-3 data-[active]:border-b-2 data-[active]:border-primary data-[active]:shadow-none">
            <User className="mr-2 h-4 w-4" /> Resumen
          </TabsTrigger>
          <TabsTrigger value="orders" className="rounded-none px-2 py-3 data-[active]:border-b-2 data-[active]:border-primary data-[active]:shadow-none">
            <ClipboardList className="mr-2 h-4 w-4" /> Pedidos
          </TabsTrigger>
          <TabsTrigger value="invoices" className="rounded-none px-2 py-3 data-[active]:border-b-2 data-[active]:border-primary data-[active]:shadow-none">
            <FileText className="mr-2 h-4 w-4" /> Facturas
          </TabsTrigger>
          <TabsTrigger value="account" className="rounded-none px-2 py-3 data-[active]:border-b-2 data-[active]:border-primary data-[active]:shadow-none">
            <Wallet className="mr-2 h-4 w-4" /> Cta. Corriente
          </TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="space-y-6">
          <Card className="border-border/50 shadow-sm bg-card">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Building2 className="h-5 w-5 text-muted-foreground" />
                Información Comercial
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { label: "Razón social", value: client.clientName, icon: null },
                { label: "Nombre fantasía", value: client.fantasyName, icon: null },
                { label: "Dirección comercial", value: client.address, icon: MapPin },
                { label: "Localidad", value: client.city, icon: null },
                { label: "Dirección fiscal", value: client.taxAddress, icon: MapPin },
                { label: "Email", value: client.email, icon: Mail },
                { label: "Teléfono", value: client.phone, icon: Phone },
                { label: "Contacto", value: client.contactName, icon: User },
                { label: "Horario de entrega", value: client.deliveryTime, icon: null }
              ].map((item) => (
                <div key={item.label} className="flex flex-col space-y-1">
                  <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    {item.icon && <item.icon className="h-3.5 w-3.5" />}
                    {item.label}
                  </span>
                  <span className="text-sm font-medium text-foreground">
                    {valueOrEmpty(item.value)}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders">
          {ordersQuery.isLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : !ordersQuery.data?.length ? (
            <Card className="border-border/50 shadow-sm bg-card">
              <CardContent className="p-8 text-center text-muted-foreground">
                No hay pedidos registrados para este cliente.
              </CardContent>
            </Card>
          ) : (
            <DataTableShell headers={["N° Pedido", "Fábrica", "Marca", "Artículos", "Fecha Carga", "Fecha Entrega"]}>
              {ordersQuery.data.map((order) => (
                <DataTableRow key={order.id}>
                  <DataTableCell className="font-medium">
                    <Link className="text-primary hover:underline font-mono" to={orderDetailRoute(client.clientId, order.id)}>
                      {order.order}
                    </Link>
                  </DataTableCell>
                  <DataTableCell>{order.factory}</DataTableCell>
                  <DataTableCell>{order.branch}</DataTableCell>
                  <DataTableCell className="text-center">
                    <span className="bg-muted px-2.5 py-1 rounded-md text-xs font-medium">{order.articles.length}</span>
                  </DataTableCell>
                  <DataTableCell className="text-muted-foreground">{toFormattedDate(order.loadedDate)}</DataTableCell>
                  <DataTableCell className="text-muted-foreground">{toFormattedDate(order.deliveryDate)}</DataTableCell>
                </DataTableRow>
              ))}
            </DataTableShell>
          )}
        </TabsContent>

        <TabsContent value="invoices">
          {invoicesQuery.isLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : !invoices.length ? (
            <Card className="border-border/50 shadow-sm bg-card">
              <CardContent className="p-8 text-center text-muted-foreground">
                No hay facturas registradas para este cliente.
              </CardContent>
            </Card>
          ) : (
            <DataTableShell headers={["Emisión", "Número", "Marca", "Total", "Pagado", "Saldo", "Estado"]}>
              {invoices.map((invoice) => (
                <DataTableRow key={invoice.billingNumber}>
                  <DataTableCell className="text-muted-foreground">{toFormattedDate(invoice.loadDate)}</DataTableCell>
                  <DataTableCell className="font-medium">
                    <Link className="text-primary hover:underline font-mono" to={invoiceDetailRoute(invoice.billingNumber)}>
                      {invoice.billingNumber}
                    </Link>
                  </DataTableCell>
                  <DataTableCell>{invoice.brand}</DataTableCell>
                  <DataTableCell className="text-right">{toPrint(invoice.total)}</DataTableCell>
                  <DataTableCell className="text-right text-emerald-600 font-medium">{toPrint(invoice.payed)}</DataTableCell>
                  <DataTableCell className="text-right font-semibold">{toPrint(invoice.rest)}</DataTableCell>
                  <DataTableCell className="text-center">
                    <StatusBadge status={invoice.stateBilling || (invoice.rest > 0 ? "Pendiente" : "Pagado")} />
                  </DataTableCell>
                </DataTableRow>
              ))}
            </DataTableShell>
          )}
        </TabsContent>

        <TabsContent value="account">
          <Card className="border-border/50 shadow-sm bg-card">
            <CardHeader className="border-b border-border/50 bg-muted/20 pb-6">
              <CardTitle className="text-lg">Balance General</CardTitle>
              <p className="text-sm text-muted-foreground">Resumen de cuenta corriente documental histórica.</p>
            </CardHeader>
            <CardContent className="p-8">
              <div className="grid gap-8 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-border/50">
                <div className="space-y-2 sm:pr-8">
                  <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Facturado</p>
                  <p className="text-3xl font-bold tracking-tight">{toPrint(invoices.reduce((sum, i) => sum + i.total, 0))}</p>
                </div>
                <div className="space-y-2 pt-6 sm:pt-0 sm:px-8">
                  <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Pagado</p>
                  <p className="text-3xl font-bold tracking-tight text-emerald-600">{toPrint(paid)}</p>
                </div>
                <div className="space-y-2 pt-6 sm:pt-0 sm:pl-8">
                  <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Deuda Pendiente</p>
                  <p className={`text-3xl font-bold tracking-tight ${balance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>{toPrint(balance)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </PageShell>
  );
}
