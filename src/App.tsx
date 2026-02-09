import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Productos from "./pages/Productos";
import Ingredientes from "./pages/Ingredientes";
import Combos from "./pages/Combos";
import Usuarios from "./pages/Usuarios";
import Ventas from "./pages/Ventas";
import Gastos from "./pages/Gastos";
import DashboardGastos from "./pages/DashboardGastos";
import NotFound from "./pages/NotFound";
import { BranchProvider } from "./contexts/BranchContext";
import SelectBranch from "./pages/SelectBranch";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <BranchProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route path="/login" element={<Login />} />
              <Route
                path="/select-branch"
                element={
                  <ProtectedRoute>
                    <SelectBranch />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/productos"
                element={
                  <ProtectedRoute>
                    <Productos />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/ingredientes"
                element={
                  <ProtectedRoute>
                    <Ingredientes />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/combos"
                element={
                  <ProtectedRoute>
                    <Combos />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/usuarios"
                element={
                  <ProtectedRoute>
                    <Usuarios />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/ventas"
                element={
                  <ProtectedRoute>
                    <Ventas />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/gastos"
                element={
                  <ProtectedRoute>
                    <Gastos />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard-gastos"
                element={
                  <ProtectedRoute>
                    <DashboardGastos />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </BranchProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
