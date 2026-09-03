import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useUserProfile } from "../hooks/useUser";
import { ROUTES } from "../routes/routes";
import { PageShell, PageHeader, DataState } from "../components/shared";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { CalendarClock, LogOut, ShieldAlert } from "lucide-react";
import { toFormattedDate } from "@/domain/entities/formatters";

export default function Subscription() {
  const { logout } = useAuth();
  const { data: profile, isLoading, error } = useUserProfile();

  return (
    <PageShell maxWidth="narrow">
      <PageHeader
        title="Suscripción requerida"
        description="El acceso a los módulos operativos está suspendido."
        icon={ShieldAlert}
      />

      <DataState isLoading={isLoading} error={error}>
        <Card className="border-border/50 shadow-sm bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarClock className="h-5 w-5 text-muted-foreground" />
              Estado de la cuenta
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <p className="text-muted-foreground">
              Tu suscripción no está activa. Renueva el acceso para continuar gestionando clientes, pedidos y facturas.
            </p>
            <div className="flex items-center justify-between border-t border-border/40 pt-4">
              <span className="text-muted-foreground">Vencimiento registrado</span>
              <span className="font-medium">{toFormattedDate(profile?.subscriptionExpiresAt ?? 0)}</span>
            </div>
            <div className="flex flex-wrap gap-2 pt-2">
              <Link to={ROUTES.PROFILE}>
                <Button variant="outline">Ver perfil</Button>
              </Link>
              <Button variant="ghost" onClick={() => void logout()}>
                <LogOut className="mr-2 h-4 w-4" />
                Cerrar sesión
              </Button>
            </div>
          </CardContent>
        </Card>
      </DataState>
    </PageShell>
  );
}
