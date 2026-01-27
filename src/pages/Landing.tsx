import { motion } from 'framer-motion';
import { Shield, Zap, Cpu, ArrowRight, Globe, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { SUBSCRIPTION_PLANS, formatPrice } from '@/lib/stripe-config';
import { useAppSettings } from '@/contexts/AppSettingsContext';
import { Button } from '@/components/ui/button';
import { useIsMobile, useIsMobileOrTablet } from '@/hooks/use-mobile';
import { Card, CardContent } from '@/components/ui/card';

export default function Landing() {
  const navigate = useNavigate();
  const { language, setLanguage, t } = useAppSettings();
  const isPt = language === 'pt-BR';
  const isMobile = useIsMobile();
  const isMobileOrTablet = useIsMobileOrTablet();

  const content = {
    badge: isPt ? 'A Revolução Silenciosa' : 'The Silent Revolution',
    headline: 'Architecta',
    tagline: isPt 
      ? 'O primeiro ecossistema de gestão autônoma. 8 agentes invisíveis trabalhando para que você nunca mais precise olhar para o back-office.'
      : 'The first autonomous management ecosystem. 8 invisible agents working so you never have to look at the back-office again.',
    ctaPrimary: isPt ? 'Iniciar Agora' : 'Get Started',
    ctaSecondary: isPt ? 'Ver Planos' : 'View Plans',
    scroll: isPt ? 'Role para explorar' : 'Scroll to explore',
    pricing: {
      title: isPt ? 'Escolha seu Nível' : 'Choose Your Level',
      subtitle: isPt ? 'Transparência total em CAD' : 'Full transparency in CAD',
      popular: isPt ? 'Popular' : 'Popular',
      startNow: isPt ? 'Começar' : 'Start',
      select: isPt ? 'Selecionar' : 'Select',
    },
    features: [
      {
        title: 'Silent Engine',
        desc: isPt 
          ? '8 agentes de IA que processam e otimizam sua empresa.'
          : '8 AI agents that process and optimize your business.',
        icon: Cpu
      },
      {
        title: 'God Mode UI',
        desc: isPt 
          ? 'Interface desenhada para o executivo moderno.'
          : 'Interface designed for the modern executive.',
        icon: Shield
      },
      {
        title: 'CAD Financial',
        desc: isPt 
          ? 'Motor financeiro nativo em CAD.'
          : 'Native CAD financial engine.',
        icon: Globe
      }
    ]
  };

  const plans = [
    {
      id: 'free',
      name: isPt ? 'Gratuito' : 'Free',
      price: 0,
      currency: 'CAD',
      interval: 'month',
      features: isPt 
        ? ["Acesso ao Dashboard", "1 Agente Básico", "Relatórios Semanais"]
        : ["Dashboard Access", "1 Basic Agent", "Weekly Reports"],
      highlight: false
    },
    {
      ...SUBSCRIPTION_PLANS.monthly,
      name: isPt ? SUBSCRIPTION_PLANS.monthly.name_pt : SUBSCRIPTION_PLANS.monthly.name_en,
      features: isPt 
        ? ["8 Agentes Silenciosos", "Dashboard God Mode", "Suporte Standard"]
        : ["8 Silent Agents", "God Mode Dashboard", "Standard Support"],
      highlight: false
    },
    {
      ...SUBSCRIPTION_PLANS.quarterly,
      name: isPt ? SUBSCRIPTION_PLANS.quarterly.name_pt : SUBSCRIPTION_PLANS.quarterly.name_en,
      features: isPt 
        ? ["Tudo do Mensal", "Economia de 12%", "Análise de Anomalias"]
        : ["Everything in Monthly", "Save 12%", "Anomaly Analysis"],
      highlight: true
    },
    {
      ...SUBSCRIPTION_PLANS.annual,
      name: isPt ? SUBSCRIPTION_PLANS.annual.name_pt : SUBSCRIPTION_PLANS.annual.name_en,
      features: isPt 
        ? ["Tudo do Trimestral", "Economia de 32%", "Suporte Prioritário"]
        : ["Everything in Quarterly", "Save 32%", "Priority Support"],
      highlight: false
    }
  ];

  const getIntervalLabel = (plan: any) => {
    if (plan.price === 0) return '';
    if (plan.interval === 'year') return isPt ? 'ano' : 'year';
    if (plan.id === 'quarterly') return isPt ? '3 meses' : '3 mo';
    return isPt ? 'mês' : 'mo';
  };

  // Show only 2 main plans on mobile for cleaner view
  const displayPlans = isMobile ? plans.filter(p => p.id === 'free' || p.highlight) : plans;

  return (
    <div className="min-h-screen w-full bg-transparent text-white font-light overflow-x-hidden">
      {/* Language Selector - Fixed Top Right */}
      <div className="fixed top-4 sm:top-6 right-4 sm:right-6 z-50 flex items-center gap-1 sm:gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLanguage('en-US')}
          className={`text-xs px-2 sm:px-3 py-1 rounded-full transition-all min-h-[36px] ${
            language === 'en-US' 
              ? 'bg-primary/20 text-primary border border-primary/30' 
              : 'text-white/50 hover:text-white hover:bg-white/5'
          }`}
        >
          🇺🇸 {!isMobile && 'EN'}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLanguage('pt-BR')}
          className={`text-xs px-2 sm:px-3 py-1 rounded-full transition-all min-h-[36px] ${
            language === 'pt-BR' 
              ? 'bg-primary/20 text-primary border border-primary/30' 
              : 'text-white/50 hover:text-white hover:bg-white/5'
          }`}
        >
          🇧🇷 {!isMobile && 'PT'}
        </Button>
      </div>

      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 py-20 sm:py-0">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="text-center space-y-6 sm:space-y-8 max-w-4xl"
        >
          <div className="flex justify-center mb-4 sm:mb-6">
            <div className="px-3 sm:px-4 py-1 rounded-full border border-primary/20 bg-primary/5 backdrop-blur-md">
              <span className="text-[9px] sm:text-[10px] uppercase tracking-[0.3em] sm:tracking-[0.4em] text-primary">{content.badge}</span>
            </div>
          </div>
          
          <h1 className="text-4xl sm:text-6xl md:text-8xl font-extralight tracking-tighter leading-none">
            {content.headline} <span className="text-primary">HUB</span>
          </h1>
          
          <p className="text-sm sm:text-lg md:text-xl opacity-40 max-w-2xl mx-auto leading-relaxed font-extralight px-4">
            {content.tagline}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 pt-6 sm:pt-8">
            <button 
              onClick={() => navigate('/auth')}
              className="group relative w-full sm:w-auto px-6 sm:px-8 py-4 bg-primary text-black text-xs uppercase tracking-[0.2em] font-medium rounded-full overflow-hidden transition-all hover:scale-105 min-h-[48px]"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                {content.ctaPrimary} <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </span>
            </button>
            <button 
              onClick={() => {
                const el = document.getElementById('pricing');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="text-xs uppercase tracking-[0.2em] opacity-40 hover:opacity-100 transition-opacity py-2 min-h-[44px]"
            >
              {content.ctaSecondary}
            </button>
          </div>
        </motion.div>

        {/* Scroll indicator - Hide on mobile */}
        {!isMobile && (
          <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4 opacity-20">
            <div className="w-[1px] h-12 bg-gradient-to-b from-primary to-transparent" />
            <span className="text-[10px] uppercase tracking-[0.3em]">{content.scroll}</span>
          </div>
        )}
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 sm:py-24 lg:py-32 px-4 sm:px-8 bg-black/20 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 lg:gap-12">
            {content.features.map((feature, i) => (
              <motion.div 
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="h-full bg-white/5 border-white/5 hover:bg-white/10 transition-colors">
                  <CardContent className="p-5 sm:p-8">
                    <feature.icon className="w-6 sm:w-8 h-6 sm:h-8 text-primary mb-4 sm:mb-6 opacity-80" />
                    <h3 className="text-lg sm:text-xl font-light mb-2 sm:mb-4 tracking-tight">{feature.title}</h3>
                    <p className="text-xs sm:text-sm opacity-40 leading-relaxed">{feature.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-16 sm:py-24 lg:py-32 px-4 sm:px-8 relative">
        <div className="max-w-7xl mx-auto text-center space-y-8 sm:space-y-16">
          <div className="space-y-3 sm:space-y-4">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extralight tracking-tight">{content.pricing.title}</h2>
            <p className="text-xs sm:text-sm opacity-40 uppercase tracking-widest">{content.pricing.subtitle}</p>
          </div>
          
          <div className={`grid gap-4 sm:gap-6 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'}`}>
            {displayPlans.map((plan) => (
              <Card
                key={plan.id}
                className={`relative flex flex-col text-left transition-all hover:border-white/20 ${
                  plan.highlight 
                    ? 'border-primary/40 bg-primary/5' 
                    : 'border-white/5 bg-card/40'
                }`}
              >
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 sm:px-4 py-1 bg-primary text-black text-[9px] sm:text-[10px] font-bold uppercase tracking-widest rounded-full">
                    {content.pricing.popular}
                  </div>
                )}
                
                <CardContent className="p-5 sm:p-8 flex flex-col flex-1">
                  <div className="mb-6 sm:mb-8">
                    <h3 className="text-base sm:text-lg font-light mb-2">{plan.name}</h3>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl sm:text-3xl font-extralight tracking-tighter">
                        {plan.price === 0 ? (isPt ? 'Grátis' : 'Free') : formatPrice(plan.price, plan.currency)}
                      </span>
                      {plan.price > 0 && (
                        <span className="text-[9px] sm:text-[10px] opacity-30 uppercase tracking-widest">
                          / {getIntervalLabel(plan)}
                        </span>
                      )}
                    </div>
                  </div>

                  <ul className="space-y-3 sm:space-y-4 mb-6 sm:mb-10 flex-1">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2 sm:gap-3 text-[11px] sm:text-xs opacity-60 leading-tight">
                        <Check className="w-3 h-3 text-primary shrink-0 mt-0.5" />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <button 
                    onClick={() => navigate(`/auth?plan=${plan.id}`)}
                    className={`w-full py-3 sm:py-4 rounded-xl text-[10px] sm:text-xs uppercase tracking-[0.15em] sm:tracking-[0.2em] font-bold transition-all min-h-[44px] ${
                      plan.highlight 
                      ? 'bg-primary text-black hover:scale-[1.02]' 
                      : 'bg-white/5 text-white hover:bg-white/10'
                    }`}
                  >
                    {plan.price === 0 ? content.pricing.startNow : content.pricing.select}
                  </button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* See all plans link on mobile */}
          {isMobile && (
            <button 
              onClick={() => navigate('/billing')}
              className="text-xs uppercase tracking-widest text-primary/70 hover:text-primary transition-colors py-2"
            >
              {isPt ? 'Ver todos os planos →' : 'See all plans →'}
            </button>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 sm:py-12 px-4 sm:px-8 border-t border-white/5 text-center">
        <span className="text-[9px] sm:text-[10px] uppercase tracking-[0.2em] sm:tracking-[0.3em] opacity-20">
          © 2026 Futuremvg • Architecta Ecosystem
        </span>
      </footer>
    </div>
  );
}
