import { useAuth } from "@/presentation/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/presentation/components/ui/card";
import { Badge } from "@/presentation/components/ui/badge";
import { Button } from "@/presentation/components/ui/button";
import { formatDate } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/presentation/components/ui/table";
import { EmptyState } from "@/presentation/components/shared/EmptyState";
import { History, UserCircle } from "lucide-react";

export default function Profile() {
  const { userProfile, signOut, isSubscriptionActive } = useAuth();

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Perfil</h1>
          <p className="text-sm text-muted-foreground">Datos de la cuenta y suscripción.</p>
        </div>
        <Button variant="outline" onClick={() => signOut()}>
          Cerrar sesión
        </Button>
      </div>

      <Card className="border-border/50 shadow-sm">
        <CardHeader className="flex-row items-center gap-4 space-y-0">
          <div className="rounded-full bg-primary/10 p-3 text-primary">
            <UserCircle className="h-6 w-6" />
          </div>
          <div>
            <CardTitle>
              {userProfile?.name} {userProfile?.lastName}
            </CardTitle>
            <p className="text-sm text-muted-foreground">{userProfile?.email}</p>
          </div>
        </CardHeader>
        <CardContent className="flex items-center gap-3">
          <Badge variant={isSubscriptionActive ? "success" : "destructive"}>
            {isSubscriptionActive ? "Suscripción activa" : "Suscripción vencida"}
          </Badge>
          <span className="text-sm text-muted-foreground">
            Vence: {formatDate(userProfile?.subscriptionExpiresAt ?? 0)}
          </span>
        </CardContent>
      </Card>

      <Card className="border-border/50 shadow-sm">
        <CardHeader className="flex-row items-center gap-2 space-y-0">
          <History className="h-4 w-4 text-muted-foreground" />
          <CardTitle className="text-base">Historial de pagos</CardTitle>
        </CardHeader>
        <CardContent>
          {!userProfile?.paymentHistory?.length ? (
            <EmptyState icon={History} title="Sin pagos registrados" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {userProfile.paymentHistory.map((p, idx) => (
                  <TableRow key={idx}>
                    <TableCell>{formatDate(p.date)}</TableCell>
                    <TableCell>${p.amount.toLocaleString("es-AR")}</TableCell>
                    <TableCell>
                      <Badge variant={p.status === "APROBADO" ? "success" : "muted"}>{p.status}</Badge>
                    </TableCell>
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
