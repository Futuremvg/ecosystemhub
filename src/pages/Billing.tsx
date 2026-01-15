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
            <div className="flex justify-center items-center gap-3 flex-wrap">
              {/* Visa */}
              <div className="bg-white rounded px-2 py-1">
                <svg viewBox="0 0 48 32" className="h-6 w-auto">
                  <rect fill="#1434CB" width="48" height="32" rx="4"/>
                  <path fill="#fff" d="M20.5 21.5h-3l1.9-11.5h3l-1.9 11.5zm11.3-11.2c-.6-.2-1.5-.5-2.7-.5-3 0-5.1 1.5-5.1 3.7 0 1.6 1.5 2.5 2.6 3 1.2.6 1.6 1 1.6 1.5 0 .8-1 1.2-1.9 1.2-1.2 0-1.9-.2-3-.6l-.4-.2-.4 2.6c.8.3 2.1.6 3.5.6 3.2 0 5.3-1.5 5.3-3.8 0-1.3-.8-2.3-2.6-3.1-1.1-.5-1.7-.9-1.7-1.4 0-.5.6-.9 1.7-.9 1 0 1.7.2 2.3.4l.3.1.5-2.6zm7.8-.3h-2.3c-.7 0-1.3.2-1.6 1l-4.5 10.5h3.2l.6-1.7h3.9l.4 1.7h2.8l-2.5-11.5zm-3.8 7.4c.3-.7 1.2-3.2 1.2-3.2l.3-.9.2.8s.6 2.8.7 3.3h-2.4zM18.1 10l-2.8 8-.3-1.5c-.5-1.7-2.2-3.6-4-4.5l2.7 9.5h3.2l4.8-11.5h-3.6z"/>
                  <path fill="#F9A533" d="M12.5 10H7.6l-.1.3c3.8.9 6.3 3.2 7.4 5.9l-1-5.2c-.2-.7-.7-1-1.4-1z"/>
                </svg>
              </div>
              {/* Mastercard */}
              <div className="bg-white rounded px-2 py-1">
                <svg viewBox="0 0 48 32" className="h-6 w-auto">
                  <rect fill="#000" width="48" height="32" rx="4"/>
                  <circle cx="18" cy="16" r="9" fill="#EB001B"/>
                  <circle cx="30" cy="16" r="9" fill="#F79E1B"/>
                  <path fill="#FF5F00" d="M24 9.5a9 9 0 0 0-3 6.5 9 9 0 0 0 3 6.5 9 9 0 0 0 3-6.5 9 9 0 0 0-3-6.5z"/>
                </svg>
              </div>
              {/* Amex */}
              <div className="bg-white rounded px-2 py-1">
                <svg viewBox="0 0 48 32" className="h-6 w-auto">
                  <rect fill="#006FCF" width="48" height="32" rx="4"/>
                  <path fill="#fff" d="M7 16l3-8h4l3 8-3 8H10l-3-8zm6.5 0L11 11l-2.5 5 2.5 5 2.5-5zm8-8h4l2 3 2-3h4v16h-3v-10l-3 4-3-4v10h-3V8zm17 0l3 5-3 5 3 5h-4l-3-5 3-5-3-5h4z"/>
                </svg>
              </div>
              {/* Apple Pay */}
              <div className="bg-black rounded px-3 py-1">
                <svg viewBox="0 0 50 21" className="h-5 w-auto">
                  <path fill="#fff" d="M9.5 5.4c-.6.7-1.5 1.2-2.4 1.1-.1-.9.3-1.9 1-2.6.6-.7 1.6-1.2 2.3-1.2.1.9-.3 1.9-.9 2.7zm.9 1.4c-1.3-.1-2.5.8-3.1.8s-1.6-.7-2.7-.7c-1.4 0-2.6.8-3.3 2-.7 1.3-.5 3.7.8 5.8.6 1 1.4 2 2.5 2 1 0 1.4-.7 2.6-.7s1.6.7 2.7.6c1.1 0 1.8-.9 2.5-2 .5-.7.7-1.1 1-1.9-2.4-.9-2.8-4.5-.3-5.8-.8-1-2-1.6-3.2-1.6-.8 0-1.5.3-2 .5z"/>
                  <path fill="#fff" d="M21.1 14.9V3.5h3.5c2.4 0 4.1 1.7 4.1 4s-1.7 4-4.1 4h-2.3v3.4h-1.2zm1.2-4.5h1.9c1.7 0 2.7-.9 2.7-2.4s-1-2.4-2.7-2.4h-1.9v4.8zm7.5 4.7c-.8 0-1.4-.6-1.4-1.4s.6-1.4 1.4-1.4 1.4.6 1.4 1.4-.6 1.4-1.4 1.4zm3-1.9c0 1.3 1 2.1 2.6 2.1 1.8 0 2.9-1 2.9-2.5v-.7l-1.7.1c-1.2.1-1.9.5-1.9 1.2 0 .5.4.8 1.1.8s1.4-.4 1.6-1h.1v.8h.9v-3.8c0-1.3-.9-2.1-2.4-2.1-1.4 0-2.4.8-2.5 1.9h1c.1-.6.6-1 1.4-1 .9 0 1.4.4 1.4 1.2v.5l-1.9.1c-1.5.1-2.6.8-2.6 2.1v.3zm7.2 1.7l1.6-4.4 1.6 4.4h1.2l2.4-6.6h-1.2l-1.7 5-1.7-5H40l-1.6 5-1.7-5h-1.2l2.4 6.6h1.1z"/>
                </svg>
              </div>
              {/* Google Pay */}
              <div className="bg-white rounded px-3 py-1">
                <svg viewBox="0 0 50 21" className="h-5 w-auto">
                  <path fill="#5F6368" d="M23.8 10.4v4h-1.2V4.5h3.3c.8 0 1.5.3 2.1.8.6.5.9 1.2.9 2s-.3 1.5-.9 2c-.6.5-1.3.8-2.1.8h-2.1v.3zm0-4.7v3.5h2.2c.5 0 .9-.2 1.3-.5.7-.7.7-1.8 0-2.5-.3-.3-.8-.5-1.3-.5h-2.2z"/>
                  <path fill="#5F6368" d="M32.4 7.4c.9 0 1.6.2 2.1.7.5.5.8 1.2.8 2v4.3h-1.1v-1h0c-.5.8-1.2 1.2-2 1.2-.7 0-1.3-.2-1.8-.6-.5-.4-.7-.9-.7-1.6 0-.7.3-1.2.8-1.6.5-.4 1.2-.6 2.1-.6.8 0 1.4.1 1.8.4v-.3c0-.5-.2-.8-.5-1.1-.3-.3-.7-.5-1.2-.5-.7 0-1.2.3-1.6.9l-1-.6c.5-.9 1.3-1.4 2.4-1.4v-.2zm-1.6 5.2c0 .3.1.6.4.8.3.2.6.3 1 .3.5 0 1-.2 1.4-.6.4-.4.6-.8.6-1.3-.3-.3-.8-.4-1.6-.4-.5 0-1 .1-1.3.3-.4.2-.5.5-.5.9z"/>
                  <path fill="#5F6368" d="M42.4 7.6l-3.9 8.9h-1.2l1.4-3.1-2.6-5.8h1.3l1.8 4.3 1.8-4.3h1.4z"/>
                  <path fill="#4285F4" d="M14.2 9.8c0-.4 0-.7-.1-1.1H7.3v2.1h3.9c-.2.9-.7 1.7-1.4 2.2v1.8h2.3c1.4-1.2 2.1-3.1 2.1-5z"/>
                  <path fill="#34A853" d="M7.3 16.5c1.9 0 3.5-.6 4.7-1.7l-2.3-1.8c-.6.4-1.4.7-2.4.7-1.8 0-3.4-1.2-4-2.9H.9v1.9c1.2 2.3 3.6 3.8 6.4 3.8z"/>
                  <path fill="#FBBC05" d="M3.3 10.8c-.3-.9-.3-1.8 0-2.6V6.3H.9c-1 2-1 4.4 0 6.3l2.4-1.8z"/>
                  <path fill="#EA4335" d="M7.3 5.3c1 0 2 .3 2.7 1l2-2c-1.3-1.2-3-1.8-4.7-1.8-2.8 0-5.2 1.5-6.4 3.8l2.4 1.9c.6-1.7 2.2-2.9 4-2.9z"/>
                </svg>
              </div>
              {/* Stripe */}
              <div className="bg-[#635BFF] rounded px-3 py-1.5">
                <svg viewBox="0 0 60 25" className="h-4 w-auto">
                  <path fill="#fff" d="M5 10.2c0-.6.5-1 1.3-1 1.1 0 2.5.3 3.6.9V6.8c-1.2-.5-2.4-.7-3.6-.7C3.4 6.1 1.3 7.7 1.3 10.4c0 4.2 5.8 3.5 5.8 5.4 0 .7-.6 1-1.5 1-1.3 0-3-.5-4.3-1.3v3.4c1.5.6 2.9.9 4.3.9 2.9 0 5-1.5 5-4.3 0-4.5-5.9-3.7-5.9-5.5l.3.2zm9.3-5.8l-3.3.7V8h3.3V4.4zm-3.3 4.7v9.8h3.3V9.1h-3.3zm7.6 2.6c0-.6.5-.8 1.3-.8.9 0 2 .3 2.9.8v-3c-1-.4-1.9-.5-2.9-.5-2.4 0-4 1.2-4 3.3 0 3.2 4.4 2.7 4.4 4 0 .5-.5.7-1.1.7-1 0-2.3-.4-3.3-1v3c1.1.5 2.3.7 3.3.7 2.4 0 4.1-1.2 4.1-3.3-.1-3.5-4.5-2.9-4.5-4.1l-.2.2zm11-2.6c-1 0-1.6.5-2 1.1l-.1-1h-3v13.1l3.3-.7v-3.2c.4.3 1 .7 2 .7 2 0 3.8-1.6 3.8-5.1-.1-3.2-2-4.9-4-4.9zm-.7 7.5c-.7 0-1.1-.2-1.4-.6v-4.2c.3-.3.7-.6 1.4-.6 1 0 1.8 1.2 1.8 2.7s-.7 2.7-1.8 2.7zm11.3-7.5c-2.3 0-3.7 2-3.7 4.8s1.5 5.2 4.3 5.2c1.2 0 2.2-.3 3-1l-.8-2.5c-.5.4-1.2.6-1.8.6-.9 0-1.6-.3-1.8-1.4h4.6v-.8c0-3.3-1.6-4.9-3.8-4.9zm-1 3.8c.1-.9.6-1.6 1.4-1.6.8 0 1.2.6 1.3 1.6h-2.7z"/>
                </svg>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AppLayout>
  );
}
