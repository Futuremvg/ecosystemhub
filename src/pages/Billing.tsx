import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { CreditCard, Check, Sparkles, Shield, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSubscription } from "@/hooks/useSubscription";
import { useAuth } from "@/hooks/useAuth";
import { useTenant } from "@/contexts/TenantContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useSearchParams } from "react-router-dom";

const plans = [
  {
    id: "free",
    name: "Free",
    price: 0,
    features: ["1 empresa", "5 documentos", "20 transações/mês"],
    popular: false,
  },
  {
    id: "quarterly",
    name: "Trimestral",
    price: 29,
    priceId: "price_quarterly",
    features: ["Empresas ilimitadas", "Documentos ilimitados", "God Mode", "Scanner de recibos"],
    popular: true,
    badge: "Mais Popular",
  },
  {
    id: "annual",
    name: "Anual",
    price: 19,
    priceId: "price_annual",
    features: ["Tudo do Trimestral", "2 meses grátis", "Suporte prioritário"],
    popular: false,
    badge: "Melhor Valor",
  },
];

export default function Billing() {
  const { subscription, loading } = useSubscription();
  const { user } = useAuth();
  const { isSuperAdmin } = useTenant();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [loadingCheckout, setLoadingCheckout] = useState<string | null>(null);
  const [devMode, setDevMode] = useState(false);

  // Check for success/canceled params
  useEffect(() => {
    if (searchParams.get("success") === "true") {
      toast({ title: "Sucesso!", description: "Sua assinatura foi ativada." });
    } else if (searchParams.get("canceled") === "true") {
      toast({ title: "Cancelado", description: "O checkout foi cancelado.", variant: "destructive" });
    }
  }, [searchParams, toast]);

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
      title: newValue ? "Dev Mode Ativado" : "Dev Mode Desativado",
      description: newValue ? "Acesso completo para testes" : "Limitações normais aplicadas",
    });
  };

  const handleCheckout = async (priceId: string) => {
    if (!user) {
      toast({ title: "Erro", description: "Você precisa estar logado.", variant: "destructive" });
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
      toast({ title: "Erro", description: "Falha ao iniciar checkout.", variant: "destructive" });
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
      toast({ title: "Erro", description: "Falha ao abrir portal.", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-light tracking-tight">Cobrança</h1>
          <p className="text-muted-foreground">Gerencie sua assinatura</p>
        </div>

        {/* Current Status */}
        {subscription?.subscribed && (
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Check className="w-5 h-5 text-primary" />
                <span>Assinatura ativa</span>
              </div>
              <Button variant="outline" onClick={handlePortal}>
                Gerenciar Assinatura
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Plans Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.02 }}
            >
              <Card className={plan.popular ? "border-primary shadow-lg" : ""}>
                <CardHeader>
                  {plan.badge && (
                    <Badge className="w-fit mb-2" variant={plan.id === "annual" ? "default" : "secondary"}>
                      {plan.badge}
                    </Badge>
                  )}
                  <CardTitle>{plan.name}</CardTitle>
                  <CardDescription>
                    <span className="text-3xl font-bold">${plan.price}</span>
                    <span className="text-muted-foreground">/mês</span>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-sm">
                        <Check className="w-4 h-4 text-primary" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  {plan.priceId ? (
                    <Button
                      className="w-full"
                      onClick={() => handleCheckout(plan.priceId!)}
                      disabled={loadingCheckout === plan.priceId || subscription?.subscribed}
                    >
                      {loadingCheckout === plan.priceId ? "Carregando..." : "Começar"}
                    </Button>
                  ) : (
                    <Button className="w-full" variant="outline" disabled>
                      Plano Atual
                    </Button>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Dev Mode for Super Admins */}
        {isSuperAdmin && (
          <Card className="border-amber-500/30 bg-amber-500/5">
            <CardContent className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-amber-500" />
                <div>
                  <p className="font-medium">Dev Mode (Super Admin)</p>
                  <p className="text-sm text-muted-foreground">Bypass de pagamento para testes</p>
                </div>
              </div>
              <Button
                variant={devMode ? "default" : "outline"}
                onClick={toggleDevMode}
              >
                {devMode ? "Ativo" : "Ativar"}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
