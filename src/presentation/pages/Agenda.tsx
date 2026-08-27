import { useOrders } from "../hooks/useOrders";
import type { OrderModel } from "@/domain/entities/order";
import { PageShell, PageHeader, DataState, StatusBadge } from "../components/shared";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays } from "lucide-react";

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
    const dateStr = formatDate(eventDate(order));
    (groups[dateStr] ??= []).push(order);
    return groups;
  }, {});

  return (
    <PageShell>
      <PageHeader
        title="Agenda"
        description="Fechas de entrega, vencimientos y compromisos operativos"
        icon={CalendarDays}
      />

      <DataState
        isLoading={isLoading}
        error={error}
        isEmpty={Object.keys(grouped).length === 0}
        emptyTitle="No hay fechas para mostrar"
        emptyDescription="Registra pedidos con fechas de entrega para poblar tu agenda."
      >
        <div className="space-y-4">
          {Object.entries(grouped).map(([dateStr, dateOrders]) => (
            <Card key={dateStr} className="border-border/50 shadow-sm bg-card">
              <CardHeader className="pb-3 border-b border-border/40">
                <CardTitle className="capitalize text-base font-bold">{dateStr}</CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-3">
                {dateOrders.map((order) => (
                  <div
                    key={order.orderNumber}
                    className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg border border-border/40 bg-background hover:bg-muted/20 transition-colors"
                  >
                    <div>
                      <p className="font-semibold text-sm">Pedido #{order.orderNumber}</p>
                      <p className="text-xs text-muted-foreground">{order.nameClient} • Marca: {order.branch}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={order.trackingState || "Sin despacho"} />
                      <StatusBadge status={order.payState || "Sin estado"} />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </DataState>
    </PageShell>
  );
}
