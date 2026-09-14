import { useState } from "react";
import { useAuth } from "@/presentation/contexts/AuthContext";
import { authUseCase } from "@/di/container";
import { Card, CardContent, CardHeader, CardTitle } from "@/presentation/components/ui/card";
import { Badge } from "@/presentation/components/ui/badge";
import { Button } from "@/presentation/components/ui/button";
import { Input } from "@/presentation/components/ui/input";
import { Label } from "@/presentation/components/ui/label";
import { ErrorState } from "@/presentation/components/shared/ErrorState";
import { formatDate } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/presentation/components/ui/table";
import { EmptyState } from "@/presentation/components/shared/EmptyState";
import { CheckCircle2, Eye, EyeOff, History, KeyRound, UserCircle } from "lucide-react";

export default function Profile() {
  const { userProfile, signOut, isSubscriptionActive } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordChanged, setPasswordChanged] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordChanged(false);

    if (newPassword.length < 6) {
      setPasswordError("La nueva contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Las contraseñas nuevas no coinciden.");
      return;
    }

    setChangingPassword(true);
    try {
      await authUseCase.changePassword(currentPassword, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordChanged(true);
    } catch {
      setPasswordError("No se pudo cambiar la contraseña. Verificá tu contraseña actual.");
    } finally {
      setChangingPassword(false);
    }
  };

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
          <KeyRound className="h-4 w-4 text-muted-foreground" />
          <CardTitle className="text-base">Cambiar contraseña</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="flex max-w-md flex-col gap-4">
            {passwordError && <ErrorState message={passwordError} />}
            {passwordChanged && (
              <div className="flex items-center gap-2 rounded-lg border border-emerald-600/30 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>Contraseña actualizada correctamente.</span>
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="current-password">Contraseña actual</Label>
              <div className="relative">
                <Input
                  id="current-password"
                  type={showCurrentPassword ? "text" : "password"}
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0"
                  onClick={() => setShowCurrentPassword((visible) => !visible)}
                  aria-label={showCurrentPassword ? "Ocultar contraseña actual" : "Mostrar contraseña actual"}
                  title={showCurrentPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showCurrentPassword ? <EyeOff /> : <Eye />}
                </Button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new-password">Nueva contraseña</Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showNewPassword ? "text" : "password"}
                  minLength={6}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0"
                  onClick={() => setShowNewPassword((visible) => !visible)}
                  aria-label={showNewPassword ? "Ocultar nueva contraseña" : "Mostrar nueva contraseña"}
                  title={showNewPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showNewPassword ? <EyeOff /> : <Eye />}
                </Button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirm-password">Repetir nueva contraseña</Label>
              <div className="relative">
                <Input
                  id="confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  minLength={6}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0"
                  onClick={() => setShowConfirmPassword((visible) => !visible)}
                  aria-label={showConfirmPassword ? "Ocultar confirmación de contraseña" : "Mostrar confirmación de contraseña"}
                  title={showConfirmPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showConfirmPassword ? <EyeOff /> : <Eye />}
                </Button>
              </div>
            </div>
            <Button type="submit" className="self-start" disabled={changingPassword}>
              Actualizar contraseña
            </Button>
          </form>
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
