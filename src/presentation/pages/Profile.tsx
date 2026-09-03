import { useUserProfile } from "../hooks/useUser";
import { useAuth } from "../contexts/AuthContext";
import { PageShell, PageHeader, KpiCard, DataState, StatusBadge, DataTableShell, DataTableRow, DataTableCell } from "../components/shared";
import { Card, CardContent, CardHeader, CardTitle } from "@/presentation/components/ui/card";
import { UserRound, ShieldCheck, Calendar } from "lucide-react";
import { toFormattedDate, toPrint } from "@/domain/entities/formatters";

export default function Profile() {
  const { user } = useAuth();
  const { data: profile, isLoading, error } = useUserProfile();
  const isActive = profile?.isManuallyEnabled || (profile?.subscriptionExpiresAt ?? 0) > Date.now();

  const fullName = [profile?.name, profile?.lastName].filter(Boolean).join(" ") || user?.displayName || "Sin informar";

  return (
    <PageShell>
      <PageHeader
        title="Mi Perfil"
        description="Información de la cuenta y estado de la suscripción"
        icon={UserRound}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <KpiCard
          label="Usuario"
          value={fullName}
          icon={UserRound}
          tone="primary"
          description={user?.email || "Sin email registrado"}
        />
        <KpiCard
          label="Estado de Suscripción"
          value={isActive ? "Activa" : "Inactiva"}
          icon={ShieldCheck}
          tone={isActive ? "success" : "danger"}
          description={profile?.isManuallyEnabled ? "Habilitación manual" : `Vence: ${toFormattedDate(profile?.subscriptionExpiresAt ?? 0)}`}
        />
      </div>

      <DataState
        isLoading={isLoading}
        error={error}
      >
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="border-border/50 shadow-sm bg-card">
            <CardHeader className="pb-3 border-b border-border/40">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <UserRound className="h-4 w-4 text-muted-foreground" /> Datos Personales
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3 text-sm">
              <div className="flex justify-between py-1 border-b border-border/30">
                <span className="text-muted-foreground">Nombre completo:</span>
                <span className="font-semibold">{fullName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/30">
                <span className="text-muted-foreground">Correo electrónico:</span>
                <span className="font-medium">{profile?.email || user?.email}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground">ID de Usuario:</span>
                <span className="font-mono text-xs text-muted-foreground">{profile?.uid || user?.uid}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-sm bg-card">
            <CardHeader className="pb-3 border-b border-border/40">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" /> Licencia y Suscripción
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3 text-sm">
              <div className="flex justify-between items-center py-1 border-b border-border/30">
                <span className="text-muted-foreground">Estado actual:</span>
                <StatusBadge status={isActive ? "Activo" : "Inactivo"} />
              </div>
              <div className="flex justify-between py-1 border-b border-border/30">
                <span className="text-muted-foreground">Fecha de vencimiento:</span>
                <span className="font-medium">{toFormattedDate(profile?.subscriptionExpiresAt ?? 0)}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground">Tipo de licencia:</span>
                <span className="font-medium">{profile?.isManuallyEnabled ? "Suscripción Administrador" : "Estándar"}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-sm bg-card md:col-span-2">
            <CardHeader className="pb-3 border-b border-border/40">
              <CardTitle className="text-base font-semibold">Historial de Pagos de Suscripción</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {!profile?.paymentHistory?.length ? (
                <p className="text-muted-foreground text-center py-6">No hay pagos registrados</p>
              ) : (
                <DataTableShell headers={["Fecha", "Monto", "Estado", "Referencia Transacción"]}>
                  {profile.paymentHistory.map((payment, i) => (
                    <DataTableRow key={i}>
                      <DataTableCell>{toFormattedDate(payment.date)}</DataTableCell>
                      <DataTableCell className="font-semibold">{toPrint(payment.amount)}</DataTableCell>
                      <DataTableCell><StatusBadge status={payment.status} /></DataTableCell>
                      <DataTableCell className="font-mono text-xs text-muted-foreground">{payment.transactionRef || "---"}</DataTableCell>
                    </DataTableRow>
                  ))}
                </DataTableShell>
              )}
            </CardContent>
          </Card>
        </div>
      </DataState>
    </PageShell>
  );
}
