import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppSettingsProvider } from "@/contexts/AppSettingsContext";
import { OnboardingProvider } from "@/contexts/OnboardingContext";
import { TenantProvider } from "@/contexts/TenantContext";
import { AppLayout } from "@/components/layout/AppLayout";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import CommandCenter from "./pages/CommandCenter";
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
                  {/* Core Experience */}
                  <Route path="/" element={<Index />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/command-center" element={<CommandCenter />} />
                  
                  {/* Modules */}
                  <Route path="/empresas" element={<Empresas />} />
                  <Route path="/dinheiro" element={<Dinheiro />} />
                  <Route path="/documentos" element={<Documentos />} />
                  <Route path="/configuracoes" element={<Configuracoes />} />
                  
                  {/* Redirects & Fallbacks */}
                  <Route path="/home" element={<Navigate to="/" replace />} />
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
