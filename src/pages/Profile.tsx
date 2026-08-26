import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useUserProfile } from "@/hooks/useUser";
import { useAuth } from "@/contexts/AuthContext";
import { AlertCircle, UserRound } from "lucide-react";

function formatDate(timestamp: number) {
  if (!timestamp) return "No informado";
  return new Date(timestamp).toLocaleDateString("es-AR");
}

export default function Profile() {
  const { user } = useAuth();
  const { data: profile, isLoading, error } = useUserProfile();
  const isActive = profile?.isManuallyEnabled || (profile?.subscriptionExpiresAt ?? 0) > Date.now();

  return (
    <div className="min-h-svh w-full min-w-0 bg-background p-4 sm:p-6">
        <div className="mx-auto max-w-4xl space-y-6">
          <header className="flex items-center gap-3">
            <UserRound className="h-7 w-7 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">Perfil</h1>
              <p className="text-muted-foreground">Cuenta y estado de suscripción</p>
            </div>
          </header>

          {isLoading ? <Skeleton className="h-48 w-full" /> : error ? (
            <Card><CardContent className="flex items-center gap-3 p-6 text-destructive"><AlertCircle className="h-5 w-5" />Error al cargar el perfil: {error.message}</CardContent></Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader><CardTitle>Datos de cuenta</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  <p><span className="text-muted-foreground">Nombre:</span> {[profile?.name, profile?.lastName].filter(Boolean).join(" ") || user?.displayName || "Sin informar"}</p>
                  <p><span className="text-muted-foreground">Correo:</span> {profile?.email || user?.email || "Sin informar"}</p>
                  <p><span className="text-muted-foreground">Usuario:</span> {profile?.uid || user?.uid}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>Suscripción</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  <p className={isActive ? "text-green-600" : "text-destructive"}>{isActive ? "Activa" : "Inactiva"}</p>
                  <p><span className="text-muted-foreground">Vencimiento:</span> {formatDate(profile?.subscriptionExpiresAt ?? 0)}</p>
                  {profile?.isManuallyEnabled && <p className="text-sm text-muted-foreground">Habilitación manual</p>}
                </CardContent>
              </Card>
              <Card className="md:col-span-2">
                <CardHeader><CardTitle>Historial de pagos</CardTitle></CardHeader>
                <CardContent>
                  {!profile?.paymentHistory?.length ? <p className="text-muted-foreground">No hay pagos registrados</p> : (
                    <div className="space-y-2">
                      {profile.paymentHistory.map((payment) => (
                        <div key={`${payment.paymentId}-${payment.date}`} className="flex flex-wrap justify-between gap-2 border-b pb-2 last:border-0">
                          <span>{formatDate(payment.date)} · {payment.status}</span>
                          <span className="font-medium">{payment.amount}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
    </div>
  );
}
