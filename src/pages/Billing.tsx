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
import { useAppSettings } from '@/contexts/AppSettingsContext';
import { SUBSCRIPTION_PLANS, formatPrice, PlanId, getPlanName, getPlanDescription } from '@/lib/stripe-config';
import { AppLayout } from '@/components/layout/AppLayout';

export default function Billing() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { subscription, currentPlan, loading: subLoading, refetch } = useSubscription();
  const { t, language } = useAppSettings();
  
  const [checkoutLoading, setCheckoutLoading] = useState<PlanId | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);

  const isPt = language.startsWith("pt");

  // Handle success/cancel from Stripe
  useEffect(() => {
    if (searchParams.get('success') === 'true') {
      toast.success(t('billing.success'), {
        description: t('billing.welcome')
      });
      refetch();
    } else if (searchParams.get('canceled') === 'true') {
      toast.info(t('billing.canceled'), {
        description: t('billing.canceledDesc')
      });
    }
  }, [searchParams, refetch, t]);

  const handleCheckout = async (planId: PlanId) => {
    if (!user) {
      toast.error(t('billing.loginToSubscribe'));
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
      const message = err instanceof Error ? err.message : t('billing.checkoutError');
      toast.error(t('billing.checkoutError'), { description: message });
    } finally {
      setCheckoutLoading(null);
    }
  };

  const handleManageSubscription = async () => {
    if (!user) {
      toast.error(t('billing.loginToSubscribe'));
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
      const message = err instanceof Error ? err.message : t('billing.portalError');
      toast.error(t('billing.portalError'), { description: message });
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

  const getIntervalText = (plan: typeof SUBSCRIPTION_PLANS[PlanId]) => {
    if (plan.interval === 'year') {
      return t('billing.perYear');
    }
    if (plan.interval_count > 1) {
      return `${plan.interval_count} ${t('billing.perMonths')}`;
    }
    return t('billing.perMonth');
  };

  const features = [
    t('billing.features.financial'),
    t('billing.features.companies'),
    t('billing.features.documents'),
    t('billing.features.godMode'),
    t('billing.features.support'),
  ];

  // Check if user is in trial period
  const isTrialing = subscription?.status === 'trialing';

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
            <h1 className="text-3xl font-bold mb-2">{t('billing.title')}</h1>
            <p className="text-muted-foreground">
              {t('billing.subtitle')}
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
                      {t('billing.yourSubscription')}
                    </CardTitle>
                    <CardDescription>
                      {t('billing.planName')} {getPlanName(currentPlan, isPt)} • {t('billing.renewalDate')}{' '}
                      {subscription.subscription_end 
                        ? new Date(subscription.subscription_end).toLocaleDateString(isPt ? 'pt-BR' : 'en-US')
                        : 'N/A'}
                    </CardDescription>
                  </div>
                  <Badge variant="default" className={isTrialing ? "bg-amber-500" : "bg-primary"}>
                    {isTrialing ? (isPt ? 'Em Trial' : 'In Trial') : t('billing.active')}
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
                  {t('billing.manageSubscription')}
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
                          {t('billing.mostPopular')}
                        </Badge>
                      </div>
                    )}
                    
                    {isCurrent && (
                      <div className="absolute -top-3 right-4">
                        <Badge variant="secondary" className={isTrialing ? "bg-amber-100 text-amber-800" : ""}>
                          {isTrialing ? (isPt ? 'Trial' : 'Trial') : t('billing.yourPlan')}
                        </Badge>
                      </div>
                    )}

                    <CardHeader className="text-center pb-2">
                      <div className={`mx-auto mb-3 p-3 rounded-full ${
                        isPopular ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                      }`}>
                        {getPlanIcon(planId)}
                      </div>
                      <CardTitle>{getPlanName(plan, isPt)}</CardTitle>
                      <div className="mt-2">
                        <span className="text-3xl font-bold">
                          {formatPrice(plan.price)}
                        </span>
                        <span className="text-muted-foreground">
                          /{getIntervalText(plan)}
                        </span>
                      </div>
                      {plan.savings && (
                        <Badge variant="outline" className="mt-2 text-green-600 border-green-600">
                          {t('billing.save')} {plan.savings}%
                        </Badge>
                      )}
                    </CardHeader>

                    <CardContent className="flex-1">
                      <p className="text-sm text-muted-foreground text-center mb-4">
                        {getPlanDescription(plan, isPt)}
                      </p>
                      <ul className="space-y-2">
                        {features.map((feature) => (
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
                          {t('billing.currentPlan')}
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
                          {t('billing.changePlan')}
                        </Button>
                      ) : (
                        <div className="space-y-2 w-full">
                          <Button
                            className={`w-full ${isPopular ? 'bg-primary' : ''}`}
                            variant={isPopular ? 'default' : 'outline'}
                            onClick={() => handleCheckout(planId)}
                            disabled={!!checkoutLoading}
                          >
                            {checkoutLoading === planId ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : null}
                            {t('billing.subscribeNow')}
                          </Button>
                          {isPopular && (
                            <p className="text-xs text-center text-primary font-medium">
                              {isPt ? '✨ 7 dias grátis!' : '✨ 7 days free!'}
                            </p>
                          )}
                        </div>
                      )}
                    </CardFooter>
                  </Card>
                </motion.div>
              );
            })}
          </div>

          {/* Trial CTA Banner for non-subscribers */}
          {!subscription?.subscribed && (
            <Card className="mt-8 border-primary/30 bg-gradient-to-r from-primary/5 to-primary/10">
              <CardContent className="py-6">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-full">
                      <Sparkles className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{isPt ? '🚀 Comece seu trial grátis hoje!' : '🚀 Start your free trial today!'}</h3>
                      <p className="text-sm text-muted-foreground">
                        {isPt ? 'Experimente todos os recursos por 7 dias sem compromisso' : 'Try all features for 7 days with no commitment'}
                      </p>
                    </div>
                  </div>
                  <Button onClick={() => handleCheckout('annual')} className="shrink-0">
                    <Sparkles className="h-4 w-4 mr-2" />
                    {isPt ? 'Começar Trial Grátis' : 'Start Free Trial'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Payment Methods Info */}
          <div className="mt-10 text-center">
            <p className="text-sm text-muted-foreground mb-4">
              {t('billing.securePayment')}
            </p>
            <div className="flex justify-center items-center gap-3 flex-wrap">
              {/* Visa */}
              <div className="w-12 h-8 bg-card border rounded flex items-center justify-center">
                <svg viewBox="0 0 780 500" className="h-5 w-8">
                  <path fill="#1434CB" d="M40 0h700c22 0 40 18 40 40v420c0 22-18 40-40 40H40c-22 0-40-18-40-40V40C0 18 18 0 40 0z"/>
                  <path fill="#fff" d="M293.2 348.7l33.4-195.8h53.4l-33.4 195.8h-53.4zm246.3-191c-10.6-4-27.2-8.3-47.9-8.3-52.8 0-90 26.6-90.3 64.6-.3 28.1 26.5 43.8 46.7 53.2 20.8 9.6 27.8 15.7 27.7 24.3-.1 13.1-16.6 19.1-32 19.1-21.4 0-32.8-3-50.4-10.2l-6.9-3.1-7.5 44c12.5 5.5 35.6 10.2 59.6 10.5 56.1 0 92.6-26.2 93-66.8.2-22.3-14-39.2-44.8-53.2-18.7-9.1-30.1-15.1-30-24.3 0-8.1 9.7-16.8 30.6-16.8 17.5-.3 30.1 3.5 40 7.5l4.8 2.3 7.2-42.8zm137.6-4.8h-41.3c-12.8 0-22.4 3.5-28 16.3l-79.5 179.6h56.1s9.2-24.1 11.2-29.4l68.5.1c1.6 6.8 6.5 29.3 6.5 29.3H720L677.1 153zM620.4 290c4.4-11.3 21.4-54.7 21.4-54.7-.3.5 4.4-11.4 7.1-18.8l3.6 17s10.3 47 12.5 56.5h-44.6zM246.5 152.9l-52.3 133.6-5.6-27.2c-9.7-31.2-40-65.1-73.9-82l47.8 171.2 56.5-.1 84-195.5h-56.5z"/>
                  <path fill="#F9A533" d="M146.9 152.9H59.9l-.7 4c67 16.2 111.4 55.4 129.8 102.5l-18.7-89.9c-3.2-12.3-12.6-16.1-23.4-16.6z"/>
                </svg>
              </div>
              
              {/* Mastercard */}
              <div className="w-12 h-8 bg-card border rounded flex items-center justify-center">
                <svg viewBox="0 0 780 500" className="h-5 w-8">
                  <rect width="780" height="500" rx="40" fill="#000"/>
                  <circle cx="299.2" cy="250" r="158.3" fill="#EB001B"/>
                  <circle cx="480.8" cy="250" r="158.3" fill="#F79E1B"/>
                  <path fill="#FF5F00" d="M390 117.4c-38.9 30.1-63.9 77.4-63.9 130.6s25 100.5 63.9 130.6c38.9-30.1 63.9-77.4 63.9-130.6s-25-100.5-63.9-130.6z"/>
                </svg>
              </div>
              
              {/* Amex */}
              <div className="w-12 h-8 bg-[#006FCF] border rounded flex items-center justify-center">
                <span className="text-white text-[8px] font-bold">AMEX</span>
              </div>

              {/* Debit Card */}
              <div className="w-12 h-8 bg-card border rounded flex items-center justify-center">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </div>

              {/* Apple Pay */}
              <div className="w-12 h-8 bg-black border rounded flex items-center justify-center">
                <span className="text-white text-[8px] font-bold">Pay</span>
              </div>

              {/* Google Pay */}
              <div className="w-12 h-8 bg-card border rounded flex items-center justify-center">
                <span className="text-[8px] font-bold text-muted-foreground">GPay</span>
              </div>
              
              {/* Stripe */}
              <div className="w-12 h-8 bg-[#635BFF] border rounded flex items-center justify-center">
                <span className="text-white text-[8px] font-bold">Stripe</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AppLayout>
  );
}
