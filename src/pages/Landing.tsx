import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Building2, DollarSign, FileText, Sparkles, 
  Check, ArrowRight, Receipt, FileSpreadsheet, MessageSquare,
  Star, TrendingUp, Clock, Lock, Smartphone, ChevronRight
} from "lucide-react";
import { SUBSCRIPTION_PLANS, formatPriceUSD } from "@/lib/stripe-config";
import { Logo } from "@/components/ui/Logo";

export default function Landing() {
  const navigate = useNavigate();
  const [lang, setLang] = useState<"pt" | "en">("pt");
  const isPt = lang === "pt";

  const features = [
    {
      icon: <Building2 className="w-6 h-6" />,
      title: isPt ? "Gestão de Empresas" : "Company Management",
      description: isPt 
        ? "Organize seu ecossistema com estrutura hierárquica" 
        : "Organize your ecosystem with hierarchical structure"
    },
    {
      icon: <DollarSign className="w-6 h-6" />,
      title: isPt ? "Controle Financeiro" : "Financial Control",
      description: isPt 
        ? "Acompanhe receitas, despesas e lucro em tempo real" 
        : "Track income, expenses and profit in real-time"
    },
    {
      icon: <FileText className="w-6 h-6" />,
      title: isPt ? "Documentos" : "Documents",
      description: isPt 
        ? "Armazene contratos e documentos importantes" 
        : "Store contracts and important documents"
    },
    {
      icon: <Receipt className="w-6 h-6" />,
      title: isPt ? "Scanner de Recibos" : "Receipt Scanner",
      description: isPt 
        ? "Digitalize recibos automaticamente com IA" 
        : "Automatically scan receipts with AI"
    },
    {
      icon: <FileSpreadsheet className="w-6 h-6" />,
      title: isPt ? "Importação de Extratos" : "Bank Import",
      description: isPt 
        ? "Importe extratos e categorize transações" 
        : "Import statements and categorize transactions"
    },
    {
      icon: <MessageSquare className="w-6 h-6" />,
      title: isPt ? "Assistente IA" : "AI Assistant",
      description: isPt 
        ? "Converse com seu Conselheiro Executivo" 
        : "Talk to your Executive Advisor"
    },
  ];

  const stats = [
    { value: "100%", label: isPt ? "Na Nuvem" : "Cloud" },
    { value: "24/7", label: isPt ? "Disponível" : "Available" },
    { value: "SSL", label: isPt ? "Seguro" : "Secure" },
    { value: "∞", label: isPt ? "Escalável" : "Scalable" },
  ];

  const benefits = [
    {
      icon: <Clock className="w-8 h-8" />,
      title: isPt ? "Economize Tempo" : "Save Time",
      description: isPt 
        ? "Automatize tarefas e foque no que importa"
        : "Automate tasks and focus on what matters"
    },
    {
      icon: <TrendingUp className="w-8 h-8" />,
      title: isPt ? "Decisões Melhores" : "Better Decisions",
      description: isPt 
        ? "Visão clara da saúde financeira"
        : "Clear view of financial health"
    },
    {
      icon: <Lock className="w-8 h-8" />,
      title: isPt ? "Dados Seguros" : "Secure Data",
      description: isPt 
        ? "Criptografia de ponta"
        : "Cutting-edge encryption"
    },
    {
      icon: <Smartphone className="w-8 h-8" />,
      title: isPt ? "Acesse de Qualquer Lugar" : "Access Anywhere",
      description: isPt 
        ? "Desktop, tablet ou celular"
        : "Desktop, tablet or mobile"
    },
  ];

  const testimonials = [
    {
      name: "Carlos Mendes",
      role: "CEO, Tech Solutions",
      content: isPt 
        ? "Revolucionou a forma como gerencio minhas 5 empresas!"
        : "Revolutionized how I manage my 5 companies!",
      avatar: "CM"
    },
    {
      name: "Ana Paula Silva",
      role: isPt ? "Consultora Financeira" : "Financial Consultant",
      content: isPt 
        ? "Meus clientes adoram os relatórios!"
        : "My clients love the reports!",
      avatar: "AP"
    },
    {
      name: "Roberto Santos",
      role: isPt ? "Empreendedor" : "Entrepreneur",
      content: isPt 
        ? "Finalmente um sistema que entende micro-empresas."
        : "Finally a system that understands small businesses.",
      avatar: "RS"
    },
  ];

  const howItWorks = [
    { step: "1", title: isPt ? "Crie sua conta" : "Create account", description: isPt ? "2 minutos, sem cartão" : "2 minutes, no card" },
    { step: "2", title: isPt ? "Configure empresas" : "Set up companies", description: isPt ? "Organize seu ecossistema" : "Organize your ecosystem" },
    { step: "3", title: isPt ? "Registre transações" : "Record transactions", description: isPt ? "Manual ou automático" : "Manual or automatic" },
    { step: "4", title: isPt ? "Visualize resultados" : "View results", description: isPt ? "Lucro em tempo real" : "Profit in real-time" },
  ];

  const fadeInUp = {
    initial: { opacity: 0, y: 40 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-100px" },
    transition: { duration: 0.6 }
  };

  return (
    <div className="min-h-screen bg-black overflow-x-hidden">
      {/* Netflix-style Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-black/90 to-transparent">
        <div className="container mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo className="w-10 h-10" />
            <span className="font-black text-xl md:text-2xl text-white tracking-tight">ECOSYSTEM</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-white/10 rounded-md p-0.5 backdrop-blur">
              <button
                onClick={() => setLang("pt")}
                className={`px-3 py-1.5 text-xs font-medium rounded transition-all ${
                  isPt ? "bg-white text-black" : "text-white/70 hover:text-white"
                }`}
              >
                PT
              </button>
              <button
                onClick={() => setLang("en")}
                className={`px-3 py-1.5 text-xs font-medium rounded transition-all ${
                  !isPt ? "bg-white text-black" : "text-white/70 hover:text-white"
                }`}
              >
                EN
              </button>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate("/auth")}
              className="text-white hover:text-white hover:bg-white/10"
            >
              {isPt ? "Entrar" : "Sign In"}
            </Button>
            <Button 
              size="sm" 
              onClick={() => navigate("/auth")} 
              className="bg-primary hover:bg-primary/90 text-white font-semibold hidden sm:flex"
            >
              {isPt ? "Começar" : "Get Started"}
            </Button>
          </div>
        </div>
      </header>

      {/* Netflix-style Hero */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-black via-zinc-900 to-black" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-orange-600/10 via-transparent to-transparent" />
        
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }} />
        
        <motion.div 
          className="absolute top-1/4 left-10 w-64 h-64 bg-primary/20 rounded-full blur-[100px]"
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ repeat: Infinity, duration: 8, ease: "easeInOut" }}
        />
        <motion.div 
          className="absolute bottom-1/4 right-10 w-80 h-80 bg-orange-500/15 rounded-full blur-[120px]"
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.4, 0.2, 0.4] }}
          transition={{ repeat: Infinity, duration: 10, ease: "easeInOut" }}
        />

        <div className="relative z-10 container mx-auto px-4 md:px-8 pt-20">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-5xl mx-auto"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Badge className="mb-6 px-4 py-2 bg-white/10 text-white border-white/20 backdrop-blur text-sm">
                <Sparkles className="w-4 h-4 mr-2 text-primary" />
                {isPt ? "7 dias grátis" : "7 days free"}
              </Badge>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-white mb-6 tracking-tight leading-[0.9]"
            >
              {isPt ? "GERENCIE" : "MANAGE"}
              <br />
              <span className="bg-gradient-to-r from-primary via-orange-500 to-red-500 bg-clip-text text-transparent">
                {isPt ? "TUDO" : "EVERYTHING"}
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="text-lg md:text-xl lg:text-2xl text-white/60 mb-10 max-w-2xl mx-auto font-light"
            >
              {isPt 
                ? "Finanças. Documentos. Empresas. Tudo em um só lugar com IA." 
                : "Finances. Documents. Companies. All in one place with AI."}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Button 
                size="lg" 
                onClick={() => navigate("/auth")} 
                className="bg-primary hover:bg-primary/90 text-white text-lg px-10 h-14 font-bold rounded-md shadow-2xl shadow-primary/30"
              >
                {isPt ? "Começar Agora" : "Get Started"}
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                className="bg-white/10 hover:bg-white/20 text-white border-white/30 text-lg px-10 h-14 font-semibold rounded-md backdrop-blur"
              >
                {isPt ? "Saiba Mais" : "Learn More"}
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="mt-12 flex flex-wrap justify-center gap-8 text-white/40"
            >
              {stats.map((stat, i) => (
                <div key={i} className="text-center">
                  <p className="text-2xl md:text-3xl font-bold text-white">{stat.value}</p>
                  <p className="text-xs uppercase tracking-wider">{stat.label}</p>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>

        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center pt-2">
            <motion.div 
              className="w-1.5 h-1.5 bg-white rounded-full"
              animate={{ y: [0, 12, 0], opacity: [1, 0.3, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
            />
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 md:py-32 bg-gradient-to-b from-black to-zinc-900">
        <div className="container mx-auto px-4 md:px-8">
          <motion.div {...fadeInUp} className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black text-white mb-4">
              {isPt ? "FUNCIONALIDADES" : "FEATURES"}
            </h2>
            <p className="text-white/50 text-lg max-w-xl mx-auto">
              {isPt ? "Tudo para dominar seus negócios" : "Everything to master your businesses"}
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {features.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                whileHover={{ scale: 1.02, y: -5 }}
                className="group"
              >
                <Card className="h-full bg-white/5 border-white/10 hover:border-primary/50 hover:bg-white/10 transition-all">
                  <CardContent className="p-6">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-orange-500 flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform">
                      {feature.icon}
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
                    <p className="text-white/50">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 md:py-32 bg-zinc-900">
        <div className="container mx-auto px-4 md:px-8">
          <motion.div {...fadeInUp} className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black text-white mb-4">
              {isPt ? "POR QUE ESCOLHER?" : "WHY CHOOSE US?"}
            </h2>
          </motion.div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-10">
            {benefits.map((benefit, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center group"
              >
                <motion.div 
                  className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-orange-500/20 flex items-center justify-center text-primary mx-auto mb-4 group-hover:from-primary group-hover:to-orange-500 group-hover:text-white transition-all"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                >
                  {benefit.icon}
                </motion.div>
                <h3 className="text-lg md:text-xl font-bold text-white mb-2">{benefit.title}</h3>
                <p className="text-sm text-white/50">{benefit.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 md:py-32 bg-gradient-to-b from-zinc-900 to-black">
        <div className="container mx-auto px-4 md:px-8">
          <motion.div {...fadeInUp} className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black text-white mb-4">
              {isPt ? "COMO FUNCIONA" : "HOW IT WORKS"}
            </h2>
          </motion.div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 max-w-4xl mx-auto">
            {howItWorks.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="text-center relative"
              >
                <motion.div 
                  className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-gradient-to-br from-primary to-orange-500 text-white flex items-center justify-center text-2xl font-black mx-auto mb-4"
                  whileHover={{ scale: 1.1 }}
                >
                  {step.step}
                </motion.div>
                {i < howItWorks.length - 1 && (
                  <ChevronRight className="absolute top-7 -right-1 w-4 h-4 text-white/30 hidden lg:block" />
                )}
                <h3 className="text-sm md:text-base font-bold text-white mb-1">{step.title}</h3>
                <p className="text-xs text-white/50">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 md:py-32 bg-black">
        <div className="container mx-auto px-4 md:px-8">
          <motion.div {...fadeInUp} className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black text-white mb-4">
              {isPt ? "DEPOIMENTOS" : "TESTIMONIALS"}
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {testimonials.map((testimonial, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -5 }}
              >
                <Card className="h-full bg-white/5 border-white/10">
                  <CardContent className="p-6">
                    <div className="flex gap-1 mb-4">
                      {[...Array(5)].map((_, j) => (
                        <Star key={j} className="w-4 h-4 fill-primary text-primary" />
                      ))}
                    </div>
                    <p className="text-white/70 mb-6 italic">"{testimonial.content}"</p>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-orange-500 flex items-center justify-center text-white font-bold text-sm">
                        {testimonial.avatar}
                      </div>
                      <div>
                        <p className="font-semibold text-white">{testimonial.name}</p>
                        <p className="text-xs text-white/50">{testimonial.role}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* GodMode Highlight */}
      <section className="py-20 md:py-32 bg-gradient-to-r from-primary/10 via-orange-500/5 to-transparent overflow-hidden">
        <div className="container mx-auto px-4 md:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <Badge className="mb-4 bg-yellow-500/20 text-yellow-500 border-yellow-500/30">
                <Sparkles className="w-3 h-3 mr-1" />
                {isPt ? "Exclusivo" : "Exclusive"}
              </Badge>
              <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
                GodMode AI
              </h2>
              <p className="text-white/60 mb-6 text-lg">
                {isPt 
                  ? "Seu Conselheiro Executivo Operacional. Converse por voz, obtenha insights estratégicos e tome decisões mais inteligentes."
                  : "Your Operational Executive Advisor. Talk by voice, get strategic insights and make smarter decisions."}
              </p>
              <ul className="space-y-3">
                {[
                  isPt ? "Análise de dados em tempo real" : "Real-time data analysis",
                  isPt ? "Recomendações personalizadas" : "Personalized recommendations",
                  isPt ? "Interface por voz" : "Voice interface"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-white/80">
                    <Check className="w-5 h-5 text-primary" />
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="w-full aspect-square bg-gradient-to-br from-primary/20 to-orange-500/20 rounded-3xl flex items-center justify-center">
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ repeat: Infinity, duration: 3 }}
                  className="w-32 h-32 rounded-full bg-gradient-to-br from-primary to-orange-500 flex items-center justify-center"
                >
                  <Sparkles className="w-16 h-16 text-white" />
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 md:py-32 bg-zinc-900">
        <div className="container mx-auto px-4 md:px-8">
          <motion.div {...fadeInUp} className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black text-white mb-4">
              {isPt ? "PLANOS" : "PRICING"}
            </h2>
            <p className="text-white/50 text-lg">
              {isPt ? "7 dias grátis em qualquer plano" : "7 days free on any plan"}
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {Object.values(SUBSCRIPTION_PLANS).map((plan, i) => (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -5 }}
              >
                <Card className={`h-full ${i === 1 ? 'bg-gradient-to-br from-primary/20 to-orange-500/20 border-primary/50' : 'bg-white/5 border-white/10'}`}>
                  <CardContent className="p-6">
                    <h3 className="text-xl font-bold text-white mb-2">{isPt ? plan.name_pt : plan.name_en}</h3>
                    <div className="mb-6">
                      <span className="text-4xl font-black text-white">{formatPriceUSD(plan.price)}</span>
                      <span className="text-white/50 text-sm">/{isPt ? plan.interval === 'year' ? 'ano' : 'mês' : plan.interval === 'year' ? 'yr' : 'mo'}</span>
                    </div>
                    <p className="text-white/60 text-sm mb-6">{isPt ? plan.description_pt : plan.description_en}</p>
                    {plan.savings && (
                      <Badge className="mb-4 bg-primary/20 text-primary border-primary/30">
                        {isPt ? `Economize ${plan.savings}%` : `Save ${plan.savings}%`}
                      </Badge>
                    )}
                    <Button 
                      onClick={() => navigate("/auth")}
                      className={`w-full ${i === 1 ? 'bg-primary hover:bg-primary/90' : 'bg-white/10 hover:bg-white/20'} text-white`}
                    >
                      {isPt ? "Começar Grátis" : "Start Free"}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 md:py-32 bg-gradient-to-t from-primary/20 to-black">
        <div className="container mx-auto px-4 md:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-6xl font-black text-white mb-6">
              {isPt ? "COMECE AGORA" : "START NOW"}
            </h2>
            <p className="text-white/60 text-xl mb-10 max-w-xl mx-auto">
              {isPt 
                ? "Junte-se a milhares de empreendedores que já transformaram seus negócios"
                : "Join thousands of entrepreneurs who have already transformed their businesses"}
            </p>
            <Button 
              size="lg" 
              onClick={() => navigate("/auth")} 
              className="bg-primary hover:bg-primary/90 text-white text-xl px-12 h-16 font-bold rounded-md shadow-2xl shadow-primary/30"
            >
              {isPt ? "Criar Conta Grátis" : "Create Free Account"}
              <ArrowRight className="w-6 h-6 ml-3" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-black border-t border-white/10">
        <div className="container mx-auto px-4 md:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Logo className="w-6 h-6" />
              <span className="font-bold text-white">ECOSYSTEM</span>
            </div>
            <p className="text-white/40 text-sm">
              © 2026 Ecosystem Hub. {isPt ? "Todos os direitos reservados." : "All rights reserved."}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
