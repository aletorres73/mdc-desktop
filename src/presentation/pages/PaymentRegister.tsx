import { useState } from "react";
import { useAuth } from "@/presentation/contexts/AuthContext";
import { usePaymentRegister, useReconcileMovement, useDeleteMovement } from "@/presentation/hooks/usePaymentRegister";
import { Input } from "@/presentation/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/presentation/components/ui/table";
import { Badge } from "@/presentation/components/ui/badge";
import { Button } from "@/presentation/components/ui/button";
import { LoadingState } from "@/presentation/components/shared/LoadingState";
import { EmptyState } from "@/presentation/components/shared/EmptyState";
import { formatMoney, formatDate } from "@/lib/utils";
import { Wallet, CheckCircle2, Trash2, Search } from "lucide-react";

export default function PaymentRegister() {
  const { appUser } = useAuth();
  const [clientId, setClientId] = useState("");
  const [branch, setBranch] = useState("");

  const { data: movements, isLoading } = usePaymentRegister(appUser?.uid, {
    clientId: clientId || undefined,
    branch: branch || undefined,
  });
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

      {isLoading ? (
        <LoadingState />
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
                  <Badge variant={m.status === "IMPUTADO" ? "success" : "muted"}>
                    {m.status === "IMPUTADO" ? "Conciliado" : "Pendiente"}
                  </Badge>
                </TableCell>
                <TableCell className="flex gap-1">
                  {m.status !== "IMPUTADO" && (
                    <Button variant="ghost" size="icon" aria-label="Conciliar" onClick={() => reconcile.mutate(m.id)}>
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" aria-label="Eliminar" onClick={() => remove.mutate(m.id)}>
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
