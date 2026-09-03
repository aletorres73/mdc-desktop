import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { ROUTES } from "../routes/routes";
import { useUserProfile } from "../hooks/useUser";

interface ProtectedRouteProps {
  requiresSubscription?: boolean;
}

export function ProtectedRoute({ requiresSubscription = false }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const profileQuery = useUserProfile();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  if (requiresSubscription && profileQuery.isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const profile = profileQuery.data;
  const hasActiveSubscription =
    profile?.isManuallyEnabled === true ||
    (profile?.subscriptionExpiresAt ?? 0) > Date.now();

  if (requiresSubscription && profile && !hasActiveSubscription) {
    return <Navigate to={ROUTES.SUBSCRIPTION} replace />;
  }

  return <Outlet />;
}
