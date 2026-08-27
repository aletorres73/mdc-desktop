import { useState, type FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { ROUTES } from "@/types/routes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

/**
 * Login screen — mirrors Kotlin LoginScreen / LoginViewModel
 * Uses Firebase REST API via AuthContext
 */
export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await login(email, password);
      navigate(ROUTES.HOME, { replace: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error desconocido";
      // Translate common Firebase errors to Spanish (matches Kotlin LoginViewModel)
      if (message.includes("INVALID_LOGIN_CREDENTIALS") || message.includes("EMAIL_NOT_FOUND") || message.includes("INVALID_PASSWORD")) {
        setError("Credenciales inválidas");
      } else if (message.includes("USER_DISABLED")) {
        setError("Usuario deshabilitado");
      } else {
        setError(message);
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">MDC App</CardTitle>
          <CardDescription>
            Iniciá sesión para continuar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                disabled={isSubmitting}
              />
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Ingresando..." : "Iniciar sesión"}
            </Button>

            <div className="text-center text-sm text-muted-foreground">
              ¿No tenés cuenta?{" "}
              <Link to={ROUTES.SIGN_UP} className="text-primary underline hover:text-primary/80">
                Registrate
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
