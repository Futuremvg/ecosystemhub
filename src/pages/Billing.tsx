import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { CreditCard, Check, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSubscription } from "@/hooks/useSubscription";
import { useAuth } from "@/hooks/useAuth";
import { useTenant } from "@/contexts/TenantContext";
import { useAppSettings } from "@/contexts/AppSettingsContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useSearchParams } from "react-router-dom";
import { useIsMobile, useIsMobileOrTablet } from "@/hooks/use-mobile";

export default function Billing() {
  const { subscription, loading } = useSubscription();
  const { user } = useAuth();
  const { isSuperAdmin } = useTenant();
  const { language } = useAppSettings();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [loadingCheckout, setLoadingCheckout] = useState<string | null>(null);
  const [devMode, setDevMode] = useState(false);
  const isMobile = useIsMobile();
  const isMobileOrTablet = useIsMobileOrTablet();
  const isPt = language === 'pt-BR';

  const plans = [
    {
      id: "free",
      name: isPt ? "Gratuito" : "Free",
      price: 0,
      features: isPt 
        ? ["1 empresa", "5 documentos", "20 transações/mês"]
        : ["1 company", "5 documents", "20 transactions/mo"],
      popular: false,
    },
    {
      id: "quarterly",
      name: isPt ? "Trimestral" : "Quarterly",
      price: 29,
      priceId: "price_quarterly",
      features: isPt 
        ? ["Empresas ilimitadas", "Documentos ilimitados", "God Mode", "Scanner de recibos"]
        : ["Unlimited companies", "Unlimited documents", "God Mode", "Receipt scanner"],
      popular: true,
      badge: isPt ? "Mais Popular" : "Most Popular",
    },
    {
      id: "annual",
      name: isPt ? "Anual" : "Annual",
      price: 19,
      priceId: "price_annual",
      features: isPt 
        ? ["Tudo do Trimestral", "2 meses grátis", "Suporte prioritário"]
        : ["Everything in Quarterly", "2 months free", "Priority support"],
      popular: false,
      badge: isPt ? "Melhor Valor" : "Best Value",
    },
  ];

  // Check for success/canceled params
  useEffect(() => {
    if (searchParams.get("success") === "true") {
      toast({ 
        title: isPt ? "Sucesso!" : "Success!", 
        description: isPt ? "Sua assinatura foi ativada." : "Your subscription is active." 
      });
    } else if (searchParams.get("canceled") === "true") {
      toast({ 
        title: isPt ? "Cancelado" : "Canceled", 
        description: isPt ? "O checkout foi cancelado." : "Checkout was canceled.", 
        variant: "destructive" 
      });
    }
  }, [searchParams, toast, isPt]);

  // Dev mode for super admins
  useEffect(() => {
    const saved = localStorage.getItem("devModeActive");
    setDevMode(saved === "true");
  }, []);

  const toggleDevMode = () => {
    const newValue = !devMode;
    setDevMode(newValue);
    localStorage.setItem("devModeActive", JSON.stringify(newValue));
    toast({
      title: newValue 
        ? (isPt ? "Dev Mode Ativado" : "Dev Mode Active") 
        : (isPt ? "Dev Mode Desativado" : "Dev Mode Inactive"),
      description: newValue 
        ? (isPt ? "Acesso completo para testes" : "Full access for testing") 
        : (isPt ? "Limitações normais aplicadas" : "Normal limits applied"),
    });
  };

  const handleCheckout = async (priceId: string) => {
    if (!user) {
      toast({ 
        title: isPt ? "Erro" : "Error", 
        description: isPt ? "Você precisa estar logado." : "You need to be logged in.", 
        variant: "destructive" 
      });
      return;
    }

    setLoadingCheckout(priceId);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { priceId },
      });

      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Checkout error:", error);
      toast({ 
        title: isPt ? "Erro" : "Error", 
        description: isPt ? "Falha ao iniciar checkout." : "Failed to start checkout.", 
        variant: "destructive" 
      });
    } finally {
      setLoadingCheckout(null);
    }
  };

  const handlePortal = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal");
      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Portal error:", error);
      toast({ 
        title: isPt ? "Erro" : "Error", 
        description: isPt ? "Falha ao abrir portal." : "Failed to open portal.", 
        variant: "destructive" 
      });
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto space-y-6 sm:space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl sm:text-3xl font-light tracking-tight">
            {isPt ? "Cobrança" : "Billing"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isPt ? "Gerencie sua assinatura" : "Manage your subscription"}
          </p>
        </div>

        {/* Current Status */}
        {subscription?.subscribed && (
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Check className="w-5 h-5 text-primary shrink-0" />
                <span className="text-sm sm:text-base">
                  {isPt ? "Assinatura ativa" : "Subscription active"}
                </span>
              </div>
              <Button 
                variant="outline" 
                onClick={handlePortal}
                className="w-full sm:w-auto min-h-[44px]"
              >
                {isPt ? "Gerenciar Assinatura" : "Manage Subscription"}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Plans Grid - Stack on mobile */}
        <div className={`grid gap-4 sm:gap-6 ${isMobile ? 'grid-cols-1' : 'md:grid-cols-3'}`}>
          {plans.map((plan, index) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className={`h-full flex flex-col ${plan.popular ? "border-primary shadow-lg" : ""}`}>
                <CardHeader className="pb-4">
                  {plan.badge && (
                    <Badge className="w-fit mb-2" variant={plan.id === "annual" ? "default" : "secondary"}>
                      {plan.badge}
                    </Badge>
                  )}
                  <CardTitle className="text-lg">{plan.name}</CardTitle>
                  <CardDescription>
                    <span className="text-2xl sm:text-3xl font-bold">${plan.price}</span>
                    <span className="text-muted-foreground">/{isPt ? 'mês' : 'mo'}</span>
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col space-y-4">
                  <ul className="space-y-2 flex-1">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-sm">
                        <Check className="w-4 h-4 text-primary shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  {plan.priceId ? (
                    <Button
                      className="w-full min-h-[44px]"
                      onClick={() => handleCheckout(plan.priceId!)}
                      disabled={loadingCheckout === plan.priceId || subscription?.subscribed}
                    >
                      {loadingCheckout === plan.priceId 
                        ? (isPt ? "Carregando..." : "Loading...") 
                        : (isPt ? "Começar" : "Get Started")}
                    </Button>
                  ) : (
                    <Button className="w-full min-h-[44px]" variant="outline" disabled>
                      {isPt ? "Plano Atual" : "Current Plan"}
                    </Button>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Dev Mode for Super Admins - Simplified on mobile */}
        {isSuperAdmin && (
          <Card className="border-amber-500/30 bg-amber-500/5">
            <CardContent className="p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-amber-500 shrink-0" />
                <div>
                  <p className="font-medium text-sm sm:text-base">Dev Mode (Super Admin)</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {isPt ? "Bypass de pagamento para testes" : "Payment bypass for testing"}
                  </p>
                </div>
              </div>
              <Button
                variant={devMode ? "default" : "outline"}
                onClick={toggleDevMode}
                className="w-full sm:w-auto min-h-[44px]"
              >
                {devMode 
                  ? (isPt ? "Ativo" : "Active") 
                  : (isPt ? "Ativar" : "Activate")}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
