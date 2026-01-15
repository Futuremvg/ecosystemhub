import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AppSettingsProvider } from "@/contexts/AppSettingsContext";
import { OnboardingProvider, useOnboarding } from "@/contexts/OnboardingContext";
import { TenantProvider } from "@/contexts/TenantContext";
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard";
import { PageTransition } from "@/components/layout/PageTransition";
import { AnimatePresence } from "framer-motion";
import Landing from "./pages/Landing";
import Home from "./pages/Home";
import Auth from "./pages/Auth";
import Empresas from "./pages/Empresas";
import Dinheiro from "./pages/Dinheiro";
import Documentos from "./pages/Documentos";
import Configuracoes from "./pages/Configuracoes";
import Ajuda from "./pages/Ajuda";
import AdminTenants from "./pages/AdminTenants";
import Billing from "./pages/Billing";
import Assistente from "./pages/Assistente";
import GodModeFullscreen from "./pages/GodModeFullscreen";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageTransition><Landing /></PageTransition>} />
        <Route path="/home" element={<PageTransition><Home /></PageTransition>} />
        <Route path="/auth" element={<PageTransition><Auth /></PageTransition>} />
        <Route path="/empresas" element={<PageTransition><Empresas /></PageTransition>} />
        <Route path="/dinheiro" element={<PageTransition><Dinheiro /></PageTransition>} />
        <Route path="/documentos" element={<PageTransition><Documentos /></PageTransition>} />
        <Route path="/configuracoes" element={<PageTransition><Configuracoes /></PageTransition>} />
        <Route path="/ajuda" element={<PageTransition><Ajuda /></PageTransition>} />
        <Route path="/assistente" element={<PageTransition><Assistente /></PageTransition>} />
        <Route path="/godmode" element={<GodModeFullscreen />} />
        <Route path="/admin/tenants" element={<PageTransition><AdminTenants /></PageTransition>} />
        <Route path="/billing" element={<PageTransition><Billing /></PageTransition>} />
        <Route path="/privacy" element={<PageTransition><Privacy /></PageTransition>} />
        <Route path="/terms" element={<PageTransition><Terms /></PageTransition>} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
      </Routes>
    </AnimatePresence>
  );
}

function AppContent() {
  const { showOnboarding, completeOnboarding } = useOnboarding();

  return (
    <>
      {showOnboarding && <OnboardingWizard onComplete={completeOnboarding} />}
      <AnimatedRoutes />
    </>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AppSettingsProvider>
      <TenantProvider>
        <OnboardingProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <AppContent />
            </BrowserRouter>
          </TooltipProvider>
        </OnboardingProvider>
      </TenantProvider>
    </AppSettingsProvider>
  </QueryClientProvider>
);

export default App;
