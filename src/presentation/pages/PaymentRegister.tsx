import { useState } from "react";
import { useAuth } from "@/presentation/contexts/AuthContext";
import { usePaymentRegister, useReconcileMovement, useDeleteMovement } from "@/presentation/hooks/usePaymentRegister";
import { Input } from "@/presentation/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/presentation/components/ui/table";
import { Badge } from "@/presentation/components/ui/badge";
import { Button } from "@/presentation/components/ui/button";
import { LoadingState } from "@/presentation/components/shared/LoadingState";
import { EmptyState } from "@/presentation/components/shared/EmptyState";
import { ErrorState } from "@/presentation/components/shared/ErrorState";
import { formatMoney, formatDate } from "@/lib/utils";
import { Wallet, CheckCircle2, Trash2, Search } from "lucide-react";

export default function PaymentRegister() {
  const { appUser } = useAuth();
  const [clientId, setClientId] = useState("");
  const [branch, setBranch] = useState("");

  const movementsQuery = usePaymentRegister(appUser?.uid, {
    clientId: clientId || undefined,
    branch: branch || undefined,
  });
  const { data: movements, isLoading } = movementsQuery;
  const reconcile = useReconcileMovement(appUser?.uid);
  const remove = useDeleteMovement(appUser?.uid);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Registro de pagos</h1>
        <p className="text-sm text-muted-foreground">Movimientos y conciliación de cobranzas.</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative w-56">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Cliente ID..." className="pl-9" value={clientId} onChange={(e) => setClientId(e.target.value)} />
        </div>
        <Input placeholder="Marca..." className="w-48" value={branch} onChange={(e) => setBranch(e.target.value)} />
      </div>

      {(reconcile.isError || remove.isError) && (
        <ErrorState message="No se pudo actualizar el movimiento. Intentá nuevamente." />
      )}

      {isLoading ? (
        <LoadingState />
      ) : movementsQuery.isError ? (
        <div className="space-y-3">
          <ErrorState message={movementsQuery.error instanceof Error ? movementsQuery.error.message : "No se pudo cargar el registro de pagos."} />
          <Button variant="outline" onClick={() => void movementsQuery.refetch()}>Reintentar</Button>
        </div>
      ) : !movements?.length ? (
        <EmptyState icon={Wallet} title="Sin movimientos" description="No hay pagos registrados con estos filtros." />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Marca</TableHead>
              <TableHead>Remito</TableHead>
              <TableHead>Método</TableHead>
              <TableHead>Monto</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="w-20" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {movements.map((m) => (
              <TableRow key={m.id}>
                <TableCell className="text-muted-foreground">{formatDate(m.date)}</TableCell>
                <TableCell className="max-w-[160px] truncate">{m.clientName}</TableCell>
                <TableCell>{m.branch}</TableCell>
                <TableCell>{m.documentNumber}</TableCell>
                <TableCell>
                  {m.method}
                  {m.isVirtual && <Badge variant="info" className="ml-2">Virtual</Badge>}
                </TableCell>
                <TableCell className="tabular-nums">{formatMoney(m.total)}</TableCell>
                <TableCell>
                  <Badge variant={m.status === "RECONCILIADO" || m.status === "IMPUTADO" ? "success" : "muted"}>
                    {m.status === "RECONCILIADO" || m.status === "IMPUTADO" ? "Conciliado" : m.status === "COBRADO" ? "Cobrado" : "Pendiente"}
                  </Badge>
                </TableCell>
                <TableCell className="flex gap-1">
                  {m.status !== "IMPUTADO" && m.status !== "RECONCILIADO" && (
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Conciliar"
                      loading={reconcile.isPending && reconcile.variables === m.id}
                      disabled={reconcile.isPending || remove.isPending}
                      onClick={() => reconcile.mutate(m.id)}
                    >
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Eliminar"
                    loading={remove.isPending && remove.variables === m.id}
                    disabled={reconcile.isPending || remove.isPending}
                    onClick={() => remove.mutate(m.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
