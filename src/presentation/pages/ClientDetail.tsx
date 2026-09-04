import { Link, useParams } from "react-router-dom";
import { useAuth } from "@/presentation/contexts/AuthContext";
import { useClient } from "@/presentation/hooks/useClients";
import { useBuyOrders } from "@/presentation/hooks/useBuyOrders";
import { LoadingState } from "@/presentation/components/shared/LoadingState";
import { EmptyState } from "@/presentation/components/shared/EmptyState";
import { Card, CardContent, CardHeader, CardTitle } from "@/presentation/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/presentation/components/ui/table";
import { buttonVariants } from "@/presentation/components/ui/button";
import { cn, formatDate } from "@/lib/utils";
import { orderDetailPath, createOrderPath } from "@/presentation/routes/routes";
import { ArrowLeft, PackagePlus, ShoppingBag } from "lucide-react";

export default function ClientDetail() {
  const { clientId } = useParams<{ clientId: string }>();
  const { appUser } = useAuth();
  const { data: client, isLoading: loadingClient } = useClient(appUser?.uid, clientId);
  const { data: orders, isLoading: loadingOrders } = useBuyOrders(appUser?.uid, clientId);

  if (loadingClient) return <LoadingState className="min-h-[60vh]" />;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <Link to="/clients" className="mb-1 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-3.5 w-3.5" /> Clientes
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">{client?.clientName ?? "Cliente"}</h1>
          <p className="text-sm text-muted-foreground">ID: {clientId}</p>
        </div>
        <Link to={createOrderPath(clientId!)} className={cn(buttonVariants())}>
          <PackagePlus className="h-4 w-4" />
          Nuevo pedido
        </Link>
      </div>

      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Pedidos de compra</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingOrders ? (
            <LoadingState />
          ) : !orders?.length ? (
            <EmptyState icon={ShoppingBag} title="Sin pedidos" description="Este cliente todavía no tiene pedidos cargados." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pedido</TableHead>
                  <TableHead>Fábrica</TableHead>
                  <TableHead>Marca</TableHead>
                  <TableHead>Entrega</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>
                      <Link to={orderDetailPath(clientId!, order.id)} className="font-medium hover:underline">
                        {order.order}
                      </Link>
                    </TableCell>
                    <TableCell>{order.factory}</TableCell>
                    <TableCell>{order.branch}</TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(order.deliveryDate)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
