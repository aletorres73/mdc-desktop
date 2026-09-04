import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authUseCase } from "@/di/container";
import { Button } from "@/presentation/components/ui/button";
import { Input } from "@/presentation/components/ui/input";
import { Label } from "@/presentation/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/presentation/components/ui/card";
import { ErrorState } from "@/presentation/components/shared/ErrorState";
import { ROUTES } from "@/presentation/routes/routes";
import { Loader2 } from "lucide-react";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await authUseCase.signIn(email, password);
      navigate(ROUTES.HOME);
    } catch {
      setError("Email o contraseña incorrectos.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-sm border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle>Iniciar sesión</CardTitle>
          <CardDescription>Accedé a tu cuenta de MDC Gestión Mayorista.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {error && <ErrorState message={error} />}
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button type="submit" disabled={submitting} className="mt-2">
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Ingresar
            </Button>
            <div className="flex justify-between text-sm text-muted-foreground">
              <Link to={ROUTES.FORGOT_PASSWORD} className="hover:text-foreground hover:underline">
                Olvidé mi contraseña
              </Link>
              <Link to={ROUTES.SIGN_UP} className="hover:text-foreground hover:underline">
                Crear cuenta
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
