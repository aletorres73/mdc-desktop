import { useNavigate } from "react-router-dom";
import { useAuth } from "@/presentation/contexts/AuthContext";
import { Button } from "@/presentation/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/presentation/components/ui/card";
import { ROUTES } from "@/presentation/routes/routes";
import { formatDate } from "@/lib/utils";
import { ShieldAlert } from "lucide-react";

export default function Subscription() {
  const { userProfile, signOut, isSubscriptionActive } = useAuth();
  const navigate = useNavigate();

  if (isSubscriptionActive) {
    navigate(ROUTES.HOME, { replace: true });
    return null;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md border-border/50 shadow-sm">
        <CardHeader className="items-center text-center">
          <div className="mb-2 rounded-full bg-amber-600/10 p-3 text-amber-600">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <CardTitle>Suscripción vencida</CardTitle>
          <CardDescription>
            Tu acceso venció el {formatDate(userProfile?.subscriptionExpiresAt ?? 0)}. Renová para continuar
            usando MDC.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Button onClick={() => navigate(ROUTES.PROFILE)}>Ver planes y pagos</Button>
          <Button variant="outline" onClick={() => signOut()}>
            Cerrar sesión
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
