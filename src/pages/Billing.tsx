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
              {t('billing.securePayment')}
            </p>
            <div className="flex justify-center items-center gap-4 flex-wrap">
              {/* Visa */}
              <div className="bg-card border rounded-lg px-3 py-2 shadow-sm hover:shadow-md transition-shadow">
                <svg viewBox="0 0 780 500" className="h-8 w-auto">
                  <path fill="#1434CB" d="M40 0h700c22 0 40 18 40 40v420c0 22-18 40-40 40H40c-22 0-40-18-40-40V40C0 18 18 0 40 0z"/>
                  <path fill="#fff" d="M293.2 348.7l33.4-195.8h53.4l-33.4 195.8h-53.4zm246.3-191c-10.6-4-27.2-8.3-47.9-8.3-52.8 0-90 26.6-90.3 64.6-.3 28.1 26.5 43.8 46.7 53.2 20.8 9.6 27.8 15.7 27.7 24.3-.1 13.1-16.6 19.1-32 19.1-21.4 0-32.8-3-50.4-10.2l-6.9-3.1-7.5 44c12.5 5.5 35.6 10.2 59.6 10.5 56.1 0 92.6-26.2 93-66.8.2-22.3-14-39.2-44.8-53.2-18.7-9.1-30.1-15.1-30-24.3 0-8.1 9.7-16.8 30.6-16.8 17.5-.3 30.1 3.5 40 7.5l4.8 2.3 7.2-42.8zm137.6-4.8h-41.3c-12.8 0-22.4 3.5-28 16.3l-79.5 179.6h56.1s9.2-24.1 11.2-29.4l68.5.1c1.6 6.8 6.5 29.3 6.5 29.3H720L677.1 153zM620.4 290c4.4-11.3 21.4-54.7 21.4-54.7-.3.5 4.4-11.4 7.1-18.8l3.6 17s10.3 47 12.5 56.5h-44.6zM246.5 152.9l-52.3 133.6-5.6-27.2c-9.7-31.2-40-65.1-73.9-82l47.8 171.2 56.5-.1 84-195.5h-56.5z"/>
                  <path fill="#F9A533" d="M146.9 152.9H59.9l-.7 4c67 16.2 111.4 55.4 129.8 102.5l-18.7-89.9c-3.2-12.3-12.6-16.1-23.4-16.6z"/>
                </svg>
              </div>
              
              {/* Mastercard */}
              <div className="bg-card border rounded-lg px-3 py-2 shadow-sm hover:shadow-md transition-shadow">
                <svg viewBox="0 0 780 500" className="h-8 w-auto">
                  <path d="M40 0h700c22 0 40 18 40 40v420c0 22-18 40-40 40H40c-22 0-40-18-40-40V40C0 18 18 0 40 0z"/>
                  <circle cx="299.2" cy="250" r="158.3" fill="#EB001B"/>
                  <circle cx="480.8" cy="250" r="158.3" fill="#F79E1B"/>
                  <path fill="#FF5F00" d="M390 117.4c-38.9 30.1-63.9 77.4-63.9 130.6s25 100.5 63.9 130.6c38.9-30.1 63.9-77.4 63.9-130.6s-25-100.5-63.9-130.6z"/>
                </svg>
              </div>
              
              {/* Amex */}
              <div className="bg-card border rounded-lg px-3 py-2 shadow-sm hover:shadow-md transition-shadow">
                <svg viewBox="0 0 780 500" className="h-8 w-auto">
                  <path fill="#006FCF" d="M40 0h700c22 0 40 18 40 40v420c0 22-18 40-40 40H40c-22 0-40-18-40-40V40C0 18 18 0 40 0z"/>
                  <path fill="#fff" d="M.3 221H67l15-34.3 15.2 34.3h132v-26.2l11.8 26.3h68.4l11.8-26.6v26.5h327.4l-.2-57h6.2c4.4.1 5.6.5 5.6 7.5v49.5h169.4v-13.3c13.7 7 35 13.3 63 13.3h71.1l15.2-34.3 15.2 34.3h137.6v-32.5l20.8 32.5h110.1V126.9H927.8v25.4l-15.2-25.4h-111.5v25.4l-14-25.4H673.5c-25.7 0-48.3 3.4-66.5 12.9v-12.9H503.7v12.9c-11.5-9.8-27.2-12.9-44.2-12.9H172.5l-25.7 56.2-26.4-56.2H.3V221zm227.6-23.9h-36.5l-.1-60.1-51.6 60.1h-31.2V144.7h36.2v59.4l50.6-59.4h32.6v52.4zm116.7 0h-118V144.7h118v26h-81.3v11.1h79.4v25.3h-79.4v11.9h81.3v28.1zm105.5-56.5c6.2 6.5 9.5 14.7 9.5 28.1 0 28.5-18.7 28.4-51.7 28.4h-54.6V144.7h55.9c26.9 0 43.6.8 55.4 11.7 6.1 5.6 9.2 12.5 9.2 22.1 0 15.8-10.9 23.9-23.7 28.3zm-28.6-35.8h-20.3v20.2h20.5c9.6 0 15.3-3.8 15.3-10.3 0-7.3-5.4-9.9-15.5-9.9zm44.6 92.3h-40.9l-25.7-30.3h-14.2v30.3H349V177.9c20.5-.2 41.5 0 55.9 8.2 8.7 5.1 15.2 12.4 15.2 26.5 0 19.5-13.5 29.7-25.5 32l28.5 34.5zm232.9 0h-51.5l-30.7-36.2-31.8 36.2h-104.1V144.7h106.4l30.8 35.7 31.5-35.7h50.3l-54.3 60.3 53.4 60.1zm147.7-1.1c-10.3 6.5-24.2 7.5-48.7 7.5h-63.4v-26.7h63.1c6.2 0 10.6-.4 13-2.6 2-1.9 3.3-4.5 3.3-7.6 0-3.4-1.4-6.1-3.5-7.8-2.1-1.7-5.2-2.5-11.3-2.5-30.2-.9-67.9.8-67.9-37.9 0-17.8 11.8-36.5 53.8-36.5h65.3v27.1h-59.7c-6 0-10 .2-12.8 2.3-3.1 2.1-4.3 5.2-4.3 9.3 0 4.9 3 8.2 7.1 9.6 3.5 1.1 7.2 1.4 12.8 1.4l17.7.4c17.9.4 30.1 3.5 37.6 10.7 6.6 6.4 10.2 14.6 10.2 28.4 0 30.5-20.1 38.5-37.3 46.9z"/>
                </svg>
              </div>

              {/* Debit Card */}
              <div className="bg-card border rounded-lg px-3 py-2 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2 h-8">
                  <CreditCard className="h-6 w-6 text-blue-600" />
                  <span className="text-xs font-semibold text-blue-600">{isPt ? 'Débito' : 'Debit'}</span>
                </div>
              </div>

              {/* Apple Pay */}
              <div className="bg-card border rounded-lg px-3 py-2 shadow-sm hover:shadow-md transition-shadow">
                <svg viewBox="0 0 165 105" className="h-8 w-auto">
                  <path d="M150.7 0H14.3C6.4 0 0 6.4 0 14.3v76.4C0 98.6 6.4 105 14.3 105h136.4c7.9 0 14.3-6.4 14.3-14.3V14.3C165 6.4 158.6 0 150.7 0z"/>
                  <path fill="#fff" d="M43.3 35.2c-2.6 3-6.8 5.4-10.8 5.1-.5-4 1.5-8.3 3.8-10.9 2.6-3.1 7.1-5.4 10.7-5.5.4 4.1-1.2 8.2-3.7 11.3m3.6 5.8c-6-.4-11 3.4-13.9 3.4s-7.2-3.3-11.9-3.2c-6.1.1-11.8 3.6-14.9 9.1-6.4 11-1.6 27.4 4.5 36.4 3 4.5 6.7 9.4 11.4 9.2 4.5-.2 6.3-3 11.8-3s7.1 3 11.9 2.9c5-.1 8.1-4.5 11.1-9 3.5-5.1 4.9-10.1 5-10.3-.1-.1-9.6-3.7-9.7-14.7-.1-9.2 7.5-13.6 7.9-13.9-4.4-6.4-11.1-7.1-13.4-7.3M82.1 25.7v68.8h10.5V71.2h14.5c13.3 0 22.6-9.1 22.6-22.8 0-13.6-9.2-22.7-22.4-22.7H82.1zm10.5 9h12.1c9.1 0 14.3 4.9 14.3 13.6s-5.2 13.7-14.4 13.7H92.6V34.7zm58.2 60.2c6.6 0 12.7-3.3 15.5-8.6h.2v8.1h9.7V59.3c0-9.8-7.8-16-19.8-16-11.1 0-19.3 6.3-19.6 15h9.4c.8-4.1 4.7-6.8 9.9-6.8 6.4 0 10 3 10 8.4v3.7l-13 .8c-12.2.7-18.8 5.7-18.8 14.4 0 8.8 6.8 14.9 16.5 14.9zm2.8-8c-5.6 0-9.1-2.7-9.1-6.8 0-4.3 3.4-6.7 10-7.1l11.6-.7v3.8c0 6.3-5.3 10.8-12.5 10.8z"/>
                </svg>
              </div>

              {/* Google Pay */}
              <div className="bg-card border rounded-lg px-3 py-2 shadow-sm hover:shadow-md transition-shadow">
                <svg viewBox="0 0 435 173" className="h-8 w-auto">
                  <path fill="#5F6368" d="M206.2 84.7v50.5h-16V8.8h42.4c10.2 0 18.9 3.4 26 10.2 7.3 6.8 10.9 15.1 10.9 24.9 0 10-3.6 18.4-10.9 25.1-7 6.7-15.7 10.1-26 10.1h-26.4v5.6zm0-60.3v39h26.8c6 0 11-1.9 15-5.8 4.1-3.9 6.1-8.7 6.1-14.4 0-5.6-2-10.4-6.1-14.3-4-3.8-9-5.8-15-5.8h-26.8v1.3zm110.1 21.4c11.8 0 21.1 3.1 28 9.4 6.9 6.3 10.3 14.9 10.3 25.9v52.4h-15.3v-11.8h-.7c-6.6 9.6-15.4 14.5-26.3 14.5-9.3 0-17.1-2.8-23.4-8.3-6.3-5.5-9.4-12.4-9.4-20.6 0-8.7 3.3-15.6 9.9-20.7 6.6-5.1 15.4-7.7 26.4-7.7 9.4 0 17.1 1.7 23.2 5.2v-3.6c0-5.5-2.2-10.1-6.5-14-4.3-3.8-9.4-5.7-15.2-5.7-8.8 0-15.7 3.7-20.8 11.1l-14.1-8.9c7.6-11 18.9-16.5 34-16.5l-.1.3zm-20.5 62.4c0 4.1 1.8 7.6 5.3 10.3 3.5 2.7 7.7 4.1 12.4 4.1 6.7 0 12.6-2.5 17.6-7.5 5-5 7.6-10.8 7.6-17.3-4.9-4-11.8-6-20.6-6-6.4 0-11.8 1.6-16 4.7-4.2 3.2-6.3 7-6.3 11.7zm155.5-59.7l-53.4 122.9h-16.6l19.8-42.8-35.2-80.1h17.5l25.5 61.6h.3l24.9-61.6h17.2z"/>
                  <path fill="#4285F4" d="M87.2 66.7c0-5-0.4-9.8-1.2-14.5H44.6v27.4h24c-1 5.6-4.2 10.5-9 13.7v11.2h14.5c8.5-7.8 13.4-19.4 13.4-37.8h-.3z"/>
                  <path fill="#34A853" d="M44.6 116.5c12.2 0 22.4-4 29.9-10.9l-14.5-11.2c-4 2.7-9.2 4.4-15.4 4.4-11.8 0-21.8-8-25.4-18.7H4.2v11.6c7.5 14.9 23 25 40.4 25l0-.2z"/>
                  <path fill="#FBBC05" d="M19.2 80c-1-2.9-1.5-6-1.5-9.2 0-3.2.5-6.3 1.5-9.2V50H4.2C1.5 55.3 0 61.4 0 67.8c0 6.4 1.5 12.5 4.2 17.8l15-5.6z"/>
                  <path fill="#EA4335" d="M44.6 33.9c6.7 0 12.6 2.3 17.3 6.8l13-13c-7.9-7.3-18.1-11.8-30.3-11.8-17.4 0-32.9 10-40.4 25L19.2 52.5c3.5-10.8 13.5-18.6 25.4-18.6z"/>
                </svg>
              </div>
              
              {/* Stripe */}
              <div className="bg-[#635BFF] border rounded-lg px-4 py-2 shadow-sm hover:shadow-md transition-shadow">
                <svg viewBox="0 0 60 25" className="h-5 w-auto">
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
