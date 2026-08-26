import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Login from "@/pages/Login";
import SignUp from "@/pages/SignUp";
import Home from "@/pages/Home";
import Invoices from "@/pages/Invoices";
import InvoiceDetail from "@/pages/InvoiceDetail";
import Clients from "@/pages/Clients";
import Orders from "@/pages/Orders";
import OrderDetail from "@/pages/OrderDetail";
import CreateOrder from "@/pages/CreateOrder";
import Factories from "@/pages/Factories";
import FactoryDetail from "@/pages/FactoryDetail";

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
              <Route path="/login" element={<Login />} />
              <Route path="/sign-up" element={<SignUp />} />

              {/* Protected routes */}
              <Route element={<ProtectedRoute />}>
                <Route path="/" element={<Home />} />
                <Route path="/invoices" element={<Invoices />} />
                <Route path="/invoices/:invoiceNumber" element={<InvoiceDetail />} />
                <Route path="/clients" element={<Clients />} />
                <Route path="/orders" element={<Orders />} />
                <Route path="/orders/:clientId/:orderId" element={<OrderDetail />} />
                <Route path="/orders/create" element={<CreateOrder />} />
                <Route path="/factories" element={<Factories />} />
                <Route path="/factories/:factoryName" element={<FactoryDetail />} />
                {/* Phase 4+: add more routes here */}
                <Route path="/agenda" element={<div className="p-6">Agenda - Coming soon</div>} />
                <Route path="/commissions" element={<div className="p-6">Comisiones - Coming soon</div>} />
                <Route path="/profile" element={<div className="p-6">Perfil - Coming soon</div>} />
              </Route>

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
