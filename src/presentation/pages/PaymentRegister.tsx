import { useState } from "react";
import { AlertCircle, ArrowDownLeft, ClipboardList, RefreshCw } from "lucide-react";
import { PageHeader, PageShell, DataTableCell, DataTableRow, DataTableShell } from "../components/shared";
import { Button } from "../components/ui/button";
import { Skeleton } from "../components/ui/skeleton";
import { toFormattedDate, toPrint } from "@/domain/entities/formatters";
import { useAllClients } from "../hooks/useClients";
import { useFactories } from "../hooks/useFactories";
import { usePaymentRegister } from "../hooks/useInvoices";

const methodLabels: Record<string, string> = {
  PAGO: "Pago", EFECTIVO: "Efectivo", TRANSFERENCIA: "Transferencia", CHEQUE: "Cheque",
  PRONTO_PAGO: "Pronto pago", NOTA_CREDITO: "Nota de crédito", DESCUENTO_EXTRA: "Descuento extra",
};

export default function PaymentRegister() {
  const [clientId, setClientId] = useState("");
  const [branch, setBranch] = useState("");
  const clientsQuery = useAllClients();
  const factoriesQuery = useFactories();
  const paymentsQuery = usePaymentRegister({ clientId: clientId || undefined, branch: branch || undefined });
  const payments = paymentsQuery.data ?? [];

  return (
    <PageShell maxWidth="full">
      <PageHeader
        title="Registro de movimientos"
        description="Pagos y movimientos por cliente y marca"
        icon={ClipboardList}
        actions={
          <Button variant="outline" size="sm" onClick={() => paymentsQuery.refetch()} disabled={paymentsQuery.isFetching}>
            <RefreshCw className="mr-2 h-4 w-4" /> Actualizar
          </Button>
        }
      />

      <div className="grid gap-3 rounded-lg border border-border/50 bg-card p-4 sm:grid-cols-2">
        <label className="space-y-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Cliente
          <select value={clientId} onChange={(event) => setClientId(event.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-normal normal-case tracking-normal text-foreground">
            <option value="">Todos los clientes</option>
            {(clientsQuery.data ?? []).map((client) => <option key={client.clientId} value={client.clientId}>{client.clientName}</option>)}
          </select>
        </label>
        <label className="space-y-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Marca
          <select value={branch} onChange={(event) => setBranch(event.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-normal normal-case tracking-normal text-foreground">
            <option value="">Todas las marcas</option>
            {[...new Set((factoriesQuery.data ?? []).flatMap((factory) => factory.branchList))].sort().map((name) => <option key={name} value={name}>{name}</option>)}
          </select>
        </label>
      </div>

      {paymentsQuery.isLoading ? <Skeleton className="h-64 w-full" /> : paymentsQuery.error ? (
        <div className="flex min-h-48 flex-col items-center justify-center gap-3 rounded-lg border border-destructive/30 bg-card p-6 text-center">
          <AlertCircle className="h-8 w-8 text-destructive" />
          <p className="text-sm text-muted-foreground">No se pudo cargar el registro.</p>
          <Button variant="outline" size="sm" onClick={() => paymentsQuery.refetch()}>Reintentar</Button>
        </div>
      ) : payments.length === 0 ? (
        <div className="flex min-h-48 flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card p-6 text-center">
          <ArrowDownLeft className="mb-3 h-8 w-8 text-muted-foreground" />
          <p className="font-medium">No hay movimientos registrados</p>
          <p className="mt-1 text-sm text-muted-foreground">Los pagos nuevos aparecerán aquí.</p>
        </div>
      ) : (
        <DataTableShell headers={["Fecha", "Cliente", "Marca", "Documento", "Tipo", "Método", "Monto", "Estado"]}>
          {payments.map((payment) => (
            <DataTableRow key={payment.id}>
              <DataTableCell className="whitespace-nowrap text-muted-foreground">{toFormattedDate(payment.date)}</DataTableCell>
              <DataTableCell className="font-medium">{payment.clientName}</DataTableCell>
              <DataTableCell>{payment.branch}</DataTableCell>
              <DataTableCell className="font-mono">{payment.documentNumber}</DataTableCell>
              <DataTableCell>{payment.type}</DataTableCell>
              <DataTableCell>{methodLabels[payment.method] ?? payment.method}</DataTableCell>
              <DataTableCell className="text-right font-semibold tabular-nums">{toPrint(payment.total)}</DataTableCell>
              <DataTableCell><span className="rounded bg-muted px-2 py-1 text-xs font-medium">{payment.status === "PENDIENTE" ? "Pendiente" : "Imputado"}</span></DataTableCell>
            </DataTableRow>
          ))}
        </DataTableShell>
      )}
    </PageShell>
  );
}