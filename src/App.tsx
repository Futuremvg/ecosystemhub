import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppSettingsProvider } from "@/contexts/AppSettingsContext";
import { OnboardingProvider } from "@/contexts/OnboardingContext";
import { TenantProvider } from "@/contexts/TenantContext";
import { AppLayout } from "@/components/layout/AppLayout";
import Landing from "./pages/Landing";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import CommandCenter from "./pages/CommandCenter";
import GodModeFullscreen from "./pages/GodModeFullscreen";
import Billing from "./pages/Billing";
import Empresas from "./pages/Empresas";
import Dinheiro from "./pages/Dinheiro";
import Documentos from "./pages/Documentos";
import Configuracoes from "./pages/Configuracoes";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AppSettingsProvider>
      <TenantProvider>
        <OnboardingProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <AppLayout>
                <Routes>
                  {/* Public Landing Page */}
                  <Route path="/" element={<Landing />} />
                  
                  {/* Auth & Checkout Flow */}
                  <Route path="/auth" element={<Auth />} />
                  
                  {/* Protected App Experience */}
                  <Route path="/dashboard" element={<Index />} />
                  <Route path="/command-center" element={<CommandCenter />} />
                  <Route path="/godmode" element={<GodModeFullscreen />} />
                  
                  {/* Modules */}
                  <Route path="/empresas" element={<Empresas />} />
                  <Route path="/dinheiro" element={<Dinheiro />} />
                  <Route path="/documentos" element={<Documentos />} />
                  <Route path="/configuracoes" element={<Configuracoes />} />
                  <Route path="/billing" element={<Billing />} />
                  
                  {/* Redirects & Fallbacks */}
                  <Route path="/home" element={<Navigate to="/dashboard" replace />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </AppLayout>
            </BrowserRouter>
          </TooltipProvider>
        </OnboardingProvider>
      </TenantProvider>
    </AppSettingsProvider>
  </QueryClientProvider>
);

export default App;
