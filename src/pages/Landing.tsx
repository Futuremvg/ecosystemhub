import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Building2, DollarSign, FileText, Sparkles, 
  Check, ArrowRight, Receipt, FileSpreadsheet, MessageSquare,
  Star, TrendingUp, Clock, Lock, Smartphone, ChevronDown
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
      icon: <Clock className="w-7 h-7" />,
      title: isPt ? "Economize Tempo" : "Save Time",
      description: isPt 
        ? "Automatize tarefas e foque no que importa"
        : "Automate tasks and focus on what matters"
    },
    {
      icon: <TrendingUp className="w-7 h-7" />,
      title: isPt ? "Decisões Melhores" : "Better Decisions",
      description: isPt 
        ? "Visão clara da saúde financeira"
        : "Clear view of financial health"
    },
    {
      icon: <Lock className="w-7 h-7" />,
      title: isPt ? "Dados Seguros" : "Secure Data",
      description: isPt 
        ? "Criptografia de ponta"
        : "Cutting-edge encryption"
    },
    {
      icon: <Smartphone className="w-7 h-7" />,
      title: isPt ? "Acesso Mobile" : "Mobile Access",
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
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face"
    },
    {
      name: "Ana Paula Silva",
      role: isPt ? "Consultora Financeira" : "Financial Consultant",
      content: isPt 
        ? "Meus clientes adoram os relatórios!"
        : "My clients love the reports!",
      image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face"
    },
    {
      name: "Roberto Santos",
      role: isPt ? "Empreendedor" : "Entrepreneur",
      content: isPt 
        ? "Finalmente um sistema que entende micro-empresas."
        : "Finally a system that understands small businesses.",
      image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face"
    },
  ];

  const howItWorks = [
    { step: "01", title: isPt ? "Crie sua conta" : "Create account", description: isPt ? "2 minutos, sem cartão" : "2 minutes, no card" },
    { step: "02", title: isPt ? "Configure empresas" : "Set up companies", description: isPt ? "Organize seu ecossistema" : "Organize your ecosystem" },
    { step: "03", title: isPt ? "Registre transações" : "Record transactions", description: isPt ? "Manual ou automático" : "Manual or automatic" },
    { step: "04", title: isPt ? "Visualize resultados" : "View results", description: isPt ? "Lucro em tempo real" : "Profit in real-time" },
  ];

  // Free plan features
  const freePlanFeatures = isPt 
    ? ["1 empresa", "20 transações/mês", "5 documentos", "Suporte por email"]
    : ["1 company", "20 transactions/mo", "5 documents", "Email support"];

  const fadeInUp = {
    initial: { opacity: 0, y: 30 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-50px" },
    transition: { duration: 0.5 }
  };

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Logo className="w-8 h-8" />
            <span className="font-bold text-lg">Architecta</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-muted rounded-full p-0.5 mr-2">
              <button
                onClick={() => setLang("pt")}
                className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all ${
                  isPt ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                🇧🇷 PT
              </button>
              <button
                onClick={() => setLang("en")}
                className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all ${
                  !isPt ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                🇺🇸 EN
              </button>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate("/auth")}>
              {isPt ? "Entrar" : "Sign In"}
            </Button>
            <Button size="sm" onClick={() => navigate("/auth")} className="hidden sm:flex">
              {isPt ? "Começar Grátis" : "Start Free"}
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section - Clean & Professional */}
      <section className="relative py-20 md:py-32 overflow-hidden">
        {/* Subtle gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-background" />
        <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-gradient-to-bl from-primary/10 to-transparent rounded-full blur-3xl" />
        
        <div className="relative container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-4xl mx-auto"
          >
            <Badge variant="secondary" className="mb-6 px-4 py-2">
              <Sparkles className="w-4 h-4 mr-2 text-primary" />
              {isPt ? "7 dias grátis para testar" : "7 days free trial"}
            </Badge>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 leading-tight">
              {isPt ? "Gerencie Todas as Suas" : "Manage All Your"}
              <br />
              <span className="text-primary">
                {isPt ? "Empresas em Um Só Lugar" : "Companies in One Place"}
              </span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              {isPt 
                ? "Finanças, documentos e operações unificados. Com assistente de IA para decisões estratégicas." 
                : "Unified finances, documents and operations. With AI assistant for strategic decisions."}
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
              <Button 
                size="lg" 
                onClick={() => navigate("/auth")} 
                className="text-base px-8 h-12"
              >
                {isPt ? "Começar Grátis" : "Start Free"}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                className="h-12"
              >
                {isPt ? "Ver Recursos" : "See Features"}
                <ChevronDown className="w-4 h-4 ml-2" />
              </Button>
            </div>

            <p className="text-sm text-muted-foreground">
              {isPt ? "✓ Sem cartão de crédito   ✓ Setup em 2 min   ✓ Cancele quando quiser" : "✓ No credit card   ✓ 2 min setup   ✓ Cancel anytime"}
            </p>

            {/* Stats */}
            <div className="mt-16 grid grid-cols-4 gap-4 md:gap-8 max-w-2xl mx-auto">
              {stats.map((stat, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  className="text-center"
                >
                  <p className="text-2xl md:text-3xl font-bold text-primary">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 md:py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <motion.div {...fadeInUp} className="text-center mb-12">
            <h2 className="text-2xl md:text-4xl font-bold mb-3">
              {isPt ? "Tudo em Um Só Lugar" : "Everything in One Place"}
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              {isPt ? "Ferramentas poderosas para gerenciar seu ecossistema" : "Powerful tools to manage your ecosystem"}
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
            {features.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="h-full hover:shadow-md transition-shadow border-border/50">
                  <CardContent className="p-5">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-3">
                      {feature.icon}
                    </div>
                    <h3 className="font-semibold mb-1">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <motion.div {...fadeInUp} className="text-center mb-12">
            <h2 className="text-2xl md:text-4xl font-bold mb-3">
              {isPt ? "Por Que Escolher?" : "Why Choose Us?"}
            </h2>
          </motion.div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {benefits.map((benefit, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center text-primary mx-auto mb-3">
                  {benefit.icon}
                </div>
                <h3 className="font-semibold mb-1">{benefit.title}</h3>
                <p className="text-xs text-muted-foreground">{benefit.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works - Clean cards */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <motion.div {...fadeInUp} className="text-center mb-12">
            <h2 className="text-2xl md:text-4xl font-bold mb-3">
              {isPt ? "Como Funciona" : "How It Works"}
            </h2>
          </motion.div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {howItWorks.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="h-full text-center border-border/50">
                  <CardContent className="p-5">
                    <span className="text-3xl font-bold text-primary/20">{step.step}</span>
                    <h3 className="font-semibold mt-2 mb-1">{step.title}</h3>
                    <p className="text-xs text-muted-foreground">{step.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials with real photos */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <motion.div {...fadeInUp} className="text-center mb-12">
            <h2 className="text-2xl md:text-4xl font-bold mb-3">
              {isPt ? "O Que Dizem Nossos Clientes" : "What Our Clients Say"}
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {testimonials.map((testimonial, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="h-full border-border/50">
                  <CardContent className="p-5">
                    <div className="flex gap-0.5 mb-3">
                      {[...Array(5)].map((_, j) => (
                        <Star key={j} className="w-4 h-4 fill-primary text-primary" />
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground mb-4 italic">"{testimonial.content}"</p>
                    <div className="flex items-center gap-3">
                      <img 
                        src={testimonial.image} 
                        alt={testimonial.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div>
                        <p className="font-semibold text-sm">{testimonial.name}</p>
                        <p className="text-xs text-muted-foreground">{testimonial.role}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* GodMode - Compact */}
      <section className="py-12 md:py-16 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center gap-8 max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="flex-1"
            >
              <Badge className="mb-3 bg-amber-500/20 text-amber-600 border-amber-500/30">
                <Sparkles className="w-3 h-3 mr-1" />
                {isPt ? "Exclusivo Pro" : "Pro Exclusive"}
              </Badge>
              <h3 className="text-xl md:text-2xl font-bold mb-2">GodMode AI</h3>
              <p className="text-muted-foreground text-sm mb-4">
                {isPt 
                  ? "Seu conselheiro executivo por voz. Insights estratégicos em tempo real."
                  : "Your executive advisor by voice. Real-time strategic insights."}
              </p>
              <ul className="space-y-2">
                {[
                  isPt ? "Análise de dados" : "Data analysis",
                  isPt ? "Recomendações" : "Recommendations",
                  isPt ? "Interface por voz" : "Voice interface"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-primary" />
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="w-24 h-24 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg"
            >
              <Sparkles className="w-10 h-10 text-white" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Pricing with FREE tier */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <motion.div {...fadeInUp} className="text-center mb-12">
            <h2 className="text-2xl md:text-4xl font-bold mb-3">
              {isPt ? "Planos e Preços" : "Plans & Pricing"}
            </h2>
            <p className="text-muted-foreground">
              {isPt ? "Comece grátis, escale quando precisar" : "Start free, scale when you need"}
            </p>
          </motion.div>

          <div className="grid md:grid-cols-4 gap-4 max-w-5xl mx-auto">
            {/* FREE Plan */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <Card className="h-full border-border/50">
                <CardContent className="p-5">
                  <h3 className="font-bold mb-1">{isPt ? "Grátis" : "Free"}</h3>
                  <div className="mb-4">
                    <span className="text-3xl font-bold">$0</span>
                    <span className="text-muted-foreground text-sm">/{isPt ? "mês" : "mo"}</span>
                  </div>
                  <ul className="space-y-2 mb-4">
                    {freePlanFeatures.map((feature, j) => (
                      <li key={j} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Check className="w-4 h-4 text-primary flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button 
                    onClick={() => navigate("/auth")}
                    variant="outline"
                    className="w-full"
                  >
                    {isPt ? "Começar" : "Get Started"}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            {/* Paid Plans */}
            {Object.values(SUBSCRIPTION_PLANS).map((plan, i) => (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: (i + 1) * 0.1 }}
              >
                <Card className={`h-full ${i === 1 ? 'border-primary shadow-md' : 'border-border/50'}`}>
                  <CardContent className="p-5">
                    {i === 1 && (
                      <Badge className="mb-2 bg-primary text-primary-foreground">
                        {isPt ? "Popular" : "Popular"}
                      </Badge>
                    )}
                    <h3 className="font-bold mb-1">{isPt ? plan.name_pt : plan.name_en}</h3>
                    <div className="mb-4">
                      <span className="text-3xl font-bold">{formatPriceUSD(plan.price)}</span>
                      <span className="text-muted-foreground text-sm">/{isPt ? (plan.interval === 'year' ? 'ano' : 'mês') : (plan.interval === 'year' ? 'yr' : 'mo')}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">{isPt ? plan.description_pt : plan.description_en}</p>
                    {plan.savings && (
                      <Badge variant="secondary" className="mb-3">
                        {isPt ? `Economize ${plan.savings}%` : `Save ${plan.savings}%`}
                      </Badge>
                    )}
                    <Button 
                      onClick={() => navigate("/auth")}
                      className={`w-full ${i === 1 ? '' : 'bg-primary/90'}`}
                    >
                      {isPt ? "7 Dias Grátis" : "7 Days Free"}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 text-center">
          <motion.div {...fadeInUp}>
            <h2 className="text-2xl md:text-4xl font-bold mb-4">
              {isPt ? "Pronto para Começar?" : "Ready to Get Started?"}
            </h2>
            <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
              {isPt 
                ? "Junte-se a empreendedores que já transformaram seus negócios"
                : "Join entrepreneurs who have already transformed their businesses"}
            </p>
            <Button 
              size="lg" 
              onClick={() => navigate("/auth")} 
              className="px-8 h-12"
            >
              {isPt ? "Criar Conta Grátis" : "Create Free Account"}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 border-t border-border">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Logo className="w-6 h-6" />
              <span className="font-semibold">Architecta</span>
            </div>
            <p className="text-muted-foreground text-sm">
              © 2026 Architecta. {isPt ? "Todos os direitos reservados." : "All rights reserved."}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
