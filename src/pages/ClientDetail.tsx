import { Link, useParams } from "react-router-dom";
import { useClient } from "@/hooks/useClients";
import { useBuyOrders } from "@/hooks/useOrders";
import { useInvoices } from "@/hooks/useInvoices";
import { ROUTES, invoiceDetailRoute, orderDetailRoute } from "@/types/routes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  AlertCircle, ArrowLeft, ClipboardList, FileText, 
  Wallet, User, Building2, MapPin, Phone, Mail, Plus
} from "lucide-react";

// Helpers
const money = (value: number) => value.toLocaleString("es-AR", { style: "currency", currency: "ARS" });
const date = (value: number) => value ? new Date(value).toLocaleDateString("es-AR") : "Sin fecha";
const valueOrEmpty = (value?: string) => value || "No informado";

export default function ClientDetail() {
  const { clientId } = useParams<{ clientId: string }>();
  
  // Queries
  const clientQuery = useClient(clientId ?? null);
  const ordersQuery = useBuyOrders(clientId ?? null);
  const invoicesQuery = useInvoices({ state: "Todas", client: clientQuery.data?.clientName ?? "", number: "" });
  
  // Data processing
  const invoices = invoicesQuery.data?.pages.flatMap((page) => page.items) ?? [];
  const balance = invoices.reduce((sum, invoice) => sum + invoice.rest, 0);
  const paid = invoices.reduce((sum, invoice) => sum + invoice.payed, 0);
  const overdue = invoices
    .filter((invoice) => invoice.rest > 0 && invoice.payDate > 0 && invoice.payDate < Date.now())
    .reduce((sum, invoice) => sum + invoice.rest, 0);

  // Loading State
  if (clientQuery.isLoading) {
    return (
      <div className="min-h-full w-full bg-muted/20 p-6 md:p-8">
        <div className="mx-auto w-full max-w-6xl space-y-6">
          <Skeleton className="h-16 w-1/3 rounded-xl" />
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-28 w-full rounded-xl" />)}
          </div>
          <Skeleton className="h-[400px] w-full rounded-xl" />
        </div>
      </div>
    );
  }

  // Error State
  if (clientQuery.error || !clientQuery.data) {
    return (
      <div className="flex min-h-[50vh] w-full items-center justify-center p-6">
        <div className="text-center">
          <AlertCircle className="mx-auto h-10 w-10 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold">Cliente no encontrado</h2>
          <p className="text-muted-foreground mt-2">No se pudo cargar la información operativa.</p>
          <Link to={ROUTES.CLIENTS} className="mt-6 inline-flex text-primary hover:underline">
            Volver al listado
          </Link>
        </div>
      </div>
    );
  }

  const client = clientQuery.data;

  return (
    // 1. Fondo sutil (bg-muted/30) para separar la app de las tarjetas blancas
    <div className="min-h-full w-full bg-muted/30 p-4 md:p-8">
      {/* 2. max-w-6xl para un centrado más compacto y legible en desktop */}
      <div className="mx-auto w-full max-w-6xl space-y-8">
        
        {/* Header de la vista */}
        <header className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex items-start gap-4">
            <Link 
              to={ROUTES.CLIENTS} 
              className="mt-1 flex h-8 w-8 items-center justify-center rounded-full border border-border/50 bg-card shadow-sm transition-colors hover:bg-accent"
            >
              <ArrowLeft className="h-4 w-4 text-muted-foreground" />
            </Link>
            <div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Link to={ROUTES.CLIENTS} className="hover:text-foreground transition-colors">Clientes</Link>
                <span>/</span>
                <span>Ficha operativa</span>
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">{client.clientName}</h1>
              <p className="text-sm font-medium text-muted-foreground mt-1">ID: {client.clientId} • CUIT: {client.cuit || "N/A"}</p>
            </div>
          </div>
          <Link 
            to={ROUTES.CREATE_ORDER} 
            className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-5 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 transition-all"
          >
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Pedido
          </Link>
        </header>

        {/* Tarjetas KPI (Indicadores Clave) */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { 
              label: "Total Pedidos", value: ordersQuery.data?.length ?? 0, 
              icon: ClipboardList, colorClass: "text-blue-600", bgClass: "bg-blue-600/10" 
            },
            { 
              label: "Total Facturas", value: invoices.length, 
              icon: FileText, colorClass: "text-indigo-600", bgClass: "bg-indigo-600/10" 
            },
            { 
              label: "Saldo Pendiente", value: money(balance), 
              icon: Wallet, colorClass: balance > 0 ? "text-amber-600" : "text-emerald-600", bgClass: balance > 0 ? "bg-amber-600/10" : "bg-emerald-600/10" 
            },
            { 
              label: "Monto Vencido", value: money(overdue), 
              icon: AlertCircle, colorClass: overdue > 0 ? "text-destructive" : "text-muted-foreground", bgClass: overdue > 0 ? "bg-destructive/10" : "bg-muted" 
            }
          ].map((item) => (
            // Eliminamos border y usamos shadow-sm para un look más limpio
            <Card key={item.label} className="border-border/50 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-full ${item.bgClass}`}>
                    <item.icon className={`h-6 w-6 ${item.colorClass}`} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{item.label}</p>
                    <p className="text-2xl font-bold tracking-tight">{item.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabs Modernos */}
        <Tabs defaultValue="summary" className="w-full">
          {/* Fondo sutil para la botonera de tabs */}
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
            <Card className="border-border/50 shadow-sm">
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
            <Card className="border-border/50 shadow-sm overflow-hidden">
              <CardContent className="p-0">
                {ordersQuery.isLoading ? (
                  <div className="p-8"><Skeleton className="h-32 w-full" /></div>
                ) : ordersQuery.data?.length ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50">
                        <tr className="border-border/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
                          <th className="px-6 py-4 font-semibold">N° Pedido</th>
                          <th className="px-6 py-4 font-semibold">Fábrica</th>
                          <th className="px-6 py-4 font-semibold">Marca</th>
                          <th className="px-6 py-4 font-semibold text-center">Artículos</th>
                          <th className="px-6 py-4 font-semibold">Fecha Carga</th>
                          <th className="px-6 py-4 font-semibold">Fecha Entrega</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/50">
                        {ordersQuery.data.map((order) => (
                          <tr key={order.id} className="border-border/50 transition-colors hover:bg-muted/20">
                            <td className="px-6 py-4 font-medium">
                              <Link className="text-primary hover:underline" to={orderDetailRoute(client.clientId, order.id)}>
                                {order.order}
                              </Link>
                            </td>
                            <td className="px-6 py-4">{order.factory}</td>
                            <td className="px-6 py-4">{order.branch}</td>
                            <td className="px-6 py-4 text-center">
                              <span className="bg-muted px-2.5 py-1 rounded-md text-xs font-medium">{order.articles.length}</span>
                            </td>
                            <td className="px-6 py-4 text-muted-foreground">{date(order.loadedDate)}</td>
                            <td className="px-6 py-4 text-muted-foreground">{date(order.deliveryDate)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-12 text-center text-muted-foreground">No hay pedidos registrados.</div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="invoices">
            <Card className="border-border/50 shadow-sm overflow-hidden">
              <CardContent className="p-0">
                {invoicesQuery.isLoading ? (
                  <div className="p-8"><Skeleton className="h-32 w-full" /></div>
                ) : invoices.length ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50">
                        <tr className="border-border/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
                          <th className="px-6 py-4 font-semibold">Emisión</th>
                          <th className="px-6 py-4 font-semibold">Número</th>
                          <th className="px-6 py-4 font-semibold">Marca</th>
                          <th className="px-6 py-4 font-semibold text-right">Total</th>
                          <th className="px-6 py-4 font-semibold text-right">Pagado</th>
                          <th className="px-6 py-4 font-semibold text-right">Saldo</th>
                          <th className="px-6 py-4 font-semibold text-center">Estado</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/50">
                        {invoices.map((invoice) => (
                          <tr key={invoice.billingNumber} className="border-border/50 transition-colors hover:bg-muted/20">
                            <td className="px-6 py-4 text-muted-foreground">{date(invoice.loadDate)}</td>
                            <td className="px-6 py-4 font-medium">
                              <Link className="text-primary hover:underline" to={invoiceDetailRoute(invoice.billingNumber)}>
                                {invoice.billingNumber}
                              </Link>
                            </td>
                            <td className="px-6 py-4">{invoice.brand}</td>
                            <td className="px-6 py-4 text-right">{money(invoice.total)}</td>
                            <td className="px-6 py-4 text-right text-emerald-600">{money(invoice.payed)}</td>
                            <td className="px-6 py-4 text-right font-semibold">{money(invoice.rest)}</td>
                            <td className="px-6 py-4 text-center">
                              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                invoice.rest > 0 ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
                              }`}>
                                {invoice.stateBilling || (invoice.rest > 0 ? "Pendiente" : "Pagado")}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-12 text-center text-muted-foreground">No hay facturas registradas.</div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="account">
            <Card className="border-border/50 shadow-sm">
              <CardHeader className="border-b border-border/50 bg-muted/20 pb-6">
                <CardTitle className="text-lg">Balance General</CardTitle>
                <p className="text-sm text-muted-foreground">Resumen de cuenta corriente documental histórica.</p>
              </CardHeader>
              <CardContent className="p-8">
                <div className="grid gap-8 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-border/50">
                  <div className="space-y-2 sm:pr-8">
                    <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Facturado</p>
                    <p className="text-3xl font-bold tracking-tight">{money(invoices.reduce((sum, invoice) => sum + invoice.total, 0))}</p>
                  </div>
                  <div className="space-y-2 pt-6 sm:pt-0 sm:px-8">
                    <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Pagado</p>
                    <p className="text-3xl font-bold tracking-tight text-emerald-600">{money(paid)}</p>
                  </div>
                  <div className="space-y-2 pt-6 sm:pt-0 sm:pl-8">
                    <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Deuda Pendiente</p>
                    <p className={`text-3xl font-bold tracking-tight ${balance > 0 ? 'text-destructive' : 'text-emerald-600'}`}>{money(balance)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}