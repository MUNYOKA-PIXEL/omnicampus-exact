import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index.tsx";
import Login from "./pages/Login.tsx";
import Register from "./pages/Register.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import Library from "./pages/Library.tsx";
import LostFound from "./pages/LostFound.tsx";
import Clubs from "./pages/Clubs.tsx";
import Medical from "./pages/Medical.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard" element={
              <ProtectedRoute allowedRoles={["superadmin", "student"]}>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/library" element={
              <ProtectedRoute allowedRoles={["superadmin", "libadmin", "student"]}>
                <Library />
              </ProtectedRoute>
            } />
            <Route path="/lost-found" element={
              <ProtectedRoute allowedRoles={["superadmin", "student"]}>
                <LostFound />
              </ProtectedRoute>
            } />
            <Route path="/clubs" element={
              <ProtectedRoute allowedRoles={["superadmin", "clubadmin", "student"]}>
                <Clubs />
              </ProtectedRoute>
            } />
            <Route path="/medical" element={
              <ProtectedRoute allowedRoles={["superadmin", "medadmin", "student"]}>
                <Medical />
              </ProtectedRoute>
            } />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
