import { useAuth } from "@/presentation/contexts/AuthContext";
import { useOrders } from "@/presentation/hooks/useOrders";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/presentation/components/ui/table";
import { Badge, stateToBadgeVariant } from "@/presentation/components/ui/badge";
import { LoadingState } from "@/presentation/components/shared/LoadingState";
import { EmptyState } from "@/presentation/components/shared/EmptyState";
import { formatDate } from "@/lib/utils";
import { ClipboardList } from "lucide-react";

export default function Orders() {
  const { appUser } = useAuth();
  const { data: orders, isLoading } = useOrders(appUser?.uid);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Órdenes</h1>
        <p className="text-sm text-muted-foreground">Seguimiento de despacho y cobranza consolidados.</p>
      </div>

      {isLoading ? (
        <LoadingState />
      ) : !orders?.length ? (
        <EmptyState icon={ClipboardList} title="Sin órdenes" description="No hay órdenes cargadas." />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>N°</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Marca</TableHead>
              <TableHead>Despacho</TableHead>
              <TableHead>Cobranza</TableHead>
              <TableHead>Vencimiento</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.orderNumber}>
                <TableCell>{order.orderNumber}</TableCell>
                <TableCell className="max-w-[180px] truncate">{order.nameClient}</TableCell>
                <TableCell>{order.branch}</TableCell>
                <TableCell>
                  <Badge variant={stateToBadgeVariant(order.trackingState)}>{order.trackingState}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={stateToBadgeVariant(order.payState)}>{order.payState}</Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">{formatDate(order.payDate)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
