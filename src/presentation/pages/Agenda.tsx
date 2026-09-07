import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/presentation/contexts/AuthContext";
import { useInvoicesPage } from "@/presentation/hooks/useInvoices";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/presentation/components/ui/table";
import { Badge, stateToBadgeVariant } from "@/presentation/components/ui/badge";
import { Button } from "@/presentation/components/ui/button";
import { LoadingState } from "@/presentation/components/shared/LoadingState";
import { EmptyState } from "@/presentation/components/shared/EmptyState";
import { formatMoney, formatDate, daysUntil } from "@/lib/utils";
import { invoiceDetailPath } from "@/presentation/routes/routes";
import { CalendarClock } from "lucide-react";

export default function Agenda() {
  const { appUser } = useAuth();
  const { data: page, isLoading } = useInvoicesPage(appUser?.uid, {}, 200);
  const [urgentOnly, setUrgentOnly] = useState(false);

  const items = useMemo(() => {
    const all = (page?.items ?? []).filter((i) => i.rest > 0);
    const sorted = [...all].sort((a, b) => a.payDate - b.payDate);
    return urgentOnly ? sorted.filter((i) => daysUntil(i.payDate) <= 3) : sorted;
  }, [page, urgentOnly]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Agenda de vencimientos</h1>
          <p className="text-sm text-muted-foreground">Calendario de cobros ordenado por urgencia.</p>
        </div>
        <Button variant={urgentOnly ? "default" : "outline"} onClick={() => setUrgentOnly((v) => !v)}>
          Solo urgentes
        </Button>
      </div>

      {isLoading ? (
        <LoadingState />
      ) : !items.length ? (
        <EmptyState icon={CalendarClock} title="Sin vencimientos" description="No hay facturas pendientes de cobro." />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Vencimiento</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Factura</TableHead>
              <TableHead>Saldo</TableHead>
              <TableHead>Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((invoice) => (
              <TableRow key={invoice.id}>
                <TableCell className="text-muted-foreground">{formatDate(invoice.payDate)}</TableCell>
                <TableCell className="max-w-[180px] truncate">{invoice.clientName}</TableCell>
                <TableCell>
                  <Link to={invoiceDetailPath(invoice.id!)} className="font-medium hover:underline">
                    {invoice.billingNumber}
                  </Link>
                </TableCell>
                <TableCell className="tabular-nums">{formatMoney(invoice.rest)}</TableCell>
                <TableCell>
                  <Badge variant={stateToBadgeVariant(invoice.stateBilling)}>{invoice.stateBilling}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
