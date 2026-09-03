import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/presentation/components/ui/tooltip";
import { AuthProvider } from "@/presentation/contexts/AuthContext";
import { ProtectedRoute } from "@/presentation/components/ProtectedRoute";
import { AppLayout } from "@/presentation/components/AppLayout";
import Login from "@/presentation/pages/Login";
import SignUp from "@/presentation/pages/SignUp";
import ForgotPassword from "@/presentation/pages/ForgotPassword";
import Home from "@/presentation/pages/Home";
import Invoices from "@/presentation/pages/Invoices";
import InvoiceDetail from "@/presentation/pages/InvoiceDetail";
import Clients from "@/presentation/pages/Clients";
import ClientDetail from "@/presentation/pages/ClientDetail";
import Orders from "@/presentation/pages/Orders";
import OrderDetail from "@/presentation/pages/OrderDetail";
import CreateOrder from "@/presentation/pages/CreateOrder";
import Factories from "@/presentation/pages/Factories";
import FactoryDetail from "@/presentation/pages/FactoryDetail";
import Agenda from "@/presentation/pages/Agenda";
import Commissions from "@/presentation/pages/Commissions";
import Profile from "@/presentation/pages/Profile";
import { ROUTES } from "@/presentation/routes/routes";

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
              <Route path={ROUTES.FORGOT_PASSWORD} element={<ForgotPassword />} />

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
