import { useState } from "react";
import { Link } from "react-router-dom";
import { authUseCase } from "@/di/container";
import { Button } from "@/presentation/components/ui/button";
import { Input } from "@/presentation/components/ui/input";
import { Label } from "@/presentation/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/presentation/components/ui/card";
import { ErrorState } from "@/presentation/components/shared/ErrorState";
import { ROUTES } from "@/presentation/routes/routes";
import { CheckCircle2, Loader2 } from "lucide-react";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await authUseCase.resetPassword(email);
      setSent(true);
    } catch {
      setError("No se pudo enviar el email de recuperación.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-sm border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle>Recuperar contraseña</CardTitle>
          <CardDescription>Te enviaremos un link para restablecerla.</CardDescription>
        </CardHeader>
        <CardContent>
          {sent ? (
            <div className="flex flex-col items-center gap-2 py-4 text-center">
              <CheckCircle2 className="h-8 w-8 text-emerald-600" />
              <p className="text-sm">Revisá tu email para continuar.</p>
              <Link to={ROUTES.LOGIN} className="text-sm text-muted-foreground hover:text-foreground hover:underline">
                Volver a iniciar sesión
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {error && <ErrorState message={error} />}
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Enviar link
              </Button>
              <Link to={ROUTES.LOGIN} className="text-center text-sm text-muted-foreground hover:text-foreground hover:underline">
                Volver a iniciar sesión
              </Link>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
