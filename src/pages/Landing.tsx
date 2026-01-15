import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Building2, DollarSign, FileText, Sparkles, 
  Check, ArrowRight, Receipt, FileSpreadsheet, MessageSquare,
  Star, Clock, Target, Brain, Zap, FolderKanban, Briefcase,
  ChevronDown, HelpCircle
} from "lucide-react";
import { SUBSCRIPTION_PLANS, formatPriceUSD } from "@/lib/stripe-config";
import { Logo } from "@/components/ui/Logo";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function Landing() {
  const navigate = useNavigate();
  const [lang, setLang] = useState<"pt" | "en">("en");
  const isPt = lang === "pt";

  // Value proposition benefits
  const valueBenefits = [
    { 
      icon: <Clock className="w-5 h-5" />, 
      text: isPt ? "Economize horas toda semana" : "Save hours every week" 
    },
    { 
      icon: <FolderKanban className="w-5 h-5" />, 
      text: isPt ? "Organize projetos, ideias e finanças" : "Organize projects, ideas, and finances" 
    },
    { 
      icon: <Zap className="w-5 h-5" />, 
      text: isPt ? "Automatize tarefas repetitivas" : "Automate repetitive tasks" 
    },
    { 
      icon: <Brain className="w-5 h-5" />, 
      text: isPt ? "Tome decisões melhores e mais rápidas" : "Make faster, better decisions" 
    },
    { 
      icon: <Target className="w-5 h-5" />, 
      text: isPt ? "Mantenha o foco e o controle" : "Stay focused and in control" 
    },
    { 
      icon: <Briefcase className="w-5 h-5" />, 
      text: isPt ? "Pareça mais profissional" : "Look more professional" 
    },
  ];

  // Features (existing)
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

  // Testimonials
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

  // How it works
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

  // FAQ
  const faqs = [
    {
      question: isPt ? "Posso testar antes de pagar?" : "Can I try before paying?",
      answer: isPt 
        ? "Sim! Oferecemos 7 dias grátis em todos os planos pagos, sem necessidade de cartão de crédito."
        : "Yes! We offer 7 days free on all paid plans, no credit card required."
    },
    {
      question: isPt ? "Meus dados estão seguros?" : "Is my data secure?",
      answer: isPt 
        ? "Absolutamente. Usamos criptografia de ponta e servidores seguros. Seus dados nunca são compartilhados."
        : "Absolutely. We use cutting-edge encryption and secure servers. Your data is never shared."
    },
    {
      question: isPt ? "Posso cancelar a qualquer momento?" : "Can I cancel anytime?",
      answer: isPt 
        ? "Sim, você pode cancelar sua assinatura a qualquer momento sem taxas ou penalidades."
        : "Yes, you can cancel your subscription anytime with no fees or penalties."
    },
    {
      question: isPt ? "Funciona no celular?" : "Does it work on mobile?",
      answer: isPt 
        ? "Sim! A plataforma é totalmente responsiva e funciona em desktop, tablet e celular."
        : "Yes! The platform is fully responsive and works on desktop, tablet, and mobile."
    },
  ];

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

      {/* HERO SECTION - Results Focused */}
      <section className="relative py-20 md:py-32 overflow-hidden">
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

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 leading-tight tracking-tight">
              {isPt 
                ? "Gerencie seu negócio mais rápido, inteligente e com menos estresse."
                : "Run your business faster, smarter, and with less stress."}
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
              {isPt 
                ? "Todo seu planejamento, organização e automação em uma plataforma simples."
                : "All your planning, organization, and automation in one simple platform."}
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
              <Button 
                size="lg" 
                onClick={() => navigate("/auth")} 
                className="text-base px-8 h-12"
              >
                {isPt ? "Comece seu acesso grátis" : "Start your free access"}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                onClick={() => document.getElementById('value')?.scrollIntoView({ behavior: 'smooth' })}
                className="h-12"
              >
                {isPt ? "Saiba Mais" : "Learn More"}
                <ChevronDown className="w-4 h-4 ml-2" />
              </Button>
            </div>

            <p className="text-sm text-muted-foreground">
              {isPt 
                ? "✓ Sem cartão de crédito   ✓ Setup em 2 min   ✓ Cancele quando quiser" 
                : "✓ No credit card   ✓ 2 min setup   ✓ Cancel anytime"}
            </p>
          </motion.div>
        </div>
      </section>

      {/* VALUE PROPOSITION */}
      <section id="value" className="py-16 md:py-24 bg-muted/40">
        <div className="container mx-auto px-4">
          <motion.div {...fadeInUp} className="max-w-2xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold mb-10 text-center">
              {isPt ? "O que este sistema te ajuda a fazer" : "What this system helps you do"}
            </h2>

            <div className="grid gap-4">
              {valueBenefits.map((benefit, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className="flex items-center gap-4 bg-background rounded-lg p-4 border border-border/50 shadow-sm"
                >
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    {benefit.icon}
                  </div>
                  <span className="text-base md:text-lg font-medium">{benefit.text}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* WHO IT'S FOR */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <motion.div {...fadeInUp} className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-6">
              {isPt 
                ? "Feito para pessoas que querem clareza e resultados"
                : "Built for people who want clarity and results"}
            </h2>

            <p className="text-muted-foreground text-base md:text-lg leading-relaxed">
              {isPt 
                ? "Seja você um empresário, gerente de projetos, freelancer, ou apenas alguém que quer um sistema melhor para organizar sua vida, esta plataforma ajuda você a ser mais produtivo, focado e no controle."
                : "Whether you run a business, manage projects, work as a freelancer, or just want a better system to organize your life, this platform helps you stay productive, focused, and in control."}
            </p>
          </motion.div>
        </div>
      </section>

      {/* WHY IT WORKS */}
      <section className="py-16 md:py-24 bg-muted/40">
        <div className="container mx-auto px-4">
          <motion.div {...fadeInUp} className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-6">
              {isPt ? "Um sistema. Clareza total." : "One system. Total clarity."}
            </h2>

            <p className="text-muted-foreground text-base md:text-lg leading-relaxed">
              {isPt 
                ? "Ao invés de usar múltiplas ferramentas, anotações e planilhas, você tem um espaço organizado para planejar, acompanhar e executar tudo nos seus negócios ou projetos pessoais."
                : "Instead of using multiple tools, notes, and spreadsheets, you get one organized workspace to plan, track, and execute everything in your business or personal projects."}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <motion.div {...fadeInUp} className="text-center mb-12">
            <h2 className="text-2xl md:text-4xl font-bold mb-3">
              {isPt ? "Ferramentas Poderosas" : "Powerful Tools"}
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              {isPt ? "Tudo que você precisa para gerenciar seu ecossistema" : "Everything you need to manage your ecosystem"}
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

      {/* How It Works */}
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

      {/* Testimonials */}
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

      {/* GodMode AI */}
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
                  isPt ? "Análise de dados em tempo real" : "Real-time data analysis",
                  isPt ? "Recomendações estratégicas" : "Strategic recommendations",
                  isPt ? "Comando por voz" : "Voice commands"
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
              className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg"
            >
              <Sparkles className="w-10 h-10 md:w-14 md:h-14 text-white" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <motion.div {...fadeInUp} className="text-center mb-12">
            <h2 className="text-2xl md:text-4xl font-bold mb-3">
              {isPt ? "Planos Simples e Transparentes" : "Simple, Transparent Pricing"}
            </h2>
            <p className="text-muted-foreground">
              {isPt ? "Comece grátis, atualize quando quiser" : "Start free, upgrade when you need"}
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
            {/* Free Plan */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <Card className="h-full border-border/50 flex flex-col">
                <CardContent className="p-5 flex flex-col flex-1">
                  <h3 className="font-bold text-lg mb-1">{isPt ? "Grátis" : "Free"}</h3>
                  <p className="text-3xl font-bold mb-4">$0<span className="text-sm font-normal text-muted-foreground">/{isPt ? "mês" : "mo"}</span></p>
                  <ul className="space-y-2 mb-6 flex-1">
                    {freePlanFeatures.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm">
                        <Check className="w-4 h-4 text-primary shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button variant="outline" className="w-full" onClick={() => navigate("/auth")}>
                    {isPt ? "Começar Grátis" : "Start Free"}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            {/* Paid Plans */}
            {Object.values(SUBSCRIPTION_PLANS).map((plan, i) => {
              const isPopular = plan.id === 'quarterly';
              const isBestValue = plan.id === 'annual';
              
              return (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: (i + 1) * 0.1 }}
                  className="relative"
                >
                  {/* Highlight badge */}
                  {(isPopular || isBestValue) && (
                    <div className={`absolute -top-3 left-1/2 -translate-x-1/2 z-10`}>
                      <Badge className={`text-xs px-3 py-1 ${
                        isBestValue 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-amber-500 text-white'
                      }`}>
                        {isBestValue 
                          ? (isPt ? '🏆 Melhor Valor' : '🏆 Best Value')
                          : (isPt ? '⭐ Mais Popular' : '⭐ Most Popular')
                        }
                      </Badge>
                    </div>
                  )}
                  
                  <Card className={`h-full flex flex-col ${
                    isBestValue 
                      ? 'border-primary border-2 shadow-lg' 
                      : isPopular 
                        ? 'border-amber-500 border-2 shadow-md' 
                        : 'border-border/50'
                  }`}>
                    <CardContent className="p-5 flex flex-col flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-bold text-lg">{isPt ? plan.name_pt : plan.name_en}</h3>
                        <Badge variant="secondary" className="text-xs">
                          {isPt ? "7 dias grátis" : "7 days free"}
                        </Badge>
                      </div>
                      <p className="text-3xl font-bold mb-1">
                        {formatPriceUSD(plan.price)}
                        <span className="text-sm font-normal text-muted-foreground">
                          /{plan.id === 'monthly' ? (isPt ? 'mês' : 'mo') : 
                            plan.id === 'quarterly' ? (isPt ? 'trim' : 'qtr') : 
                            (isPt ? 'ano' : 'yr')}
                        </span>
                      </p>
                      {plan.savings && (
                        <p className="text-xs text-primary font-medium mb-4">{isPt ? `Economize ${plan.savings}%` : `Save ${plan.savings}%`}</p>
                      )}
                      {!plan.savings && <div className="mb-4" />}
                      <ul className="space-y-2 mb-6 flex-1">
                        {[
                          isPt ? "Empresas ilimitadas" : "Unlimited companies",
                          isPt ? "Transações ilimitadas" : "Unlimited transactions",
                          isPt ? "Documentos ilimitados" : "Unlimited documents",
                          "GodMode AI",
                          isPt ? "Scanner de recibos" : "Receipt scanner",
                          isPt ? "Import. de extratos" : "Bank import"
                        ].map((feature, j) => (
                          <li key={j} className="flex items-center gap-2 text-sm">
                            <Check className="w-4 h-4 text-primary shrink-0" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                      <Button 
                        className="w-full" 
                        variant={isBestValue ? 'default' : 'outline'}
                        onClick={() => navigate("/auth")}
                      >
                        {isPt ? "Começar Teste" : "Start Trial"}
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <motion.div {...fadeInUp} className="text-center mb-12">
            <h2 className="text-2xl md:text-4xl font-bold mb-3">
              {isPt ? "Perguntas Frequentes" : "Frequently Asked Questions"}
            </h2>
          </motion.div>

          <motion.div {...fadeInUp} className="max-w-2xl mx-auto">
            <Accordion type="single" collapsible className="space-y-2">
              {faqs.map((faq, i) => (
                <AccordionItem key={i} value={`faq-${i}`} className="bg-background rounded-lg border border-border/50 px-4">
                  <AccordionTrigger className="text-left font-medium hover:no-underline">
                    <span className="flex items-center gap-3">
                      <HelpCircle className="w-4 h-4 text-primary shrink-0" />
                      {faq.question}
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground pl-7">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </motion.div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 md:py-32">
        <div className="container mx-auto px-4">
          <motion.div {...fadeInUp} className="max-w-xl mx-auto text-center">
            <h2 className="text-2xl md:text-4xl font-bold mb-8">
              {isPt ? "Comece a usar o sistema hoje" : "Start using the system today"}
            </h2>

            <Button 
              size="lg" 
              onClick={() => navigate("/auth")} 
              className="text-base px-10 h-12"
            >
              {isPt ? "Experimente agora" : "Try it now"}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border">
        <div className="container mx-auto px-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Logo className="w-5 h-5" />
              <span className="text-sm text-muted-foreground">Architecta</span>
            </div>
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} Architecta. {isPt ? "Todos os direitos reservados." : "All rights reserved."}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
