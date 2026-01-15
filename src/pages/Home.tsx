import { useEffect, useState, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Building2, DollarSign, FileText, TrendingUp, TrendingDown,
  LogOut, Loader2, Calendar, Sparkles, Quote, AlertTriangle
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { SettingsPanel } from "@/components/settings/SettingsPanel";
import { useAppSettings } from "@/contexts/AppSettingsContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { AddTransactionDialog } from "@/components/financial/AddTransactionDialog";
import { CompanyPLCard } from "@/components/home/CompanyPLCard";
import { toast } from "sonner";

// Motivational quotes in multiple languages
const motivationalQuotes = {
  pt: [
    { text: "O sucesso é a soma de pequenos esforços repetidos dia após dia.", author: "Robert Collier" },
    { text: "Não espere por oportunidades extraordinárias. Agarre ocasiões comuns e as torne grandiosas.", author: "Orison Swett Marden" },
    { text: "O único lugar onde o sucesso vem antes do trabalho é no dicionário.", author: "Vidal Sassoon" },
    { text: "Acredite que você pode, assim você já está no meio do caminho.", author: "Theodore Roosevelt" },
    { text: "A persistência é o caminho do êxito.", author: "Charles Chaplin" },
    { text: "O fracasso é a oportunidade de começar de novo, com mais inteligência.", author: "Henry Ford" },
    { text: "Grandes realizações não são feitas por impulso, mas por uma soma de pequenas realizações.", author: "Vincent Van Gogh" },
    { text: "A melhor maneira de prever o futuro é criá-lo.", author: "Peter Drucker" },
    { text: "Você nunca sabe que resultados virão da sua ação. Mas se você não fizer nada, não existirão resultados.", author: "Mahatma Gandhi" },
    { text: "O empreendedorismo não é sobre ter uma ideia, é sobre fazer essa ideia acontecer.", author: "Seth Godin" },
    { text: "Sua empresa é tão boa quanto as pessoas que você contrata.", author: "Ray Kroc" },
    { text: "O segredo para avançar é começar.", author: "Mark Twain" },
    { text: "Não tenha medo de desistir do bom para perseguir o ótimo.", author: "John D. Rockefeller" },
    { text: "A inovação distingue um líder de um seguidor.", author: "Steve Jobs" },
    { text: "Construa seus sonhos, ou alguém vai te contratar para construir os deles.", author: "Farrah Gray" },
  ],
  en: [
    { text: "Success is the sum of small efforts repeated day in and day out.", author: "Robert Collier" },
    { text: "Don't wait for extraordinary opportunities. Seize common occasions and make them great.", author: "Orison Swett Marden" },
    { text: "The only place where success comes before work is in the dictionary.", author: "Vidal Sassoon" },
    { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
    { text: "Persistence is the path to success.", author: "Charles Chaplin" },
    { text: "Failure is the opportunity to begin again more intelligently.", author: "Henry Ford" },
    { text: "Great achievements are not done by impulse, but by a sum of small achievements.", author: "Vincent Van Gogh" },
    { text: "The best way to predict the future is to create it.", author: "Peter Drucker" },
    { text: "You never know what results will come from your action. But if you do nothing, there will be no results.", author: "Mahatma Gandhi" },
    { text: "Entrepreneurship is not about having an idea, it's about making that idea happen.", author: "Seth Godin" },
    { text: "Your business is only as good as the people you hire.", author: "Ray Kroc" },
    { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
    { text: "Don't be afraid to give up the good to go for the great.", author: "John D. Rockefeller" },
    { text: "Innovation distinguishes between a leader and a follower.", author: "Steve Jobs" },
    { text: "Build your own dreams, or someone else will hire you to build theirs.", author: "Farrah Gray" },
  ],
  fr: [
    { text: "Le succès est la somme de petits efforts répétés jour après jour.", author: "Robert Collier" },
    { text: "N'attendez pas des opportunités extraordinaires. Saisissez les occasions communes et rendez-les grandes.", author: "Orison Swett Marden" },
    { text: "Le seul endroit où le succès vient avant le travail, c'est dans le dictionnaire.", author: "Vidal Sassoon" },
    { text: "Croyez que vous pouvez et vous êtes à mi-chemin.", author: "Theodore Roosevelt" },
    { text: "La persévérance est le chemin du succès.", author: "Charles Chaplin" },
    { text: "L'échec est l'opportunité de recommencer plus intelligemment.", author: "Henry Ford" },
    { text: "La meilleure façon de prédire l'avenir est de le créer.", author: "Peter Drucker" },
    { text: "L'innovation distingue un leader d'un suiveur.", author: "Steve Jobs" },
  ],
};

interface Company {
  id: string;
  name: string;
  company_type: string;
  logo_url: string | null;
  parent_id: string | null;
}

interface FinancialSource {
  id: string;
  name: string;
}

interface FinancialCategory {
  id: string;
  name: string;
  type: string;
}

interface CompanyFinancials {
  companyId: string;
  income: number;
  expenses: number;
}

export default function Home() {
  const navigate = useNavigate();
  const { user, loading, signOut } = useAuth();
  const { formatCurrency, language, t } = useAppSettings();
  const isMobile = useIsMobile();
  
  const [companies, setCompanies] = useState<Company[]>([]);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [companyFinancials, setCompanyFinancials] = useState<CompanyFinancials[]>([]);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [sources, setSources] = useState<FinancialSource[]>([]);
  const [categories, setCategories] = useState<FinancialCategory[]>([]);
  const [totalStats, setTotalStats] = useState({ companies: 0, links: 0, documents: 0 });
  const [currentMonthTransactionCount, setCurrentMonthTransactionCount] = useState(0);

  // Get random motivational quote based on language - must be before any early returns
  const dailyQuote = useMemo(() => {
    const langKey = language.startsWith("pt") ? "pt" : language.startsWith("fr") ? "fr" : "en";
    const quotes = motivationalQuotes[langKey] || motivationalQuotes.en;
    // Use date + session to get different quote each visit but consistent during session
    const sessionSeed = typeof window !== 'undefined' ? (sessionStorage.getItem("quoteSeed") || Date.now().toString()) : "0";
    if (typeof window !== 'undefined' && !sessionStorage.getItem("quoteSeed")) {
      sessionStorage.setItem("quoteSeed", sessionSeed);
    }
    const index = parseInt(sessionSeed) % quotes.length;
    return quotes[index];
  }, [language]);

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      loadAllData();
    }
  }, [user]);

  const loadAllData = async () => {
    setIsLoadingStats(true);
    try {
      const [companiesRes, sourcesRes, categoriesRes, entriesRes, linksRes, docsRes] = await Promise.all([
        supabase.from("companies").select("id, name, company_type, logo_url, parent_id").order("created_at"),
        supabase.from("financial_sources").select("id, name, company_id").order("name"),
        supabase.from("financial_categories").select("id, name, type, company_id").order("name"),
        supabase.from("financial_entries").select("*").eq("year", currentYear).eq("month", currentMonth),
        supabase.from("ecosystem_links").select("id", { count: "exact" }),
        supabase.from("documents").select("id", { count: "exact" }),
      ]);

      const companiesList = companiesRes.data || [];
      const entries = entriesRes.data || [];
      const sourcesList = sourcesRes.data || [];
      const categoriesList = categoriesRes.data || [];

      setCompanies(companiesList);
      setSources(sourcesList.map(s => ({ id: s.id, name: s.name })));
      setCategories(categoriesList.map(c => ({ id: c.id, name: c.name, type: c.type })));
      setTotalStats({
        companies: companiesList.length,
        links: linksRes.count || 0,
        documents: docsRes.count || 0,
      });
      setCurrentMonthTransactionCount(entries.length);

      // Calculate financials per company
      const financials: CompanyFinancials[] = companiesList.map(company => {
        // Find sources and categories for this company
        const companySourceIds = sourcesList
          .filter(s => s.company_id === company.id)
          .map(s => s.id);
        const companyCategoryIds = categoriesList
          .filter(c => c.company_id === company.id)
          .map(c => c.id);

        const income = entries
          .filter(e => e.source_id && companySourceIds.includes(e.source_id))
          .reduce((sum, e) => sum + Number(e.amount), 0);

        const expenses = entries
          .filter(e => e.category_id && companyCategoryIds.includes(e.category_id))
          .reduce((sum, e) => sum + Number(e.amount), 0);

        return { companyId: company.id, income, expenses };
      });

      // Also calculate "unassigned" totals (entries without company)
      const assignedSourceIds = sourcesList.filter(s => s.company_id).map(s => s.id);
      const assignedCategoryIds = categoriesList.filter(c => c.company_id).map(c => c.id);
      
      const unassignedIncome = entries
        .filter(e => e.source_id && !assignedSourceIds.includes(e.source_id))
        .reduce((sum, e) => sum + Number(e.amount), 0);
      
      const unassignedExpenses = entries
        .filter(e => e.category_id && !assignedCategoryIds.includes(e.category_id))
        .reduce((sum, e) => sum + Number(e.amount), 0);

      // Add unassigned to hub totals or create a virtual "general" entry
      if (unassignedIncome > 0 || unassignedExpenses > 0) {
        const hub = companiesList.find(c => c.company_type === "hub");
        if (hub) {
          const hubFinancial = financials.find(f => f.companyId === hub.id);
          if (hubFinancial) {
            hubFinancial.income += unassignedIncome;
            hubFinancial.expenses += unassignedExpenses;
          }
        }
      }

      setCompanyFinancials(financials);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setIsLoadingStats(false);
    }
  };

  const handleAddIncome = async (sourceId: string, amount: number, month: number, notes?: string) => {
    if (!user) return;
    
    const { error } = await supabase.from("financial_entries").insert({
      user_id: user.id,
      source_id: sourceId,
      amount,
      year: currentYear,
      month,
      notes,
    });

    if (error) {
      toast.error(t("money.errorAddSource"));
    } else {
      toast.success(t("money.sourceAdded"));
      loadAllData();
    }
  };

  const handleAddExpense = async (categoryId: string, amount: number, month: number, notes?: string) => {
    if (!user) return;
    
    const { error } = await supabase.from("financial_entries").insert({
      user_id: user.id,
      category_id: categoryId,
      amount,
      year: currentYear,
      month,
      notes,
    });

    if (error) {
      toast.error(t("money.errorAddCategory"));
    } else {
      toast.success(t("money.categoryAdded"));
      loadAllData();
    }
  };

  const handleCreateSource = async (name: string): Promise<string | null> => {
    if (!user) return null;
    
    const { data, error } = await supabase
      .from("financial_sources")
      .insert({ user_id: user.id, name })
      .select("id")
      .single();

    if (error) {
      toast.error(t("money.errorAddSource"));
      return null;
    }
    
    loadAllData();
    return data.id;
  };

  const handleCreateCategory = async (name: string, type: "income" | "expense"): Promise<string | null> => {
    if (!user) return null;
    
    const { data, error } = await supabase
      .from("financial_categories")
      .insert({ user_id: user.id, name, type })
      .select("id")
      .single();

    if (error) {
      toast.error(t("money.errorAddCategory"));
      return null;
    }
    
    loadAllData();
    return data.id;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  const currentDate = new Date();
  
  const getGreeting = () => {
    const hour = currentDate.getHours();
    if (language.startsWith("pt")) {
      return hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";
    } else if (language.startsWith("fr")) {
      return hour < 12 ? "Bonjour" : hour < 18 ? "Bon après-midi" : "Bonsoir";
    }
    return hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  };

  const quickActions = [
    { icon: Building2, label: t("nav.companies"), path: "/empresas", color: "bg-primary" },
    { icon: DollarSign, label: t("nav.money"), path: "/dinheiro", color: "bg-financial-positive" },
    { icon: FileText, label: t("nav.documents"), path: "/documentos", color: "bg-muted-foreground" },
  ];

  // Separate hub and satellite companies
  const hubCompanies = companies.filter(c => c.company_type === "hub");
  const satelliteCompanies = companies.filter(c => c.company_type === "satellite");

  // Calculate consolidated totals
  const totalIncome = companyFinancials.reduce((sum, f) => sum + f.income, 0);
  const totalExpenses = companyFinancials.reduce((sum, f) => sum + f.expenses, 0);
  const totalBalance = totalIncome - totalExpenses;

  const getCompanyFinancials = (companyId: string) => {
    return companyFinancials.find(f => f.companyId === companyId) || { income: 0, expenses: 0 };
  };

  return (
    <AppLayout>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col w-full space-y-6"
      >
        {/* Header */}
        <div className="flex flex-col gap-3">
          {/* Top row: Greeting + Logout */}
          <div className="flex items-center justify-between gap-2">
            <h1 className={cn(
              "font-bold text-foreground truncate",
              isMobile ? "text-lg" : "text-2xl md:text-3xl"
            )}>
              {getGreeting()}! ✨
            </h1>
            <Button variant="ghost" size="icon" onClick={() => setShowLogoutConfirm(true)} className="h-8 w-8 shrink-0 text-foreground">
              <LogOut className="w-4 h-4" />
            </Button>

            {/* Logout Confirmation Modal */}
            <AlertDialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-destructive/10">
                      <AlertTriangle className="w-5 h-5 text-destructive" />
                    </div>
                    <AlertDialogTitle>{t("common.logout")}</AlertDialogTitle>
                  </div>
                  <AlertDialogDescription className="pt-2">
                    {language === "pt" 
                      ? "Tem certeza que deseja sair da sua conta?" 
                      : language === "fr"
                      ? "Êtes-vous sûr de vouloir vous déconnecter ?"
                      : "Are you sure you want to log out?"}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>
                    {language === "pt" ? "Cancelar" : language === "fr" ? "Annuler" : "Cancel"}
                  </AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={signOut}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {language === "pt" ? "Sim, sair" : language === "fr" ? "Oui, déconnecter" : "Yes, log out"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
          
          {/* Second row: Date */}
          <div className="flex items-center gap-2 text-muted-foreground text-xs">
            <Calendar className="w-3.5 h-3.5 shrink-0" />
            <span>
              {currentDate.toLocaleDateString(language, { 
                weekday: isMobile ? "short" : "long", 
                day: "numeric", 
                month: isMobile ? "short" : "long" 
              })}
            </span>
          </div>
          
          {/* Third row: Settings controls */}
          <div className="flex items-center justify-start">
            <SettingsPanel />
          </div>
        </div>

        {/* P&L Summary Cards */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.3 }}
          className="space-y-3"
        >
          <h2 className={cn(
            "font-semibold text-foreground",
            isMobile ? "text-base" : "text-lg"
          )}>
            {t("home.profitLoss") || "Profit & Loss"}
          </h2>
          
          <div className={cn(
            "grid gap-3",
            isMobile ? "grid-cols-1" : "grid-cols-3"
          )}>
            {/* Monthly Income Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.15 }}
            >
              <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-primary/10 to-primary/5 shadow-sm">
                <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-full -translate-y-8 translate-x-8" />
                <CardContent className={cn("p-5", isMobile && "p-4")}>
                  <p className="text-sm text-muted-foreground mb-2">{t("home.monthlyIncome")}</p>
                  <p className={cn(
                    "font-bold text-foreground",
                    isMobile ? "text-xl" : "text-2xl"
                  )}>
                    {isLoadingStats ? "..." : formatCurrency(totalIncome)}
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Monthly Expenses Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-destructive/10 to-destructive/5 shadow-sm">
                <div className="absolute top-0 right-0 w-24 h-24 bg-destructive/10 rounded-full -translate-y-8 translate-x-8" />
                <CardContent className={cn("p-5", isMobile && "p-4")}>
                  <p className="text-sm text-muted-foreground mb-2">{t("home.monthlyExpenses")}</p>
                  <p className={cn(
                    "font-bold text-foreground",
                    isMobile ? "text-xl" : "text-2xl"
                  )}>
                    {isLoadingStats ? "..." : formatCurrency(totalExpenses)}
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Net Income Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.25 }}
            >
              <Card className={cn(
                "relative overflow-hidden border-0 shadow-sm",
                totalBalance >= 0 
                  ? "bg-gradient-to-br from-primary/15 to-primary/5" 
                  : "bg-gradient-to-br from-destructive/15 to-destructive/5"
              )}>
                <div className={cn(
                  "absolute top-0 right-0 w-24 h-24 rounded-full -translate-y-8 translate-x-8",
                  totalBalance >= 0 ? "bg-primary/15" : "bg-destructive/15"
                )} />
                <CardContent className={cn("p-5", isMobile && "p-4")}>
                  <p className="text-sm text-muted-foreground mb-2">{t("home.netIncome") || "Net Income"}</p>
                  <p className={cn(
                    "font-bold",
                    isMobile ? "text-xl" : "text-2xl",
                    totalBalance >= 0 ? "text-primary" : "text-destructive"
                  )}>
                    {isLoadingStats ? "..." : formatCurrency(totalBalance)}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </motion.div>

        {/* Quick Actions Grid */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className={cn(
            "grid gap-3",
            isMobile ? "grid-cols-2" : "grid-cols-4"
          )}
        >
          {[
            { icon: Building2, label: t("ecosystem.companies") || "Ecosystem", desc: t("home.ecosystemDesc") || "Manage your companies, ecosystem, and entities.", path: "/empresas", color: "bg-primary/10", iconColor: "text-primary" },
            { icon: DollarSign, label: t("nav.money"), desc: t("home.moneyDesc") || "Track your company's income, accounts, and financials.", path: "/dinheiro", color: "bg-primary/10", iconColor: "text-primary" },
            { icon: FileText, label: t("nav.documents"), desc: t("home.documentsDesc") || "Access documents, files, and important papers.", path: "/documentos", color: "bg-secondary", iconColor: "text-primary" },
            { icon: Sparkles, label: t("home.tipTitle") || "God Mode Tip", desc: t("home.tipDesc") || "God Mode Tip to keep your evaluation too long from the biggest.", path: "#", color: "bg-god-gold/10", iconColor: "text-god-gold" },
          ].map((action, idx) => (
            <motion.div
              key={action.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 + idx * 0.05 }}
            >
              <Link to={action.path}>
                <Card className="h-full border-0 bg-card hover:bg-secondary/50 transition-all duration-200 cursor-pointer group shadow-sm hover:shadow-md">
                  <CardContent className={cn("p-4", isMobile && "p-3")}>
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center mb-3",
                      action.color
                    )}>
                      <action.icon className={cn("w-5 h-5", action.iconColor)} />
                    </div>
                    <h3 className={cn(
                      "font-semibold text-foreground mb-1",
                      isMobile ? "text-sm" : "text-base"
                    )}>
                      {action.label}
                    </h3>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {action.desc}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </motion.div>

        {/* Motivational Quote */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          <Card className="border-0 bg-gradient-to-r from-primary/5 to-transparent shadow-sm">
            <CardContent className="p-4 flex items-start gap-3">
              <Quote className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-muted-foreground italic text-sm leading-relaxed">
                  "{dailyQuote.text}"
                </p>
                <p className="text-primary/70 text-xs mt-1.5 font-medium">
                  — {dailyQuote.author}
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Add Transaction Button */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
        >
          <AddTransactionDialog
            sources={sources}
            categories={categories}
            selectedYear={currentYear}
            selectedMonth={currentMonth}
            currentMonthTransactionCount={currentMonthTransactionCount}
            onAddIncome={handleAddIncome}
            onAddExpense={handleAddExpense}
            onCreateSource={handleCreateSource}
            onCreateCategory={handleCreateCategory}
          />
        </motion.div>

        {/* Company Cards Section */}
        {companies.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.3 }}
            className="space-y-4"
          >
            {/* Hub Companies */}
            {hubCompanies.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className={cn(
                    "font-semibold text-foreground",
                    isMobile ? "text-base" : "text-lg"
                  )}>
                    {t("home.consolidatedView") || "Consolidated View"}
                  </h2>
                  <Link to="/empresas" className="text-xs text-primary hover:underline">
                    {t("common.seeAll") || "See All"}
                  </Link>
                </div>
                <div className="grid gap-3">
                  {hubCompanies.map((hub, idx) => {
                    const financials = getCompanyFinancials(hub.id);
                    const satellitesOfHub = satelliteCompanies.filter(s => s.parent_id === hub.id);
                    const satelliteIncome = satellitesOfHub.reduce((sum, s) => sum + getCompanyFinancials(s.id).income, 0);
                    const satelliteExpenses = satellitesOfHub.reduce((sum, s) => sum + getCompanyFinancials(s.id).expenses, 0);
                    
                    return (
                      <motion.div
                        key={hub.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.65 + idx * 0.05 }}
                      >
                        <CompanyPLCard
                          company={hub}
                          income={financials.income + satelliteIncome}
                          expenses={financials.expenses + satelliteExpenses}
                          isHub
                          isLoading={isLoadingStats}
                        />
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Satellite Companies */}
            {satelliteCompanies.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {t("ecosystem.companies") || "Companies"}
                </h2>
                <div className={cn(
                  "grid gap-2",
                  isMobile ? "grid-cols-1" : "grid-cols-2 lg:grid-cols-3"
                )}>
                  {satelliteCompanies.map((company, idx) => {
                    const financials = getCompanyFinancials(company.id);
                    return (
                      <motion.div
                        key={company.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.7 + idx * 0.05 }}
                      >
                        <CompanyPLCard
                          company={company}
                          income={financials.income}
                          expenses={financials.expenses}
                          isLoading={isLoadingStats}
                        />
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Mini Stats Row - Only on mobile */}
        {isMobile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.75 }}
            className="flex items-center justify-around mt-4 pt-4 border-t border-border"
          >
            <div className="text-center">
              <p className="text-lg font-bold">{isLoadingStats ? "..." : totalStats.companies}</p>
              <p className="text-xs text-muted-foreground">{t("nav.companies")}</p>
            </div>
            <div className="w-px h-8 bg-border" />
            <div className="text-center">
              <p className="text-lg font-bold">{isLoadingStats ? "..." : totalStats.documents}</p>
              <p className="text-xs text-muted-foreground">{t("nav.documents")}</p>
            </div>
            <div className="w-px h-8 bg-border" />
            <div className="text-center">
              <p className="text-lg font-bold">{isLoadingStats ? "..." : totalStats.links}</p>
              <p className="text-xs text-muted-foreground">{t("ecosystem.links")}</p>
            </div>
          </motion.div>
        )}

        {/* Spacer for floating button */}
        <div className="h-20" />
      </motion.div>
    </AppLayout>
  );
}
