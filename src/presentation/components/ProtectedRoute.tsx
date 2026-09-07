import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/presentation/contexts/AuthContext";
import { ROUTES } from "@/presentation/routes/routes";
import { LoadingState } from "@/presentation/components/shared/LoadingState";

interface ProtectedRouteProps {
  requiresSubscription?: boolean;
}

export function ProtectedRoute({ requiresSubscription }: ProtectedRouteProps) {
  const { appUser, loading, isSubscriptionActive } = useAuth();

  if (loading) return <LoadingState className="min-h-screen" />;
  if (!appUser) return <Navigate to={ROUTES.LOGIN} replace />;
  if (requiresSubscription && !isSubscriptionActive) return <Navigate to={ROUTES.SUBSCRIPTION} replace />;

  return <Outlet />;
}
