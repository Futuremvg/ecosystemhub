import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, CreditCard, Loader2, RefreshCw, ExternalLink, Sparkles, Crown, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { SUBSCRIPTION_PLANS, formatPrice, PlanId } from '@/lib/stripe-config';
import { AppLayout } from '@/components/layout/AppLayout';

export default function Billing() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { subscription, currentPlan, loading: subLoading, refetch } = useSubscription();
  
  const [checkoutLoading, setCheckoutLoading] = useState<PlanId | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);

  // Handle success/cancel from Stripe
  useEffect(() => {
    if (searchParams.get('success') === 'true') {
      toast.success('Assinatura ativada com sucesso!', {
        description: 'Bem-vindo ao Ecosystem Hub!'
      });
      refetch();
    } else if (searchParams.get('canceled') === 'true') {
      toast.info('Checkout cancelado', {
        description: 'Você pode assinar a qualquer momento.'
      });
    }
  }, [searchParams, refetch]);

  const handleCheckout = async (planId: PlanId) => {
    if (!user) {
      toast.error('Faça login para assinar');
      navigate('/auth');
      return;
    }

    setCheckoutLoading(planId);

    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { priceId: SUBSCRIPTION_PLANS[planId].price_id }
      });

      if (error) throw new Error(error.message);
      if (data.error) throw new Error(data.error);

      if (data.url) {
        window.open(data.url, '_blank');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao iniciar checkout';
      toast.error('Erro no checkout', { description: message });
    } finally {
      setCheckoutLoading(null);
    }
  };

  const handleManageSubscription = async () => {
    if (!user) {
      toast.error('Faça login para gerenciar sua assinatura');
      return;
    }

    setPortalLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');

      if (error) throw new Error(error.message);
      if (data.error) throw new Error(data.error);

      if (data.url) {
        window.open(data.url, '_blank');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao abrir portal';
      toast.error('Erro', { description: message });
    } finally {
      setPortalLoading(false);
    }
  };

  const getPlanIcon = (planId: PlanId) => {
    switch (planId) {
      case 'monthly': return <Zap className="h-6 w-6" />;
      case 'quarterly': return <Sparkles className="h-6 w-6" />;
      case 'annual': return <Crown className="h-6 w-6" />;
    }
  };

  const isCurrentPlan = (planId: PlanId) => {
    return currentPlan?.id === planId;
  };

  return (
    <AppLayout>
      <div className="container max-w-5xl py-8 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Header */}
          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold mb-2">Planos e Cobrança</h1>
            <p className="text-muted-foreground">
              Escolha o plano ideal para seu negócio
            </p>
          </div>

          {/* Current Subscription Status */}
          {subscription?.subscribed && currentPlan && (
            <Card className="mb-8 border-primary/50 bg-primary/5">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5 text-primary" />
                      Sua Assinatura
                    </CardTitle>
                    <CardDescription>
                      Plano {currentPlan.name} • Renovação em{' '}
                      {subscription.subscription_end 
                        ? new Date(subscription.subscription_end).toLocaleDateString('pt-BR')
                        : 'N/A'}
                    </CardDescription>
                  </div>
                  <Badge variant="default" className="bg-primary">
                    Ativo
                  </Badge>
                </div>
              </CardHeader>
              <CardFooter className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={handleManageSubscription}
                  disabled={portalLoading}
                >
                  {portalLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <ExternalLink className="h-4 w-4 mr-2" />
                  )}
                  Gerenciar Assinatura
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={refetch}
                  disabled={subLoading}
                >
                  <RefreshCw className={`h-4 w-4 ${subLoading ? 'animate-spin' : ''}`} />
                </Button>
              </CardFooter>
            </Card>
          )}

          {/* Plans Grid */}
          <div className="grid md:grid-cols-3 gap-6">
            {(Object.entries(SUBSCRIPTION_PLANS) as [PlanId, typeof SUBSCRIPTION_PLANS[PlanId]][]).map(([planId, plan], index) => {
              const isCurrent = isCurrentPlan(planId);
              const isPopular = planId === 'annual';

              return (
                <motion.div
                  key={planId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                >
                  <Card className={`relative h-full flex flex-col ${
                    isPopular ? 'border-primary shadow-lg scale-105' : ''
                  } ${isCurrent ? 'ring-2 ring-primary' : ''}`}>
                    {isPopular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <Badge className="bg-primary text-primary-foreground">
                          Mais Popular
                        </Badge>
                      </div>
                    )}
                    
                    {isCurrent && (
                      <div className="absolute -top-3 right-4">
                        <Badge variant="secondary">
                          Seu Plano
                        </Badge>
                      </div>
                    )}

                    <CardHeader className="text-center pb-2">
                      <div className={`mx-auto mb-3 p-3 rounded-full ${
                        isPopular ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                      }`}>
                        {getPlanIcon(planId)}
                      </div>
                      <CardTitle>{plan.name}</CardTitle>
                      <div className="mt-2">
                        <span className="text-3xl font-bold">
                          {formatPrice(plan.price)}
                        </span>
                        <span className="text-muted-foreground">
                          /{plan.interval_count > 1 ? `${plan.interval_count} meses` : plan.interval === 'year' ? 'ano' : 'mês'}
                        </span>
                      </div>
                      {plan.savings && (
                        <Badge variant="outline" className="mt-2 text-green-600 border-green-600">
                          Economize {plan.savings}%
                        </Badge>
                      )}
                    </CardHeader>

                    <CardContent className="flex-1">
                      <p className="text-sm text-muted-foreground text-center mb-4">
                        {plan.description}
                      </p>
                      <ul className="space-y-2">
                        {[
                          'Gestão financeira completa',
                          'Gerenciamento de empresas',
                          'Documentos ilimitados',
                          'God Mode AI Assistant',
                          'Suporte prioritário',
                        ].map((feature) => (
                          <li key={feature} className="flex items-center gap-2 text-sm">
                            <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </CardContent>

                    <CardFooter>
                      {isCurrent ? (
                        <Button className="w-full" variant="outline" disabled>
                          <Check className="h-4 w-4 mr-2" />
                          Plano Atual
                        </Button>
                      ) : subscription?.subscribed ? (
                        <Button 
                          className="w-full" 
                          variant="outline"
                          onClick={handleManageSubscription}
                          disabled={portalLoading}
                        >
                          {portalLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : null}
                          Alterar Plano
                        </Button>
                      ) : (
                        <Button
                          className={`w-full ${isPopular ? 'bg-primary' : ''}`}
                          variant={isPopular ? 'default' : 'outline'}
                          onClick={() => handleCheckout(planId)}
                          disabled={!!checkoutLoading}
                        >
                          {checkoutLoading === planId ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : null}
                          Assinar Agora
                        </Button>
                      )}
                    </CardFooter>
                  </Card>
                </motion.div>
              );
            })}
          </div>

          {/* Payment Methods Info */}
          <div className="mt-10 text-center">
            <p className="text-sm text-muted-foreground mb-4">
              Pagamento seguro processado pelo Stripe
            </p>
            <div className="flex justify-center items-center gap-4 opacity-50">
              <div className="text-xs">Visa</div>
              <div className="text-xs">Mastercard</div>
              <div className="text-xs">American Express</div>
            </div>
          </div>
        </motion.div>
      </div>
    </AppLayout>
  );
}
