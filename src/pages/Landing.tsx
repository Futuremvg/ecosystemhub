import { motion } from 'framer-motion';
import { Shield, Zap, Cpu, ArrowRight, Globe, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { SUBSCRIPTION_PLANS, formatPrice } from '@/lib/stripe-config';

export default function Landing() {
  const navigate = useNavigate();

  // Sincronização exata com os planos do repositório
  const plans = [
    {
      id: 'free',
      name_pt: 'Gratuito',
      price: 0,
      currency: 'CAD',
      interval: 'month',
      features: ["Acesso ao Dashboard", "1 Agente Básico", "Relatórios Semanais"],
      highlight: false
    },
    {
      ...SUBSCRIPTION_PLANS.monthly,
      features: ["8 Agentes Silenciosos", "Dashboard God Mode", "Suporte Standard"],
      highlight: false
    },
    {
      ...SUBSCRIPTION_PLANS.quarterly,
      features: ["Tudo do Mensal", "Economia de 12%", "Análise de Anomalias"],
      highlight: true
    },
    {
      ...SUBSCRIPTION_PLANS.annual,
      features: ["Tudo do Trimestral", "Economia de 32%", "Suporte Prioritário", "Motor CAD Full"],
      highlight: false
    }
  ];

  return (
    <div className="min-h-screen w-full bg-transparent text-white font-light overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative h-screen flex flex-col items-center justify-center px-4">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="text-center space-y-8 max-w-4xl"
        >
          <div className="flex justify-center mb-6">
            <div className="px-4 py-1 rounded-full border border-primary/20 bg-primary/5 backdrop-blur-md">
              <span className="text-[10px] uppercase tracking-[0.4em] text-primary">The Silent Revolution</span>
            </div>
          </div>
          
          <h1 className="text-6xl md:text-8xl font-extralight tracking-tighter leading-none">
            Architecta <span className="text-primary">HUB</span>
          </h1>
          
          <p className="text-lg md:text-xl opacity-40 max-w-2xl mx-auto leading-relaxed font-extralight">
            O primeiro ecossistema de gestão autônoma. 8 agentes invisíveis trabalhando para que você nunca mais precise olhar para o back-office.
          </p>

          <div className="flex flex-col md:flex-row items-center justify-center gap-6 pt-8">
            <button 
              onClick={() => navigate('/auth')}
              className="group relative px-8 py-4 bg-primary text-black text-xs uppercase tracking-[0.2em] font-medium rounded-full overflow-hidden transition-all hover:scale-105"
            >
              <span className="relative z-10 flex items-center gap-2">
                Iniciar Transfusão <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </span>
            </button>
            <button 
              onClick={() => {
                const el = document.getElementById('pricing');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="text-xs uppercase tracking-[0.2em] opacity-40 hover:opacity-100 transition-opacity"
            >
              Ver Planos de Acesso
            </button>
          </div>
        </motion.div>

        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4 opacity-20">
          <div className="w-[1px] h-12 bg-gradient-to-b from-primary to-transparent" />
          <span className="text-[10px] uppercase tracking-[0.3em]">Scroll to explore</span>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-32 px-8 bg-black/20 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              {
                title: "Silent Engine",
                desc: "8 agentes de IA que processam, classificam e otimizam sua empresa em tempo real.",
                icon: Cpu
              },
              {
                title: "God Mode UI",
                desc: "Uma interface desenhada para o executivo moderno. Sem ruído, apenas clareza.",
                icon: Shield
              },
              {
                title: "CAD Financial",
                desc: "Motor financeiro nativo em CAD, pronto para o mercado global.",
                icon: Globe
              }
            ].map((feature, i) => (
              <motion.div 
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.2 }}
                className="p-8 rounded-2xl border border-white/5 bg-white/5 hover:bg-white/10 transition-colors"
              >
                <feature.icon className="w-8 h-8 text-primary mb-6 opacity-80" />
                <h3 className="text-xl font-light mb-4 tracking-tight">{feature.title}</h3>
                <p className="text-sm opacity-40 leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section - Corrigido com os 4 planos reais */}
      <section id="pricing" className="py-32 px-8 relative">
        <div className="max-w-7xl mx-auto text-center space-y-16">
          <div className="space-y-4">
            <h2 className="text-4xl font-extralight tracking-tight">Escolha seu Nível de Acesso</h2>
            <p className="text-sm opacity-40 uppercase tracking-widest">Transparência total em CAD</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {plans.map((plan) => (
              <div 
                key={plan.id}
                className={`glass-panel p-8 rounded-3xl border ${plan.highlight ? 'border-primary/40 bg-primary/5' : 'border-white/5'} relative flex flex-col text-left transition-all hover:border-white/20`}
              >
                {plan.highlight && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary text-black text-[10px] font-bold uppercase tracking-widest rounded-full">
                    Popular
                  </div>
                )}
                
                <div className="mb-8">
                  <h3 className="text-lg font-light mb-2">{plan.name_pt}</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-extralight tracking-tighter">
                      {plan.price === 0 ? 'Grátis' : formatPrice(plan.price, plan.currency)}
                    </span>
                    {plan.price > 0 && (
                      <span className="text-[10px] opacity-30 uppercase tracking-widest">
                        / {plan.interval === 'year' ? 'ano' : plan.id === 'quarterly' ? '3 meses' : 'mês'}
                      </span>
                    )}
                  </div>
                </div>

                <ul className="space-y-4 mb-10 flex-1">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3 text-[11px] opacity-60 leading-tight">
                      <Check className="w-3 h-3 text-primary shrink-0 mt-0.5" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <button 
                  onClick={() => navigate(`/auth?plan=${plan.id}`)}
                  className={`w-full py-4 rounded-xl text-[10px] uppercase tracking-[0.2em] font-bold transition-all ${
                    plan.highlight 
                    ? 'bg-primary text-black hover:scale-[1.02]' 
                    : 'bg-white/5 text-white hover:bg-white/10'
                  }`}
                >
                  {plan.price === 0 ? 'Começar Agora' : 'Selecionar'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-8 border-t border-white/5 text-center">
        <span className="text-[10px] uppercase tracking-[0.3em] opacity-20">
          © 2026 Futuremvg • Architecta Ecosystem
        </span>
      </footer>
    </div>
  );
}
