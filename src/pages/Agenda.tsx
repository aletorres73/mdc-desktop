import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useOrders } from "@/hooks";
import type { OrderModel } from "@/types/domain";
import { CalendarDays, AlertCircle } from "lucide-react";

function formatDate(timestamp: number) {
  if (!timestamp) return "Sin fecha";
  return new Date(timestamp).toLocaleDateString("es-AR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function eventDate(order: OrderModel) {
  return order.receptionDate || order.inputDate || order.documentDate || order.date;
}

export default function Agenda() {
  const { data: orders, isLoading, error } = useOrders({ factory: "all", search: "" });
  const grouped = (orders ?? []).reduce<Record<string, OrderModel[]>>((groups, order) => {
    const date = formatDate(eventDate(order));
    (groups[date] ??= []).push(order);
    return groups;
  }, {});

  return (
    <div className="min-h-svh w-full min-w-0 bg-background p-4 sm:p-6">
        <div className="mx-auto max-w-5xl space-y-6">
          <header className="flex items-center gap-3">
            <CalendarDays className="h-7 w-7 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">Agenda</h1>
              <p className="text-muted-foreground">Fechas relevantes de tus pedidos</p>
            </div>
          </header>

          {isLoading ? (
            <Card>
              <CardContent className="space-y-4 p-6">
                {[1, 2, 3].map((item) => <Skeleton key={item} className="h-16 w-full" />)}
              </CardContent>
            </Card>
          ) : error ? (
            <Card>
              <CardContent className="flex items-center gap-3 p-6 text-destructive">
                <AlertCircle className="h-5 w-5" />
                Error al cargar la agenda: {error.message}
              </CardContent>
            </Card>
          ) : Object.keys(grouped).length === 0 ? (
            <Card><CardContent className="p-6 text-center text-muted-foreground">No hay fechas para mostrar</CardContent></Card>
          ) : (
            <div className="space-y-4">
              {Object.entries(grouped).map(([date, dateOrders]) => (
                <Card key={date}>
                  <CardHeader><CardTitle className="capitalize">{date}</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    {dateOrders.map((order) => (
                      <div key={order.orderNumber} className="flex flex-wrap items-center justify-between gap-3 border-b pb-3 last:border-0 last:pb-0">
                        <div>
                          <p className="font-medium">Pedido {order.orderNumber}</p>
                          <p className="text-sm text-muted-foreground">{order.nameClient} · {order.branch}</p>
                        </div>
                        <div className="text-right text-sm">
                          <p>{order.trackingState || "Sin despacho"}</p>
                          <p className="text-muted-foreground">Cobranza: {order.payState || "Sin estado"}</p>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
    </div>
  );
}
