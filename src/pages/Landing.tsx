import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Building2, DollarSign, FileText, Crown, Sparkles, 
  Check, ArrowRight, BarChart3, Shield, Zap,
  Receipt, FileSpreadsheet, MessageSquare, Globe,
  Star, Users, TrendingUp, Clock, Lock, Smartphone,
  Play, ChevronRight, Heart, Award, Target, Layers,
  Languages, MonitorSmartphone, ChevronLeft
} from "lucide-react";
import { SUBSCRIPTION_PLANS, formatPrice } from "@/lib/stripe-config";
import { Logo } from "@/components/ui/Logo";
import dashboardMockup from "@/assets/dashboard-mockup.png";
import companiesMockup from "@/assets/companies-mockup.png";
import financesMockup from "@/assets/finances-mockup.png";
import appDemoVideo from "@/assets/app-demo-video.mp4";

export default function Landing() {
  const navigate = useNavigate();
  const [lang, setLang] = useState<"pt" | "en">("pt");
  const [activeScreenshot, setActiveScreenshot] = useState(0);
  const isPt = lang === "pt";
  
  const screenshots = [
    { src: dashboardMockup, title: isPt ? "Dashboard Principal" : "Main Dashboard", desc: isPt ? "Visão geral de todas suas empresas" : "Overview of all your companies" },
    { src: companiesMockup, title: isPt ? "Gestão de Empresas" : "Company Management", desc: isPt ? "Organize seu ecossistema hierárquico" : "Organize your hierarchical ecosystem" },
    { src: financesMockup, title: isPt ? "Controle Financeiro" : "Financial Control", desc: isPt ? "Acompanhe receitas e despesas" : "Track income and expenses" },
  ];

  const features = [
    {
      icon: <Building2 className="w-6 h-6" />,
      title: isPt ? "Gestão de Empresas" : "Company Management",
      description: isPt 
        ? "Organize seu ecossistema de empresas com estrutura hierárquica" 
        : "Organize your company ecosystem with hierarchical structure"
    },
    {
      icon: <DollarSign className="w-6 h-6" />,
      title: isPt ? "Controle Financeiro" : "Financial Control",
      description: isPt 
        ? "Acompanhe receitas, despesas e lucro/prejuízo em tempo real" 
        : "Track income, expenses and profit/loss in real-time"
    },
    {
      icon: <FileText className="w-6 h-6" />,
      title: isPt ? "Documentos Organizados" : "Organized Documents",
      description: isPt 
        ? "Armazene e organize contratos, notas fiscais e documentos importantes" 
        : "Store and organize contracts, invoices and important documents"
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
      title: isPt ? "Importação de Extratos" : "Bank Statement Import",
      description: isPt 
        ? "Importe extratos bancários e categorize transações automaticamente" 
        : "Import bank statements and categorize transactions automatically"
    },
    {
      icon: <MessageSquare className="w-6 h-6" />,
      title: isPt ? "Assistente IA (GodMode)" : "AI Assistant (GodMode)",
      description: isPt 
        ? "Converse com seu Conselheiro Executivo Operacional por voz" 
        : "Talk to your Operational Executive Advisor by voice"
    },
  ];

  const stats = [
    { value: "100%", label: isPt ? "Na Nuvem" : "Cloud-Based" },
    { value: "24/7", label: isPt ? "Disponível" : "Available" },
    { value: "SSL", label: isPt ? "Seguro" : "Secure" },
    { value: "∞", label: isPt ? "Escalável" : "Scalable" },
  ];

  const benefits = [
    {
      icon: <Clock className="w-8 h-8" />,
      title: isPt ? "Economize Tempo" : "Save Time",
      description: isPt 
        ? "Automatize tarefas repetitivas e foque no que realmente importa"
        : "Automate repetitive tasks and focus on what really matters"
    },
    {
      icon: <TrendingUp className="w-8 h-8" />,
      title: isPt ? "Decisões Melhores" : "Better Decisions",
      description: isPt 
        ? "Visão clara da saúde financeira de todas as suas empresas"
        : "Clear view of the financial health of all your companies"
    },
    {
      icon: <Lock className="w-8 h-8" />,
      title: isPt ? "Dados Seguros" : "Secure Data",
      description: isPt 
        ? "Seus dados criptografados com tecnologia de ponta"
        : "Your data encrypted with cutting-edge technology"
    },
    {
      icon: <Smartphone className="w-8 h-8" />,
      title: isPt ? "Acesse de Qualquer Lugar" : "Access Anywhere",
      description: isPt 
        ? "Desktop, tablet ou celular - sempre na palma da mão"
        : "Desktop, tablet or mobile - always at your fingertips"
    },
  ];

  const testimonials = [
    {
      name: "Carlos Mendes",
      role: isPt ? "CEO, Tech Solutions" : "CEO, Tech Solutions",
      content: isPt 
        ? "Revolucionou a forma como gerencio minhas 5 empresas. O GodMode é incrível!"
        : "Revolutionized how I manage my 5 companies. GodMode is amazing!",
      avatar: "CM"
    },
    {
      name: "Ana Paula Silva",
      role: isPt ? "Consultora Financeira" : "Financial Consultant",
      content: isPt 
        ? "Meus clientes adoram os relatórios. Economizo horas toda semana!"
        : "My clients love the reports. I save hours every week!",
      avatar: "AP"
    },
    {
      name: "Roberto Santos",
      role: isPt ? "Empreendedor" : "Entrepreneur",
      content: isPt 
        ? "Finalmente um sistema que entende como micro-empresas funcionam."
        : "Finally a system that understands how small businesses work.",
      avatar: "RS"
    },
  ];

  const howItWorks = [
    {
      step: "1",
      title: isPt ? "Crie sua conta grátis" : "Create your free account",
      description: isPt 
        ? "Cadastre-se em menos de 2 minutos. Sem cartão."
        : "Sign up in less than 2 minutes. No card required."
    },
    {
      step: "2",
      title: isPt ? "Configure suas empresas" : "Set up your companies",
      description: isPt 
        ? "Adicione suas empresas e organize seu ecossistema."
        : "Add your companies and organize your ecosystem."
    },
    {
      step: "3",
      title: isPt ? "Registre transações" : "Record transactions",
      description: isPt 
        ? "Adicione receitas/despesas ou importe extratos."
        : "Add income/expenses or import statements."
    },
    {
      step: "4",
      title: isPt ? "Visualize resultados" : "View results",
      description: isPt 
        ? "Acompanhe lucro/prejuízo em tempo real."
        : "Track profit/loss in real-time."
    },
  ];

  // Fade in from bottom animation
  const fadeInUp = {
    initial: { opacity: 0, y: 40 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-100px" },
    transition: { duration: 0.6 }
  };

  // Stagger children animation
  const staggerContainer = {
    initial: {},
    whileInView: { transition: { staggerChildren: 0.1 } },
    viewport: { once: true }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30 overflow-x-hidden overflow-y-auto">
      {/* Header with Language Toggle */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border/40">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Logo className="w-8 h-8" />
            <span className="font-bold text-lg text-primary">Ecosystem Hub</span>
          </div>
          <div className="flex items-center gap-2">
            {/* Language Toggle */}
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

      {/* Hero Section with Parallax */}
      <section className="relative container mx-auto px-4 py-16 md:py-24 overflow-hidden">
        <motion.div
          className="text-center max-w-4xl mx-auto relative z-10"
        >
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Badge variant="secondary" className="mb-4 px-4 py-1.5 animate-pulse">
              <Sparkles className="w-3 h-3 mr-1" />
              {isPt ? "✨ 7 dias grátis para testar!" : "✨ 7 days free trial!"}
            </Badge>
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl md:text-6xl font-bold mb-6 leading-tight"
          >
            <span className="bg-gradient-to-r from-foreground via-foreground to-primary bg-clip-text text-transparent">
              {isPt 
                ? "Gerencie Múltiplas Empresas" 
                : "Manage Multiple Companies"}
            </span>
            <br />
            <span className="text-primary">
              {isPt ? "Como um Profissional" : "Like a Pro"}
            </span>
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto"
          >
            {isPt 
              ? "A única plataforma para controlar finanças, documentos e operações de todas as suas empresas. Com IA integrada para decisões estratégicas." 
              : "The only platform to control finances, documents and operations of all your companies. With integrated AI for strategic decisions."}
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-3 justify-center"
          >
            <Button size="lg" onClick={() => navigate("/auth")} className="text-base px-6 h-12 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all">
              {isPt ? "Começar Grátis Agora" : "Start Free Now"}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })} className="h-12">
              <Play className="w-4 h-4 mr-2" />
              {isPt ? "Como Funciona" : "How It Works"}
            </Button>
          </motion.div>
          
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-xs text-muted-foreground mt-4"
          >
            {isPt ? "✓ Sem cartão   ✓ 2 min setup   ✓ Cancele quando quiser" : "✓ No card   ✓ 2 min setup   ✓ Cancel anytime"}
          </motion.p>
        </motion.div>

        {/* App Preview with Parallax */}
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-12 relative"
        >
          <motion.div className="relative mx-auto max-w-5xl">
            {/* Browser Frame */}
            <div className="rounded-2xl border border-border bg-card shadow-2xl overflow-hidden">
              {/* Browser Header */}
              <div className="flex items-center gap-2 px-4 py-2.5 bg-muted/50 border-b border-border">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                </div>
                <div className="flex-1 mx-4">
                  <div className="bg-background rounded-md px-3 py-1 text-xs text-muted-foreground text-center max-w-[200px] mx-auto">
                    🔒 ecosystem-hub.app
                  </div>
                </div>
              </div>
              
              {/* Dashboard Mockup */}
              <div className="p-4 md:p-6 bg-gradient-to-br from-background to-muted/20">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-bold">{isPt ? "Bom dia! ✨" : "Good morning! ✨"}</h2>
                    <p className="text-xs text-muted-foreground">{isPt ? "Janeiro 15, 2026" : "January 15, 2026"}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Badge variant="outline" className="text-[10px]">💰 BRL</Badge>
                    <Badge variant="outline" className="text-[10px]">🇧🇷</Badge>
                  </div>
                </div>
                
                {/* P&L Cards */}
                <div className="grid grid-cols-3 gap-2 md:gap-3 mb-4">
                  <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-0">
                    <CardContent className="p-3 md:p-4">
                      <p className="text-[10px] md:text-xs text-muted-foreground">{isPt ? "Receita" : "Revenue"}</p>
                      <p className="text-lg md:text-2xl font-bold text-primary">R$ 45.3k</p>
                      <p className="text-[10px] text-green-600">↑ 12%</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-gradient-to-br from-destructive/10 to-destructive/5 border-0">
                    <CardContent className="p-3 md:p-4">
                      <p className="text-[10px] md:text-xs text-muted-foreground">{isPt ? "Despesas" : "Expenses"}</p>
                      <p className="text-lg md:text-2xl font-bold text-destructive">R$ 18.4k</p>
                      <p className="text-[10px] text-muted-foreground">↓ 5%</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-0">
                    <CardContent className="p-3 md:p-4">
                      <p className="text-[10px] md:text-xs text-muted-foreground">{isPt ? "Lucro" : "Profit"}</p>
                      <p className="text-lg md:text-2xl font-bold text-green-600">R$ 26.9k</p>
                      <p className="text-[10px] text-green-600">↑ 18%</p>
                    </CardContent>
                  </Card>
                </div>
                
                {/* Company Mini-cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {[
                    { name: "Tech Solutions", color: "bg-primary", amount: "25k" },
                    { name: "Marketing Pro", color: "bg-purple-500", amount: "12k" },
                    { name: "Consulting", color: "bg-orange-500", amount: "5.8k" },
                    { name: "Finance Co", color: "bg-teal-500", amount: "2k" },
                  ].map((company, i) => (
                    <Card key={i} className="border border-border/50">
                      <CardContent className="p-2 md:p-3 flex items-center gap-2">
                        <div className={`w-6 h-6 md:w-8 md:h-8 rounded-lg flex items-center justify-center text-white text-[10px] font-bold ${company.color}`}>
                          {company.name.charAt(0)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium truncate text-[10px] md:text-xs">{company.name}</p>
                          <p className="text-[10px] text-green-600">R$ {company.amount}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Floating badges with parallax */}
            <motion.div 
              className="absolute -top-3 -right-3 bg-green-500 text-white px-3 py-1.5 rounded-full text-xs font-medium shadow-lg"
              animate={{ y: [0, -8, 0] }}
              transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
            >
              <TrendingUp className="w-3 h-3 inline mr-1" />
              +26%
            </motion.div>
            
            <motion.div 
              className="absolute -bottom-3 -left-3 bg-primary text-primary-foreground px-3 py-1.5 rounded-full text-xs font-medium shadow-lg"
              animate={{ y: [0, 8, 0] }}
              transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut" }}
            >
              <Shield className="w-3 h-3 inline mr-1" />
              SSL
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Stats with stagger animation */}
        <motion.div 
          {...staggerContainer}
          className="mt-16 flex justify-center gap-6 md:gap-12 flex-wrap"
        >
          {stats.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="text-center"
            >
              <p className="text-3xl md:text-4xl font-bold text-primary">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Social Proof */}
      <section className="py-8 bg-muted/20 border-y border-border/30">
        <div className="container mx-auto px-4">
          <p className="text-center text-xs text-muted-foreground mb-4">
            {isPt ? "Usado por empreendedores que gerenciam múltiplos negócios" : "Used by entrepreneurs managing multiple businesses"}
          </p>
          <div className="flex justify-center items-center gap-6 md:gap-12 flex-wrap opacity-60">
            {["🏢", "🏗️", "💼", "🛍️", "🏥", "📚"].map((emoji, i) => (
              <motion.span 
                key={i} 
                className="text-3xl"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 0.6 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
              >
                {emoji}
              </motion.span>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section with parallax cards */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4">
          <motion.div {...fadeInUp} className="text-center mb-12">
            <Badge variant="secondary" className="mb-3">
              <Heart className="w-3 h-3 mr-1" />
              {isPt ? "Por que escolher?" : "Why choose us?"}
            </Badge>
            <h2 className="text-2xl md:text-4xl font-bold mb-3">
              {isPt ? "Benefícios que Transformam" : "Transformative Benefits"}
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-sm md:text-base">
              {isPt 
                ? "Mudança na forma como você gerencia seu ecossistema empresarial" 
                : "A change in how you manage your business ecosystem"}
            </p>
          </motion.div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {benefits.map((benefit, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
                className="text-center"
              >
                <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mx-auto mb-3">
                  {benefit.icon}
                </div>
                <h3 className="text-sm md:text-lg font-semibold mb-1">{benefit.title}</h3>
                <p className="text-xs md:text-sm text-muted-foreground">{benefit.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <motion.div {...fadeInUp} className="text-center mb-12">
            <Badge variant="secondary" className="mb-3">
              <Layers className="w-3 h-3 mr-1" />
              {isPt ? "Funcionalidades" : "Features"}
            </Badge>
            <h2 className="text-2xl md:text-4xl font-bold mb-3">
              {isPt ? "Tudo em Um Só Lugar" : "Everything in One Place"}
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
            {features.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, margin: "-30px" }}
                transition={{ delay: i * 0.08, duration: 0.5 }}
                whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
              >
                <Card className="h-full hover:shadow-lg transition-all border-border/50 hover:border-primary/30 group">
                  <CardContent className="p-4 md:p-5">
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-3 group-hover:scale-110 transition-transform">
                      {feature.icon}
                    </div>
                    <h3 className="text-base md:text-lg font-semibold mb-1">{feature.title}</h3>
                    <p className="text-xs md:text-sm text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-16 md:py-20">
        <div className="container mx-auto px-4">
          <motion.div {...fadeInUp} className="text-center mb-12">
            <Badge variant="secondary" className="mb-3">
              <Target className="w-3 h-3 mr-1" />
              {isPt ? "Como Funciona" : "How It Works"}
            </Badge>
            <h2 className="text-2xl md:text-4xl font-bold mb-2">
              {isPt ? "Veja o Sistema em Ação" : "See the System in Action"}
            </h2>
            <p className="text-sm text-muted-foreground max-w-xl mx-auto">
              {isPt 
                ? "Assista ao vídeo e conheça a plataforma em poucos segundos" 
                : "Watch the video and get to know the platform in seconds"}
            </p>
          </motion.div>

          {/* Video Demo */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl mx-auto mb-12"
          >
            <div className="relative rounded-2xl border border-border bg-card shadow-2xl overflow-hidden">
              {/* Browser Header */}
              <div className="flex items-center gap-2 px-4 py-2.5 bg-muted/50 border-b border-border">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                </div>
                <div className="flex-1 mx-4">
                  <div className="bg-background rounded-md px-3 py-1 text-xs text-muted-foreground text-center max-w-[200px] mx-auto flex items-center justify-center gap-1">
                    <Play className="w-3 h-3" />
                    {isPt ? "Demonstração" : "Demo"}
                  </div>
                </div>
              </div>
              
              {/* Video */}
              <video 
                src={appDemoVideo}
                autoPlay 
                loop 
                muted 
                playsInline
                className="w-full h-auto"
              />
            </div>
          </motion.div>

          {/* Steps */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 max-w-4xl mx-auto">
            {howItWorks.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.5 }}
                className="text-center relative"
              >
                <motion.div 
                  className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold mx-auto mb-3"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                >
                  {step.step}
                </motion.div>
                {i < howItWorks.length - 1 && (
                  <ChevronRight className="absolute top-6 -right-2 w-4 h-4 text-muted-foreground hidden lg:block" />
                )}
                <h3 className="text-sm md:text-base font-semibold mb-1">{step.title}</h3>
                <p className="text-xs text-muted-foreground">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* App Showcase - Screenshots Gallery */}
      <section className="py-16 md:py-24 bg-gradient-to-b from-muted/30 to-background overflow-hidden">
        <div className="container mx-auto px-4">
          <motion.div {...fadeInUp} className="text-center mb-12">
            <Badge variant="secondary" className="mb-3">
              <MonitorSmartphone className="w-3 h-3 mr-1" />
              {isPt ? "Veja o Sistema" : "See the App"}
            </Badge>
            <h2 className="text-2xl md:text-4xl font-bold mb-2">
              {isPt ? "Conheça Por Dentro" : "Take a Look Inside"}
            </h2>
            <p className="text-sm text-muted-foreground max-w-xl mx-auto">
              {isPt 
                ? "Interface moderna e intuitiva para gerenciar todo seu ecossistema de empresas" 
                : "Modern and intuitive interface to manage your entire company ecosystem"}
            </p>
          </motion.div>

          {/* Screenshot Carousel */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative max-w-5xl mx-auto"
          >
            {/* Main Screenshot */}
            <div className="relative rounded-2xl border border-border bg-card shadow-2xl overflow-hidden">
              {/* Browser Header */}
              <div className="flex items-center gap-2 px-4 py-2.5 bg-muted/50 border-b border-border">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                </div>
                <div className="flex-1 mx-4">
                  <div className="bg-background rounded-md px-3 py-1 text-xs text-muted-foreground text-center max-w-[200px] mx-auto">
                    🔒 ecosystem-hub.app
                  </div>
                </div>
              </div>
              
              {/* Screenshot Image */}
              <motion.img
                key={activeScreenshot}
                src={screenshots[activeScreenshot].src}
                alt={screenshots[activeScreenshot].title}
                className="w-full h-auto object-cover"
                initial={{ opacity: 0, scale: 1.02 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
              />
            </div>

            {/* Navigation Arrows */}
            <button
              onClick={() => setActiveScreenshot((prev) => (prev - 1 + screenshots.length) % screenshots.length)}
              className="absolute left-2 md:-left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-background/90 backdrop-blur border border-border shadow-lg flex items-center justify-center hover:bg-background transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => setActiveScreenshot((prev) => (prev + 1) % screenshots.length)}
              className="absolute right-2 md:-right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-background/90 backdrop-blur border border-border shadow-lg flex items-center justify-center hover:bg-background transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </motion.div>

          {/* Thumbnail Navigation */}
          <div className="flex justify-center gap-3 mt-6">
            {screenshots.map((screenshot, i) => (
              <motion.button
                key={i}
                onClick={() => setActiveScreenshot(i)}
                className={`relative rounded-lg overflow-hidden border-2 transition-all ${
                  activeScreenshot === i 
                    ? 'border-primary shadow-lg scale-105' 
                    : 'border-border/50 opacity-60 hover:opacity-100'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <img 
                  src={screenshot.src} 
                  alt={screenshot.title}
                  className="w-24 md:w-32 h-14 md:h-20 object-cover"
                />
                {activeScreenshot === i && (
                  <motion.div 
                    layoutId="activeIndicator"
                    className="absolute inset-0 bg-primary/10"
                  />
                )}
              </motion.button>
            ))}
          </div>

          {/* Screenshot Info */}
          <motion.div
            key={`info-${activeScreenshot}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mt-4"
          >
            <h3 className="font-semibold text-lg">{screenshots[activeScreenshot].title}</h3>
            <p className="text-sm text-muted-foreground">{screenshots[activeScreenshot].desc}</p>
          </motion.div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 md:py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <motion.div {...fadeInUp} className="text-center mb-12">
            <Badge variant="secondary" className="mb-3">
              <Star className="w-3 h-3 mr-1" />
              {isPt ? "Depoimentos" : "Testimonials"}
            </Badge>
            <h2 className="text-2xl md:text-4xl font-bold">
              {isPt ? "O Que Dizem" : "What They Say"}
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {testimonials.map((testimonial, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30, rotateY: -10 }}
                whileInView={{ opacity: 1, y: 0, rotateY: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.6 }}
                whileHover={{ y: -5 }}
              >
                <Card className="h-full border-border/50">
                  <CardContent className="p-4 md:p-5">
                    <div className="flex gap-0.5 mb-3">
                      {[...Array(5)].map((_, j) => (
                        <Star key={j} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <p className="text-xs md:text-sm text-muted-foreground mb-4 italic">"{testimonial.content}"</p>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary text-xs">
                        {testimonial.avatar}
                      </div>
                      <div>
                        <p className="font-semibold text-xs md:text-sm">{testimonial.name}</p>
                        <p className="text-[10px] md:text-xs text-muted-foreground">{testimonial.role}</p>
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
      <section className="py-16 md:py-20 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8 items-center max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <Badge variant="secondary" className="mb-3 bg-yellow-500/10 text-yellow-600 border-yellow-500/30">
                <Sparkles className="w-3 h-3 mr-1" />
                {isPt ? "Recurso Exclusivo" : "Exclusive Feature"}
              </Badge>
              <h2 className="text-2xl md:text-3xl font-bold mb-3">
                {isPt ? "GodMode: IA Executiva" : "GodMode: Executive AI"}
              </h2>
              <p className="text-sm md:text-base text-muted-foreground mb-4">
                {isPt 
                  ? "Converse por texto ou voz com sua segunda mente. Crie empresas, adicione transações e tire dúvidas - tudo por comando de voz!"
                  : "Chat by text or voice with your second mind. Create companies, add transactions and ask questions - all by voice!"}
              </p>
              <ul className="space-y-2 mb-6">
                {[
                  isPt ? "Crie empresas por voz" : "Create companies by voice",
                  isPt ? "Adicione transações falando" : "Add transactions by speaking",
                  isPt ? "Pergunte sobre lucro/prejuízo" : "Ask about profit/loss",
                ].map((item, i) => (
                  <motion.li 
                    key={i} 
                    className="flex items-center gap-2 text-sm"
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 + i * 0.1 }}
                  >
                    <Check className="w-4 h-4 text-primary" />
                    <span>{item}</span>
                  </motion.li>
                ))}
              </ul>
              <Button size="lg" onClick={() => navigate("/auth")}>
                {isPt ? "Experimentar GodMode" : "Try GodMode"}
                <Sparkles className="w-4 h-4 ml-2" />
              </Button>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Card className="border-2 border-primary/20 shadow-xl">
                <CardContent className="p-0">
                  <div className="flex items-center gap-2 p-3 border-b border-border bg-muted/30">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">GodMode</p>
                      <p className="text-[10px] text-green-600">● Online</p>
                    </div>
                  </div>
                  <div className="p-3 space-y-3 bg-background min-h-[150px]">
                    <div className="flex justify-end">
                      <div className="bg-primary text-primary-foreground rounded-2xl rounded-br-none px-3 py-1.5 max-w-[80%]">
                        <p className="text-xs">{isPt ? "Qual foi meu lucro esse mês?" : "What was my profit this month?"}</p>
                      </div>
                    </div>
                    <div className="flex justify-start">
                      <div className="bg-muted rounded-2xl rounded-bl-none px-3 py-1.5 max-w-[85%]">
                        <p className="text-xs">
                          {isPt 
                            ? "📊 Seu lucro em janeiro foi R$ 26.870 (+18%)! Tech Solutions lidera com R$ 15k."
                            : "📊 Your January profit was $26,870 (+18%)! Tech Solutions leads with $15k."}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-16 md:py-20">
        <div className="container mx-auto px-4">
          <motion.div {...fadeInUp} className="text-center mb-12">
            <Badge variant="secondary" className="mb-3">
              <Award className="w-3 h-3 mr-1" />
              {isPt ? "Planos" : "Plans"}
            </Badge>
            <h2 className="text-2xl md:text-4xl font-bold mb-2">
              {isPt ? "Escolha seu Plano" : "Choose Your Plan"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {isPt ? "Comece grátis, faça upgrade quando precisar" : "Start free, upgrade when needed"}
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto items-stretch">
            {/* Free Plan */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              whileHover={{ y: -5 }}
              className="flex"
            >
              <Card className="w-full border-border/50 hover:shadow-lg transition-all flex flex-col">
                <CardContent className="p-4 md:p-5 flex flex-col h-full">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-1">{isPt ? "Gratuito" : "Free"}</h3>
                    <p className="text-3xl font-bold mb-1">R$ 0</p>
                    <p className="text-xs text-muted-foreground mb-4">{isPt ? "Para sempre" : "Forever"}</p>
                    <ul className="space-y-2 text-xs">
                      <li className="flex items-center gap-2"><Check className="w-3 h-3 text-primary" /> 1 {isPt ? "empresa" : "company"}</li>
                      <li className="flex items-center gap-2"><Check className="w-3 h-3 text-primary" /> 5 docs</li>
                      <li className="flex items-center gap-2"><Check className="w-3 h-3 text-primary" /> 20 trans/{isPt ? "mês" : "mo"}</li>
                      <li className="flex items-center gap-2 text-muted-foreground"><Lock className="w-3 h-3" /> GodMode</li>
                    </ul>
                  </div>
                  <Button variant="outline" className="w-full text-xs h-9 mt-6" onClick={() => navigate("/auth")}>
                    {isPt ? "Começar Grátis" : "Start Free"}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            {/* Paid Plans */}
            {Object.values(SUBSCRIPTION_PLANS).map((plan, i) => (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: (i + 1) * 0.1 }}
                whileHover={{ y: -5 }}
                className="flex"
              >
                <Card className={`w-full relative flex flex-col ${plan.id === 'annual' ? 'border-primary border-2 shadow-xl' : 'border-border/50 hover:shadow-lg'} transition-all`}>
                  {plan.id === 'annual' && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-primary text-primary-foreground px-3 py-0.5 text-[10px]">
                        <Star className="w-2.5 h-2.5 mr-1" />
                        {isPt ? "Popular" : "Popular"}
                      </Badge>
                    </div>
                  )}
                  <CardContent className="p-4 md:p-5 flex flex-col h-full">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold mb-1">{isPt ? plan.name_pt : plan.name_en}</h3>
                      <p className="text-3xl font-bold mb-1">{formatPrice(plan.price)}</p>
                      <p className="text-xs text-muted-foreground mb-1">
                        /{plan.interval === 'year' ? (isPt ? 'ano' : 'year') : (isPt ? `${plan.interval_count}m` : `${plan.interval_count}mo`)}
                      </p>
                      {plan.savings && (
                        <Badge variant="secondary" className="mb-3 text-[10px] text-green-600 border-green-600/30">
                          -{plan.savings}%
                        </Badge>
                      )}
                      <ul className="space-y-2 text-xs mt-3">
                        <li className="flex items-center gap-2"><Check className="w-3 h-3 text-primary" /> ∞ {isPt ? "empresas" : "companies"}</li>
                        <li className="flex items-center gap-2"><Check className="w-3 h-3 text-primary" /> ∞ docs</li>
                        <li className="flex items-center gap-2"><Check className="w-3 h-3 text-primary" /> GodMode IA</li>
                        <li className="flex items-center gap-2"><Check className="w-3 h-3 text-primary" /> Scanner</li>
                      </ul>
                    </div>
                    <Button className={`w-full text-xs h-9 mt-6 ${plan.id === 'annual' ? '' : 'bg-primary/90'}`} onClick={() => navigate("/auth")}>
                      {isPt ? "7 Dias Grátis" : "7 Days Free"}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
          
          <p className="text-center text-xs text-muted-foreground mt-6">
            {isPt ? "✓ Sem compromisso   ✓ Cancele a qualquer momento" : "✓ No commitment   ✓ Cancel anytime"}
          </p>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 md:py-20 bg-gradient-to-r from-primary to-primary/80">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-2xl md:text-4xl font-bold text-primary-foreground mb-4">
              {isPt ? "Pronto para Começar?" : "Ready to Start?"}
            </h2>
            <p className="text-base md:text-lg text-primary-foreground/80 mb-6 max-w-xl mx-auto">
              {isPt 
                ? "Junte-se a empreendedores que já usam o Ecosystem Hub."
                : "Join entrepreneurs already using Ecosystem Hub."}
            </p>
            <Button size="lg" variant="secondary" onClick={() => navigate("/auth")} className="text-base px-6 h-12 shadow-lg">
              {isPt ? "Começar Agora - Grátis!" : "Start Now - Free!"}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <p className="text-xs text-primary-foreground/60 mt-3">
              {isPt ? "2 min setup • Sem cartão" : "2 min setup • No card"}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border/40">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Logo className="w-5 h-5" />
              <span className="font-semibold text-primary text-sm">Ecosystem Hub</span>
            </div>
            <p className="text-xs text-muted-foreground">
              © 2024 Ecosystem Hub. {isPt ? "Todos os direitos reservados." : "All rights reserved."}
            </p>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> SSL</span>
              <span className="flex items-center gap-1"><Lock className="w-3 h-3" /> {isPt ? "Criptografado" : "Encrypted"}</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
