import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * Home screen — placeholder for Phase 4
 * Will load InitConfig + user data from Firestore
 */
export default function Home() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="border-b bg-card px-6 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold">MDC App</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {user?.email}
            </span>
            <Button variant="outline" size="sm" onClick={() => logout()}>
              Cerrar sesión
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-4xl p-6">
        <Card>
          <CardHeader>
            <CardTitle>Bienvenido, {user?.displayName || user?.email}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Home en construcción — Phase 4
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
