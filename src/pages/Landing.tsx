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
  Play, ChevronRight, Heart, Award, Target, Layers
} from "lucide-react";
import { useAppSettings } from "@/contexts/AppSettingsContext";
import { SUBSCRIPTION_PLANS, formatPrice } from "@/lib/stripe-config";
import { Logo } from "@/components/ui/Logo";

export default function Landing() {
  const navigate = useNavigate();
  const { language } = useAppSettings();
  const isPt = language.startsWith("pt");

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
        ? "Automatize tarefas repetitivas e foque no que realmente importa para seu negócio"
        : "Automate repetitive tasks and focus on what really matters for your business"
    },
    {
      icon: <TrendingUp className="w-8 h-8" />,
      title: isPt ? "Tome Decisões Melhores" : "Make Better Decisions",
      description: isPt 
        ? "Tenha uma visão clara da saúde financeira de todas as suas empresas em tempo real"
        : "Get a clear view of the financial health of all your companies in real-time"
    },
    {
      icon: <Lock className="w-8 h-8" />,
      title: isPt ? "Dados Seguros" : "Secure Data",
      description: isPt 
        ? "Seus dados são criptografados e protegidos com as mais avançadas tecnologias de segurança"
        : "Your data is encrypted and protected with the most advanced security technologies"
    },
    {
      icon: <Smartphone className="w-8 h-8" />,
      title: isPt ? "Acesse de Qualquer Lugar" : "Access Anywhere",
      description: isPt 
        ? "Desktop, tablet ou celular - sua gestão financeira sempre na palma da mão"
        : "Desktop, tablet or mobile - your financial management always at your fingertips"
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
        ? "Finalmente um sistema que entende como micro-empresas funcionam no Brasil."
        : "Finally a system that understands how small businesses work.",
      avatar: "RS"
    },
  ];

  const howItWorks = [
    {
      step: "1",
      title: isPt ? "Crie sua conta grátis" : "Create your free account",
      description: isPt 
        ? "Cadastre-se em menos de 2 minutos. Sem cartão de crédito."
        : "Sign up in less than 2 minutes. No credit card required."
    },
    {
      step: "2",
      title: isPt ? "Configure suas empresas" : "Set up your companies",
      description: isPt 
        ? "Adicione suas empresas e organize seu ecossistema hierárquico."
        : "Add your companies and organize your hierarchical ecosystem."
    },
    {
      step: "3",
      title: isPt ? "Registre transações" : "Record transactions",
      description: isPt 
        ? "Adicione receitas e despesas manualmente ou importe extratos bancários."
        : "Add income and expenses manually or import bank statements."
    },
    {
      step: "4",
      title: isPt ? "Visualize resultados" : "View results",
      description: isPt 
        ? "Acompanhe o lucro/prejuízo de cada empresa em tempo real."
        : "Track profit/loss for each company in real-time."
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border/40">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Logo className="w-8 h-8" />
            <span className="font-bold text-xl text-primary">Ecosystem Hub</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => navigate("/auth")}>
              {isPt ? "Entrar" : "Sign In"}
            </Button>
            <Button onClick={() => navigate("/auth")} className="bg-primary hover:bg-primary/90">
              {isPt ? "Começar Grátis" : "Start Free"}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-4xl mx-auto"
        >
          <Badge variant="secondary" className="mb-4 px-4 py-1.5">
            <Sparkles className="w-3 h-3 mr-1" />
            {isPt ? "✨ 7 dias grátis para testar tudo!" : "✨ 7 days free to test everything!"}
          </Badge>
          
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-foreground via-foreground to-primary bg-clip-text">
            {isPt 
              ? "Gerencie Múltiplas Empresas Como um Profissional" 
              : "Manage Multiple Companies Like a Pro"}
          </h1>
          
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            {isPt 
              ? "A única plataforma que você precisa para controlar finanças, documentos e operações de todas as suas empresas em um só lugar. Com IA integrada para decisões estratégicas." 
              : "The only platform you need to control finances, documents and operations of all your companies in one place. With integrated AI for strategic decisions."}
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={() => navigate("/auth")} className="text-lg px-8 h-14">
              {isPt ? "Começar Grátis Agora" : "Start Free Now"}
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })} className="h-14">
              <Play className="w-5 h-5 mr-2" />
              {isPt ? "Veja Como Funciona" : "See How It Works"}
            </Button>
          </div>
          
          <p className="text-sm text-muted-foreground mt-4">
            {isPt ? "✓ Sem cartão de crédito   ✓ Configuração em 2 min   ✓ Cancele quando quiser" : "✓ No credit card   ✓ 2 min setup   ✓ Cancel anytime"}
          </p>
        </motion.div>

        {/* App Preview - Dashboard Screenshot */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="mt-16 relative"
        >
          <div className="relative mx-auto max-w-6xl">
            {/* Browser Frame */}
            <div className="rounded-2xl border border-border bg-card shadow-2xl overflow-hidden">
              {/* Browser Header */}
              <div className="flex items-center gap-2 px-4 py-3 bg-muted/50 border-b border-border">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <div className="flex-1 mx-4">
                  <div className="bg-background rounded-md px-3 py-1 text-sm text-muted-foreground text-center max-w-xs mx-auto">
                    🔒 ecosystem-hub.app/home
                  </div>
                </div>
              </div>
              
              {/* Dashboard Mockup - Detailed */}
              <div className="p-4 md:p-8 bg-gradient-to-br from-background to-muted/20">
                {/* Header with greeting */}
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold">{isPt ? "Bom dia! ✨" : "Good morning! ✨"}</h2>
                    <p className="text-sm text-muted-foreground">{isPt ? "Segunda-feira, 15 de Janeiro" : "Monday, January 15"}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">💰 BRL</Badge>
                    <Badge variant="outline">🇧🇷 PT</Badge>
                  </div>
                </div>
                
                {/* P&L Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-0">
                    <CardContent className="p-5">
                      <p className="text-sm text-muted-foreground mb-1">{isPt ? "Receita Mensal" : "Monthly Revenue"}</p>
                      <p className="text-3xl font-bold text-primary">R$ 45.320</p>
                      <p className="text-xs text-green-600 mt-1">↑ 12% {isPt ? "vs mês anterior" : "vs last month"}</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-gradient-to-br from-destructive/10 to-destructive/5 border-0">
                    <CardContent className="p-5">
                      <p className="text-sm text-muted-foreground mb-1">{isPt ? "Despesas Mensais" : "Monthly Expenses"}</p>
                      <p className="text-3xl font-bold text-destructive">R$ 18.450</p>
                      <p className="text-xs text-muted-foreground mt-1">↓ 5% {isPt ? "vs mês anterior" : "vs last month"}</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-0">
                    <CardContent className="p-5">
                      <p className="text-sm text-muted-foreground mb-1">{isPt ? "Lucro Líquido" : "Net Profit"}</p>
                      <p className="text-3xl font-bold text-green-600">R$ 26.870</p>
                      <p className="text-xs text-green-600 mt-1">↑ 18% {isPt ? "vs mês anterior" : "vs last month"}</p>
                    </CardContent>
                  </Card>
                </div>
                
                {/* Company Cards Grid */}
                <h3 className="font-semibold mb-3">{isPt ? "Minhas Empresas" : "My Companies"}</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                  {[
                    { name: "Tech Solutions", type: "Hub", income: "R$ 25.000", color: "bg-primary" },
                    { name: "Marketing Pro", type: "Satélite", income: "R$ 12.500", color: "bg-purple-500" },
                    { name: "Consulting Inc", type: "Satélite", income: "R$ 5.820", color: "bg-orange-500" },
                    { name: "Finance Co", type: "Satélite", income: "R$ 2.000", color: "bg-teal-500" },
                  ].map((company, i) => (
                    <Card key={i} className="border border-border/50 hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3 mb-2">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold ${company.color}`}>
                            {company.name.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium truncate text-sm">{company.name}</p>
                            <Badge variant="secondary" className="text-[10px]">{company.type}</Badge>
                          </div>
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t border-border/50">
                          <span className="text-xs text-muted-foreground">{isPt ? "Receita" : "Revenue"}</span>
                          <span className="text-sm font-semibold text-green-600">{company.income}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                
                {/* Quick Actions */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { icon: <Building2 className="w-5 h-5" />, label: isPt ? "Ecossistema" : "Ecosystem", color: "bg-primary/10 text-primary" },
                    { icon: <DollarSign className="w-5 h-5" />, label: isPt ? "Dinheiro" : "Money", color: "bg-green-500/10 text-green-600" },
                    { icon: <FileText className="w-5 h-5" />, label: isPt ? "Documentos" : "Documents", color: "bg-blue-500/10 text-blue-600" },
                    { icon: <Sparkles className="w-5 h-5" />, label: "GodMode", color: "bg-yellow-500/10 text-yellow-600" },
                  ].map((action, i) => (
                    <Card key={i} className="border border-border/50">
                      <CardContent className="p-4 flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${action.color}`}>
                          {action.icon}
                        </div>
                        <span className="font-medium text-sm">{action.label}</span>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Floating Elements */}
            <motion.div 
              className="absolute -top-4 -right-4 bg-green-500 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg"
              animate={{ y: [0, -5, 0] }}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              <TrendingUp className="w-4 h-4 inline mr-1" />
              {isPt ? "+26% Lucro" : "+26% Profit"}
            </motion.div>
            
            <motion.div 
              className="absolute -bottom-4 -left-4 bg-primary text-primary-foreground px-4 py-2 rounded-full text-sm font-medium shadow-lg"
              animate={{ y: [0, 5, 0] }}
              transition={{ repeat: Infinity, duration: 2.5 }}
            >
              <Shield className="w-4 h-4 inline mr-1" />
              {isPt ? "100% Seguro" : "100% Secure"}
            </motion.div>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="mt-20 flex justify-center gap-8 md:gap-16 flex-wrap">
          {stats.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + i * 0.1 }}
              className="text-center"
            >
              <p className="text-4xl font-bold text-primary">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Social Proof - Logos/Trust */}
      <section className="py-12 bg-muted/20 border-y border-border/30">
        <div className="container mx-auto px-4">
          <p className="text-center text-sm text-muted-foreground mb-6">
            {isPt ? "Usado por empreendedores que gerenciam múltiplos negócios" : "Used by entrepreneurs managing multiple businesses"}
          </p>
          <div className="flex justify-center items-center gap-8 md:gap-16 flex-wrap opacity-60">
            {["🏢", "🏗️", "💼", "🛍️", "🏥", "📚"].map((emoji, i) => (
              <span key={i} className="text-4xl">{emoji}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <Badge variant="secondary" className="mb-4">
              <Heart className="w-3 h-3 mr-1" />
              {isPt ? "Por que escolher?" : "Why choose us?"}
            </Badge>
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              {isPt ? "Benefícios que Transformam seu Negócio" : "Benefits that Transform Your Business"}
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              {isPt 
                ? "Não é só mais um software. É uma mudança na forma como você gerencia seu ecossistema empresarial." 
                : "It's not just another software. It's a change in how you manage your business ecosystem."}
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mx-auto mb-4">
                  {benefit.icon}
                </div>
                <h3 className="text-xl font-semibold mb-2">{benefit.title}</h3>
                <p className="text-muted-foreground">{benefit.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section - Detailed */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <Badge variant="secondary" className="mb-4">
              <Layers className="w-3 h-3 mr-1" />
              {isPt ? "Funcionalidades" : "Features"}
            </Badge>
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              {isPt ? "Tudo que Você Precisa em Um Só Lugar" : "Everything You Need in One Place"}
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              {isPt 
                ? "Ferramentas poderosas e intuitivas para gerenciar seu negócio de forma eficiente" 
                : "Powerful and intuitive tools to manage your business efficiently"}
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {features.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="h-full hover:shadow-xl transition-all border-border/50 hover:border-primary/30 group">
                  <CardContent className="p-6">
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-4 group-hover:scale-110 transition-transform">
                      {feature.icon}
                    </div>
                    <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <Badge variant="secondary" className="mb-4">
              <Target className="w-3 h-3 mr-1" />
              {isPt ? "Como Funciona" : "How It Works"}
            </Badge>
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              {isPt ? "Comece em 4 Passos Simples" : "Start in 4 Simple Steps"}
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-5xl mx-auto">
            {howItWorks.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="text-center relative"
              >
                <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  {step.step}
                </div>
                {i < howItWorks.length - 1 && (
                  <ChevronRight className="absolute top-8 -right-4 w-6 h-6 text-muted-foreground hidden lg:block" />
                )}
                <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                <p className="text-muted-foreground text-sm">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <Badge variant="secondary" className="mb-4">
              <Star className="w-3 h-3 mr-1" />
              {isPt ? "Depoimentos" : "Testimonials"}
            </Badge>
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              {isPt ? "O Que Nossos Clientes Dizem" : "What Our Clients Say"}
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {testimonials.map((testimonial, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="h-full border-border/50">
                  <CardContent className="p-6">
                    <div className="flex gap-1 mb-4">
                      {[...Array(5)].map((_, j) => (
                        <Star key={j} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <p className="text-muted-foreground mb-6 italic">"{testimonial.content}"</p>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary">
                        {testimonial.avatar}
                      </div>
                      <div>
                        <p className="font-semibold">{testimonial.name}</p>
                        <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* GodMode Feature Highlight */}
      <section className="py-20 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <Badge variant="secondary" className="mb-4 bg-yellow-500/10 text-yellow-600 border-yellow-500/30">
                <Sparkles className="w-3 h-3 mr-1" />
                {isPt ? "Recurso Exclusivo" : "Exclusive Feature"}
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                {isPt ? "GodMode: Seu Conselheiro Executivo com IA" : "GodMode: Your AI Executive Advisor"}
              </h2>
              <p className="text-lg text-muted-foreground mb-6">
                {isPt 
                  ? "Converse por texto ou voz com sua segunda mente. O GodMode executa comandos, cria empresas, adiciona transações e responde suas perguntas sobre o negócio - tudo por comando de voz!"
                  : "Chat by text or voice with your second mind. GodMode executes commands, creates companies, adds transactions and answers your business questions - all by voice command!"}
              </p>
              <ul className="space-y-3 mb-8">
                {[
                  isPt ? "Crie empresas por comando de voz" : "Create companies by voice command",
                  isPt ? "Adicione transações falando" : "Add transactions by speaking",
                  isPt ? "Pergunte sobre seu lucro/prejuízo" : "Ask about your profit/loss",
                  isPt ? "Navegue pelo app usando voz" : "Navigate the app using voice",
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-primary" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <Button size="lg" onClick={() => navigate("/auth")}>
                {isPt ? "Experimentar GodMode" : "Try GodMode"}
                <Sparkles className="w-4 h-4 ml-2" />
              </Button>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              {/* GodMode Chat Mockup */}
              <Card className="border-2 border-primary/20 shadow-2xl">
                <CardContent className="p-0">
                  <div className="flex items-center gap-3 p-4 border-b border-border bg-muted/30">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold">GodMode</p>
                      <p className="text-xs text-green-600">● Online</p>
                    </div>
                  </div>
                  <div className="p-4 space-y-4 bg-background min-h-[200px]">
                    <div className="flex justify-end">
                      <div className="bg-primary text-primary-foreground rounded-2xl rounded-br-none px-4 py-2 max-w-[80%]">
                        <p className="text-sm">{isPt ? "Qual foi meu lucro esse mês?" : "What was my profit this month?"}</p>
                      </div>
                    </div>
                    <div className="flex justify-start">
                      <div className="bg-muted rounded-2xl rounded-bl-none px-4 py-2 max-w-[80%]">
                        <p className="text-sm">
                          {isPt 
                            ? "📊 Seu lucro líquido em janeiro foi de R$ 26.870, um aumento de 18% em relação ao mês anterior! Suas empresas mais lucrativas foram Tech Solutions (R$ 15.000) e Marketing Pro (R$ 8.200)."
                            : "📊 Your net profit in January was $26,870, an 18% increase from last month! Your most profitable companies were Tech Solutions ($15,000) and Marketing Pro ($8,200)."}
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

      {/* Pricing Section */}
      <section id="pricing" className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <Badge variant="secondary" className="mb-4">
              <Award className="w-3 h-3 mr-1" />
              {isPt ? "Planos Acessíveis" : "Affordable Plans"}
            </Badge>
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              {isPt ? "Escolha o Plano Ideal para Você" : "Choose the Perfect Plan for You"}
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              {isPt ? "Comece grátis e faça upgrade quando precisar de mais recursos" : "Start free and upgrade when you need more features"}
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {/* Free Plan */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <Card className="h-full border-border/50 hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold mb-2">{isPt ? "Gratuito" : "Free"}</h3>
                  <p className="text-4xl font-bold mb-1">R$ 0</p>
                  <p className="text-sm text-muted-foreground mb-6">{isPt ? "Para sempre" : "Forever"}</p>
                  <ul className="space-y-3 mb-8 text-sm">
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-primary" /> 1 {isPt ? "empresa" : "company"}</li>
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-primary" /> 5 {isPt ? "documentos" : "documents"}</li>
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-primary" /> 20 {isPt ? "transações/mês" : "transactions/mo"}</li>
                    <li className="flex items-center gap-2 text-muted-foreground"><Lock className="w-4 h-4" /> GodMode</li>
                    <li className="flex items-center gap-2 text-muted-foreground"><Lock className="w-4 h-4" /> Scanner</li>
                  </ul>
                  <Button variant="outline" className="w-full" onClick={() => navigate("/auth")}>
                    {isPt ? "Começar Grátis" : "Start Free"}
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
                <Card className={`h-full relative ${plan.id === 'annual' ? 'border-primary border-2 shadow-xl scale-105' : 'border-border/50 hover:shadow-lg'} transition-all`}>
                  {plan.id === 'annual' && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                      <Badge className="bg-primary text-primary-foreground px-4 py-1">
                        <Star className="w-3 h-3 mr-1" />
                        {isPt ? "Mais Popular" : "Most Popular"}
                      </Badge>
                    </div>
                  )}
                  <CardContent className="p-6">
                    <h3 className="text-xl font-semibold mb-2">{isPt ? plan.name_pt : plan.name_en}</h3>
                    <p className="text-4xl font-bold mb-1">
                      {formatPrice(plan.price)}
                    </p>
                    <p className="text-sm text-muted-foreground mb-2">
                      /{plan.interval === 'year' ? (isPt ? 'ano' : 'year') : (isPt ? `${plan.interval_count} meses` : `${plan.interval_count} months`)}
                    </p>
                    {plan.savings && (
                      <Badge variant="secondary" className="mb-4 text-green-600 border-green-600/30">
                        {isPt ? `Economize ${plan.savings}%` : `Save ${plan.savings}%`}
                      </Badge>
                    )}
                    <ul className="space-y-3 mb-8 text-sm mt-4">
                      <li className="flex items-center gap-2"><Check className="w-4 h-4 text-primary" /> {isPt ? "Empresas ilimitadas" : "Unlimited companies"}</li>
                      <li className="flex items-center gap-2"><Check className="w-4 h-4 text-primary" /> {isPt ? "Documentos ilimitados" : "Unlimited documents"}</li>
                      <li className="flex items-center gap-2"><Check className="w-4 h-4 text-primary" /> {isPt ? "Transações ilimitadas" : "Unlimited transactions"}</li>
                      <li className="flex items-center gap-2"><Check className="w-4 h-4 text-primary" /> GodMode (IA)</li>
                      <li className="flex items-center gap-2"><Check className="w-4 h-4 text-primary" /> {isPt ? "Scanner + Import" : "Scanner + Import"}</li>
                    </ul>
                    <Button className={`w-full ${plan.id === 'annual' ? '' : 'bg-primary/90'}`} onClick={() => navigate("/auth")}>
                      {isPt ? "7 Dias Grátis" : "7 Days Free"}
                      <Crown className="w-4 h-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
          
          <p className="text-center text-sm text-muted-foreground mt-8">
            {isPt ? "✓ Sem compromisso   ✓ Cancele a qualquer momento   ✓ Satisfação garantida" : "✓ No commitment   ✓ Cancel anytime   ✓ Satisfaction guaranteed"}
          </p>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary to-primary/80">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-5xl font-bold text-primary-foreground mb-6">
              {isPt ? "Pronto para Transformar sua Gestão?" : "Ready to Transform Your Management?"}
            </h2>
            <p className="text-xl text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
              {isPt 
                ? "Junte-se a centenas de empreendedores que já usam o Ecosystem Hub para gerenciar seus negócios."
                : "Join hundreds of entrepreneurs already using Ecosystem Hub to manage their businesses."}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="secondary" onClick={() => navigate("/auth")} className="text-lg px-8 h-14">
                {isPt ? "Começar Agora - É Grátis!" : "Start Now - It's Free!"}
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
            <p className="text-sm text-primary-foreground/60 mt-4">
              {isPt ? "Configuração em 2 minutos • Sem cartão de crédito" : "2 minute setup • No credit card required"}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border/40">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Logo className="w-6 h-6" />
              <span className="font-semibold text-primary">Ecosystem Hub</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 Ecosystem Hub. {isPt ? "Todos os direitos reservados." : "All rights reserved."}
            </p>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1"><Shield className="w-4 h-4" /> SSL {isPt ? "Seguro" : "Secure"}</span>
              <span className="flex items-center gap-1"><Lock className="w-4 h-4" /> {isPt ? "Criptografado" : "Encrypted"}</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
