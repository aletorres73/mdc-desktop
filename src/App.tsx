import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/AppLayout";
import Login from "@/pages/Login";
import SignUp from "@/pages/SignUp";
import Home from "@/pages/Home";
import Invoices from "@/pages/Invoices";
import InvoiceDetail from "@/pages/InvoiceDetail";
import Clients from "@/pages/Clients";
import ClientDetail from "@/pages/ClientDetail";
import Orders from "@/pages/Orders";
import OrderDetail from "@/pages/OrderDetail";
import CreateOrder from "@/pages/CreateOrder";
import Factories from "@/pages/Factories";
import FactoryDetail from "@/pages/FactoryDetail";
import Agenda from "@/pages/Agenda";
import Commissions from "@/pages/Commissions";
import Profile from "@/pages/Profile";
import { ROUTES } from "@/types/routes";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              {/* Public routes */}
              <Route path={ROUTES.LOGIN} element={<Login />} />
              <Route path={ROUTES.SIGN_UP} element={<SignUp />} />

              {/* Protected routes */}
              <Route element={<ProtectedRoute />}>
                <Route element={<AppLayout />}>
                <Route path={ROUTES.HOME} element={<Home />} />
                <Route path={ROUTES.INVOICES} element={<Invoices />} />
                <Route path={ROUTES.INVOICE_DETAIL} element={<InvoiceDetail />} />
                <Route path={ROUTES.CLIENTS} element={<Clients />} />
                <Route path={ROUTES.CLIENT_DETAIL} element={<ClientDetail />} />
                <Route path={ROUTES.ORDERS} element={<Orders />} />
                <Route path={ROUTES.ORDER_DETAIL} element={<OrderDetail />} />
                <Route path={ROUTES.CREATE_ORDER} element={<CreateOrder />} />
                <Route path={ROUTES.FACTORIES} element={<Factories />} />
                <Route path={ROUTES.FACTORY_DETAIL} element={<FactoryDetail />} />
                {/* Phase 4+: add more routes here */}
                <Route path={ROUTES.AGENDA} element={<Agenda />} />
                <Route path={ROUTES.COMMISSIONS} element={<Commissions />} />
                <Route path={ROUTES.PROFILE} element={<Profile />} />
                </Route>
              </Route>

              {/* Fallback */}
              <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
