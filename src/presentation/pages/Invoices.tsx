import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/presentation/contexts/AuthContext";
import { useInvoicesPage } from "@/presentation/hooks/useInvoices";
import { Input } from "@/presentation/components/ui/input";
import { Select } from "@/presentation/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/presentation/components/ui/table";
import { Badge, stateToBadgeVariant } from "@/presentation/components/ui/badge";
import { Button } from "@/presentation/components/ui/button";
import { LoadingState } from "@/presentation/components/shared/LoadingState";
import { EmptyState } from "@/presentation/components/shared/EmptyState";
import { formatMoney, formatDate } from "@/lib/utils";
import { invoiceDetailPath } from "@/presentation/routes/routes";
import { Receipt, Search } from "lucide-react";

const STATE_OPTIONS = [
  { value: "Pendiente", label: "Pendiente" },
  { value: "Vencido", label: "Vencido" },
  { value: "Por vencer", label: "Por vencer" },
  { value: "Cobrado", label: "Cobrado" },
];

export default function Invoices() {
  const { appUser } = useAuth();
  const [clientSearch, setClientSearch] = useState("");
  const [state, setState] = useState("");
  const [cursor, setCursor] = useState<string | null>(null);

  const filters = { clientNamePrefix: clientSearch || undefined, state: state || undefined };
  const { data: page, isLoading } = useInvoicesPage(appUser?.uid, filters, 20, cursor);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Facturas</h1>
        <p className="text-sm text-muted-foreground">Explorador global de facturación.</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative w-56">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por razón social..."
            className="pl-9"
            value={clientSearch}
            onChange={(e) => {
              setClientSearch(e.target.value);
              setCursor(null);
            }}
          />
        </div>
        <Select
          className="w-48"
          placeholder="Estado"
          options={STATE_OPTIONS}
          value={state}
          onChange={(e) => {
            setState(e.target.value);
            setCursor(null);
          }}
        />
      </div>

      {isLoading ? (
        <LoadingState />
      ) : !page?.items.length ? (
        <EmptyState icon={Receipt} title="Sin facturas" description="No hay facturas para los filtros aplicados." />
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Marca</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Saldo</TableHead>
                <TableHead>Vencimiento</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {page.items.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell>
                    <Link to={invoiceDetailPath(invoice.id!)} className="font-medium hover:underline">
                      {invoice.billingNumber}
                    </Link>
                  </TableCell>
                  <TableCell className="max-w-[180px] truncate">{invoice.clientName}</TableCell>
                  <TableCell>{invoice.brand}</TableCell>
                  <TableCell className="tabular-nums">{formatMoney(invoice.total)}</TableCell>
                  <TableCell className="tabular-nums">{formatMoney(invoice.rest)}</TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(invoice.payDate)}</TableCell>
                  <TableCell>
                    <Badge variant={stateToBadgeVariant(invoice.stateBilling)}>{invoice.stateBilling}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="flex justify-end">
            <Button
              variant="outline"
              disabled={page.endReached}
              onClick={() => setCursor(page.nextCursor)}
            >
              Cargar más
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
