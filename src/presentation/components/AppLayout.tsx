import { useLayoutEffect, useRef } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useIsMutating } from "@tanstack/react-query";
import {
  LayoutDashboard,
  Users,
  Receipt,
  CalendarClock,
  Percent,
  Factory,
  UserCircle,
  LogOut,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/presentation/contexts/AuthContext";
import { ROUTES } from "@/presentation/routes/routes";

const NAV_ITEMS = [
  { to: ROUTES.HOME, label: "Inicio", icon: LayoutDashboard },
  { to: ROUTES.CLIENTS, label: "Clientes", icon: Users },
  { to: ROUTES.INVOICES, label: "Facturas", icon: Receipt },
  { to: ROUTES.PAYMENT_REGISTER, label: "Pagos", icon: Wallet },
  { to: ROUTES.AGENDA, label: "Agenda", icon: CalendarClock },
  { to: ROUTES.COMMISSIONS, label: "Comisiones", icon: Percent },
  { to: ROUTES.FACTORIES, label: "Fábricas", icon: Factory },
];

export function AppLayout() {
  const { userProfile, signOut } = useAuth();
  const pendingMutations = useIsMutating();
  const location = useLocation();
  const mainRef = useRef<HTMLElement | null>(null);

  useLayoutEffect(() => {
    const scrollKey = `mdc-scroll:${location.key}`;
    const savedPosition = sessionStorage.getItem(scrollKey);
    const frame = requestAnimationFrame(() => {
      if (mainRef.current) mainRef.current.scrollTop = savedPosition ? Number(savedPosition) : 0;
    });

    return () => {
      cancelAnimationFrame(frame);
      if (mainRef.current) sessionStorage.setItem(scrollKey, String(mainRef.current.scrollTop));
    };
  }, [location.key]);

  return (
    <div className="flex min-h-screen w-full bg-muted/30">
      {pendingMutations > 0 && (
        <div
          role="status"
          aria-label="Procesando cambios"
          className="pointer-events-none fixed inset-x-0 top-0 z-50 h-0.5 overflow-hidden bg-primary/20"
        >
          <div className="animate-indeterminate-bar absolute h-full w-2/5 bg-primary" />
        </div>
      )}
      <aside className="flex w-60 shrink-0 flex-col border-r border-border/50 bg-muted/30 px-3 py-4">
        <div className="mb-6 px-2">
          <p className="text-lg font-bold tracking-tight">MDC</p>
          <p className="text-xs text-muted-foreground">Gestión Mayorista</p>
        </div>
        <nav className="flex flex-1 flex-col gap-1">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === ROUTES.HOME}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground",
                  isActive && "bg-card text-foreground shadow-sm",
                )
              }
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto flex flex-col gap-1 border-t border-border/50 pt-3">
          <NavLink
            to={ROUTES.PROFILE}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground",
                isActive && "bg-card text-foreground shadow-sm",
              )
            }
          >
            <UserCircle className="h-4 w-4 shrink-0" />
            <span className="truncate">{userProfile?.name || "Perfil"}</span>
          </NavLink>
          <button
            onClick={() => signOut()}
            className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </aside>
      <main ref={mainRef} className="flex-1 overflow-y-auto p-6">
        <Outlet />
      </main>
    </div>
  );
}
