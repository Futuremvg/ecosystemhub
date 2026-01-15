import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Building2, DollarSign, FileText, Crown, Sparkles, 
  Check, ArrowRight, BarChart3, Shield, Zap,
  Receipt, FileSpreadsheet, MessageSquare, Globe
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
            {isPt ? "✨ 7 dias grátis!" : "✨ 7 days free!"}
          </Badge>
          
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-foreground via-foreground to-primary bg-clip-text">
            {isPt 
              ? "Gerencie seu Ecossistema de Empresas em um só lugar" 
              : "Manage your Business Ecosystem in one place"}
          </h1>
          
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            {isPt 
              ? "Controle financeiro, documentos, empresas e muito mais. Com assistente de IA integrado para decisões estratégicas." 
              : "Financial control, documents, companies and more. With integrated AI assistant for strategic decisions."}
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={() => navigate("/auth")} className="text-lg px-8">
              {isPt ? "Começar Grátis" : "Start Free"}
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}>
              {isPt ? "Ver Planos" : "View Plans"}
            </Button>
          </div>
        </motion.div>

        {/* App Preview Mockup */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="mt-16 relative"
        >
          <div className="relative mx-auto max-w-5xl">
            {/* Browser Frame */}
            <div className="rounded-xl border border-border bg-card shadow-2xl overflow-hidden">
              {/* Browser Header */}
              <div className="flex items-center gap-2 px-4 py-3 bg-muted/50 border-b border-border">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <div className="flex-1 mx-4">
                  <div className="bg-background rounded-md px-3 py-1 text-sm text-muted-foreground text-center">
                    ecosystem-hub.app
                  </div>
                </div>
              </div>
              
              {/* App Screenshot Mockup */}
              <div className="p-6 bg-gradient-to-br from-background to-muted/30">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Summary Cards */}
                  <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-0">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/20">
                          <BarChart3 className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">{isPt ? "Receita" : "Revenue"}</p>
                          <p className="text-xl font-bold">$12,450</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-gradient-to-br from-destructive/10 to-destructive/5 border-0">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-destructive/20">
                          <DollarSign className="w-5 h-5 text-destructive" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">{isPt ? "Despesas" : "Expenses"}</p>
                          <p className="text-xl font-bold">$4,230</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-0">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-green-500/20">
                          <Zap className="w-5 h-5 text-green-500" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">{isPt ? "Lucro" : "Profit"}</p>
                          <p className="text-xl font-bold text-green-600">$8,220</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                {/* Company Cards Mockup */}
                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                  {["Tech Corp", "Marketing LLC", "Consulting Inc", "Finance Co"].map((name, i) => (
                    <Card key={i} className="border border-border/50">
                      <CardContent className="p-3">
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold ${
                            ['bg-blue-500', 'bg-purple-500', 'bg-orange-500', 'bg-teal-500'][i]
                          }`}>
                            {name.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{name}</p>
                            <p className="text-xs text-muted-foreground">+{(i + 1) * 15}%</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Floating badges */}
            <div className="absolute -top-4 -right-4 bg-primary text-primary-foreground px-3 py-1.5 rounded-full text-sm font-medium shadow-lg">
              <Globe className="w-4 h-4 inline mr-1" />
              {isPt ? "100% Online" : "100% Online"}
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="mt-16 flex justify-center gap-8 md:gap-16">
          {stats.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + i * 0.1 }}
              className="text-center"
            >
              <p className="text-3xl font-bold text-primary">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {isPt ? "Tudo que você precisa" : "Everything you need"}
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {isPt 
                ? "Ferramentas poderosas para gerenciar seu negócio de forma eficiente" 
                : "Powerful tools to manage your business efficiently"}
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="h-full hover:shadow-lg transition-shadow border-border/50">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                      {feature.icon}
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground text-sm">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-16">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {isPt ? "Planos e Preços" : "Plans & Pricing"}
            </h2>
            <p className="text-muted-foreground">
              {isPt ? "Escolha o plano ideal para você" : "Choose the perfect plan for you"}
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {/* Free Plan */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <Card className="h-full border-border/50">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-2">Free</h3>
                  <p className="text-3xl font-bold mb-4">$0<span className="text-sm font-normal text-muted-foreground">/mês</span></p>
                  <ul className="space-y-2 mb-6 text-sm">
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-primary" /> 1 {isPt ? "empresa" : "company"}</li>
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-primary" /> 5 {isPt ? "documentos" : "documents"}</li>
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-primary" /> 20 {isPt ? "transações/mês" : "transactions/mo"}</li>
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
                <Card className={`h-full ${plan.id === 'annual' ? 'border-primary border-2 relative' : 'border-border/50'}`}>
                  {plan.id === 'annual' && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-primary text-primary-foreground">
                        {isPt ? "Mais Popular" : "Most Popular"}
                      </Badge>
                    </div>
                  )}
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold mb-2">{isPt ? plan.name_pt : plan.name_en}</h3>
                    <p className="text-3xl font-bold mb-1">
                      {formatPrice(plan.price)}
                      <span className="text-sm font-normal text-muted-foreground">
                        /{plan.interval === 'year' ? (isPt ? 'ano' : 'year') : (isPt ? `${plan.interval_count} meses` : `${plan.interval_count} months`)}
                      </span>
                    </p>
                    {plan.savings && (
                      <Badge variant="secondary" className="mb-4 text-xs">
                        {isPt ? `Economize ${plan.savings}%` : `Save ${plan.savings}%`}
                      </Badge>
                    )}
                    <ul className="space-y-2 mb-6 text-sm mt-4">
                      <li className="flex items-center gap-2"><Check className="w-4 h-4 text-primary" /> {isPt ? "Empresas ilimitadas" : "Unlimited companies"}</li>
                      <li className="flex items-center gap-2"><Check className="w-4 h-4 text-primary" /> {isPt ? "Documentos ilimitados" : "Unlimited documents"}</li>
                      <li className="flex items-center gap-2"><Check className="w-4 h-4 text-primary" /> {isPt ? "Transações ilimitadas" : "Unlimited transactions"}</li>
                      <li className="flex items-center gap-2"><Check className="w-4 h-4 text-primary" /> GodMode (AI)</li>
                      <li className="flex items-center gap-2"><Check className="w-4 h-4 text-primary" /> {isPt ? "Scanner de recibos" : "Receipt scanner"}</li>
                      <li className="flex items-center gap-2"><Check className="w-4 h-4 text-primary" /> {isPt ? "Importação de extratos" : "Bank statement import"}</li>
                    </ul>
                    <Button className="w-full" onClick={() => navigate("/auth")}>
                      {isPt ? "7 dias grátis" : "7 days free"}
                      <Crown className="w-4 h-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary/5">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {isPt ? "Pronto para começar?" : "Ready to get started?"}
            </h2>
            <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
              {isPt 
                ? "Crie sua conta gratuitamente e comece a organizar seu negócio hoje mesmo." 
                : "Create your free account and start organizing your business today."}
            </p>
            <Button size="lg" onClick={() => navigate("/auth")} className="text-lg px-8">
              {isPt ? "Criar Conta Grátis" : "Create Free Account"}
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border/40">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Logo className="w-6 h-6" />
              <span className="font-semibold text-primary">Ecosystem Hub</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Ecosystem Hub. {isPt ? "Todos os direitos reservados." : "All rights reserved."}
            </p>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <Shield className="w-4 h-4" />
              {isPt ? "Dados seguros" : "Secure data"}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
