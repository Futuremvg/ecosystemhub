import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Sparkles, Building2, DollarSign, Link2, ArrowRight, 
  Check, Globe, Coins, ChevronLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useAppSettings } from "@/contexts/AppSettingsContext";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface OnboardingWizardProps {
  onComplete: () => void;
}

const businessTypes = [
  { id: "cleaning", icon: "🧹", label: { en: "Cleaning Services", pt: "Serviços de Limpeza", es: "Servicios de Limpieza", fr: "Services de Nettoyage" } },
  { id: "restaurant", icon: "🍔", label: { en: "Restaurant/Food", pt: "Restaurante/Alimentação", es: "Restaurante/Comida", fr: "Restaurant/Alimentation" } },
  { id: "construction", icon: "🏗️", label: { en: "Construction", pt: "Construção", es: "Construcción", fr: "Construction" } },
  { id: "retail", icon: "🛍️", label: { en: "Retail Store", pt: "Loja de Varejo", es: "Tienda Minorista", fr: "Commerce de Détail" } },
  { id: "tech", icon: "💻", label: { en: "Technology/IT", pt: "Tecnologia/TI", es: "Tecnología/TI", fr: "Technologie/TI" } },
  { id: "health", icon: "🏥", label: { en: "Health/Wellness", pt: "Saúde/Bem-estar", es: "Salud/Bienestar", fr: "Santé/Bien-être" } },
  { id: "education", icon: "📚", label: { en: "Education", pt: "Educação", es: "Educación", fr: "Éducation" } },
  { id: "other", icon: "🏢", label: { en: "Other", pt: "Outro", es: "Otro", fr: "Autre" } },
];

// Personalized link suggestions by business type
const linkSuggestionsByBusiness: Record<string, { category: string; icon: string; links: Array<{ name: string; url: string; description: string; priority: string }> }[]> = {
  cleaning: [
    {
      category: "Business Operations",
      icon: "Settings",
      links: [
        { name: "Jobber", url: "https://getjobber.com", description: "Scheduling & invoicing for cleaning businesses", priority: "critical" },
        { name: "ZenMaid", url: "https://www.zenmaid.com", description: "Maid service software", priority: "high" },
        { name: "Launch27", url: "https://www.launch27.com", description: "Booking software for cleaning companies", priority: "high" },
      ]
    },
    {
      category: "Supplies & Equipment",
      icon: "Layers",
      links: [
        { name: "Uline", url: "https://www.uline.ca", description: "Cleaning supplies & equipment", priority: "high" },
        { name: "Costco Business", url: "https://www.costcobusinesscentre.ca", description: "Bulk cleaning products", priority: "medium" },
      ]
    },
    {
      category: "Marketing & Clients",
      icon: "Megaphone",
      links: [
        { name: "Thumbtack", url: "https://www.thumbtack.com", description: "Find cleaning clients", priority: "high" },
        { name: "Nextdoor Business", url: "https://business.nextdoor.com", description: "Local neighborhood marketing", priority: "medium" },
      ]
    }
  ],
  restaurant: [
    {
      category: "Point of Sale & Orders",
      icon: "DollarSign",
      links: [
        { name: "Square for Restaurants", url: "https://squareup.com/ca/en/point-of-sale/restaurants", description: "POS system for restaurants", priority: "critical" },
        { name: "Toast", url: "https://pos.toasttab.com", description: "Restaurant management platform", priority: "critical" },
        { name: "DoorDash Merchant", url: "https://merchants.doordash.com", description: "Delivery platform", priority: "high" },
        { name: "Uber Eats Merchant", url: "https://merchants.ubereats.com", description: "Delivery & pickup orders", priority: "high" },
      ]
    },
    {
      category: "Suppliers & Inventory",
      icon: "Layers",
      links: [
        { name: "Sysco", url: "https://www.sysco.ca", description: "Food service distribution", priority: "critical" },
        { name: "GFS", url: "https://www.gfs.com", description: "Gordon Food Service", priority: "high" },
        { name: "Restaurant Depot", url: "https://www.restaurantdepot.com", description: "Wholesale supplies", priority: "medium" },
      ]
    },
    {
      category: "Reservations & Reviews",
      icon: "Users",
      links: [
        { name: "OpenTable", url: "https://restaurant.opentable.com", description: "Reservation management", priority: "high" },
        { name: "Yelp for Business", url: "https://biz.yelp.com", description: "Manage reviews & listings", priority: "high" },
        { name: "Google Business Profile", url: "https://business.google.com", description: "Google Maps listing", priority: "critical" },
      ]
    }
  ],
  construction: [
    {
      category: "Project Management",
      icon: "Settings",
      links: [
        { name: "Procore", url: "https://www.procore.com", description: "Construction management software", priority: "critical" },
        { name: "Buildertrend", url: "https://buildertrend.com", description: "Project management for contractors", priority: "high" },
        { name: "CoConstruct", url: "https://www.coconstruct.com", description: "Custom builder software", priority: "high" },
      ]
    },
    {
      category: "Supplies & Materials",
      icon: "Layers",
      links: [
        { name: "Home Depot Pro", url: "https://www.homedepot.ca/pro", description: "Pro contractor supplies", priority: "critical" },
        { name: "Rona", url: "https://www.rona.ca", description: "Building materials", priority: "high" },
        { name: "BuildDirect", url: "https://www.builddirect.com", description: "Flooring & materials", priority: "medium" },
      ]
    },
    {
      category: "Permits & Compliance",
      icon: "Scale",
      links: [
        { name: "WSIB Ontario", url: "https://www.wsib.ca", description: "Workplace safety insurance", priority: "critical" },
        { name: "Ontario Building Code", url: "https://www.ontario.ca/page/building-code", description: "Building regulations", priority: "high" },
      ]
    }
  ],
  retail: [
    {
      category: "E-commerce & POS",
      icon: "DollarSign",
      links: [
        { name: "Shopify", url: "https://www.shopify.com/ca", description: "E-commerce platform", priority: "critical" },
        { name: "Square", url: "https://squareup.com/ca/en", description: "Payments & POS", priority: "critical" },
        { name: "Lightspeed", url: "https://www.lightspeedhq.com", description: "Retail POS system", priority: "high" },
      ]
    },
    {
      category: "Inventory & Shipping",
      icon: "Layers",
      links: [
        { name: "Shippo", url: "https://goshippo.com", description: "Shipping labels & tracking", priority: "high" },
        { name: "Canada Post Business", url: "https://www.canadapost-postescanada.ca/cpc/en/business.page", description: "Shipping for businesses", priority: "high" },
        { name: "Ordoro", url: "https://www.ordoro.com", description: "Inventory management", priority: "medium" },
      ]
    },
    {
      category: "Marketing",
      icon: "Megaphone",
      links: [
        { name: "Mailchimp", url: "https://mailchimp.com", description: "Email marketing", priority: "high" },
        { name: "Meta Business Suite", url: "https://business.facebook.com", description: "Facebook & Instagram ads", priority: "high" },
        { name: "Google Ads", url: "https://ads.google.com", description: "Search & display advertising", priority: "high" },
      ]
    }
  ],
  tech: [
    {
      category: "Development Tools",
      icon: "Settings",
      links: [
        { name: "GitHub", url: "https://github.com", description: "Code hosting & collaboration", priority: "critical" },
        { name: "Vercel", url: "https://vercel.com", description: "Frontend deployment", priority: "high" },
        { name: "AWS", url: "https://aws.amazon.com", description: "Cloud infrastructure", priority: "critical" },
        { name: "DigitalOcean", url: "https://www.digitalocean.com", description: "Cloud hosting", priority: "high" },
      ]
    },
    {
      category: "Project & Team",
      icon: "Users",
      links: [
        { name: "Linear", url: "https://linear.app", description: "Issue tracking", priority: "high" },
        { name: "Notion", url: "https://www.notion.so", description: "Documentation & wikis", priority: "high" },
        { name: "Slack", url: "https://slack.com", description: "Team communication", priority: "critical" },
        { name: "Figma", url: "https://www.figma.com", description: "Design & prototyping", priority: "high" },
      ]
    },
    {
      category: "Analytics & Monitoring",
      icon: "Layers",
      links: [
        { name: "Datadog", url: "https://www.datadoghq.com", description: "Infrastructure monitoring", priority: "high" },
        { name: "Sentry", url: "https://sentry.io", description: "Error tracking", priority: "high" },
        { name: "Mixpanel", url: "https://mixpanel.com", description: "Product analytics", priority: "medium" },
      ]
    }
  ],
  health: [
    {
      category: "Practice Management",
      icon: "Settings",
      links: [
        { name: "Jane App", url: "https://jane.app", description: "Clinic management software", priority: "critical" },
        { name: "Cliniko", url: "https://www.cliniko.com", description: "Practice management", priority: "high" },
        { name: "Acuity Scheduling", url: "https://acuityscheduling.com", description: "Online booking", priority: "high" },
      ]
    },
    {
      category: "Supplies & Equipment",
      icon: "Layers",
      links: [
        { name: "McKesson", url: "https://www.mckesson.ca", description: "Medical supplies", priority: "high" },
        { name: "Medline", url: "https://www.medline.com", description: "Healthcare products", priority: "high" },
      ]
    },
    {
      category: "Compliance & Insurance",
      icon: "Scale",
      links: [
        { name: "Health Canada", url: "https://www.canada.ca/en/health-canada.html", description: "Regulatory guidelines", priority: "critical" },
        { name: "PHIPA Resources", url: "https://www.ipc.on.ca/health/", description: "Health privacy compliance", priority: "high" },
      ]
    }
  ],
  education: [
    {
      category: "Learning Platforms",
      icon: "Layers",
      links: [
        { name: "Teachable", url: "https://teachable.com", description: "Create online courses", priority: "critical" },
        { name: "Thinkific", url: "https://www.thinkific.com", description: "Course platform", priority: "high" },
        { name: "Kajabi", url: "https://kajabi.com", description: "All-in-one education business", priority: "high" },
      ]
    },
    {
      category: "Tools & Resources",
      icon: "Settings",
      links: [
        { name: "Canva for Education", url: "https://www.canva.com/education/", description: "Visual content creation", priority: "high" },
        { name: "Loom", url: "https://www.loom.com", description: "Video recording for lessons", priority: "high" },
        { name: "Zoom", url: "https://zoom.us", description: "Video conferencing", priority: "critical" },
      ]
    },
    {
      category: "Community & Marketing",
      icon: "Users",
      links: [
        { name: "Circle", url: "https://circle.so", description: "Community platform", priority: "high" },
        { name: "ConvertKit", url: "https://convertkit.com", description: "Email for creators", priority: "high" },
      ]
    }
  ],
  other: [
    {
      category: "Business Essentials",
      icon: "Settings",
      links: [
        { name: "Google Workspace", url: "https://workspace.google.com", description: "Email, Drive, Docs, Meet", priority: "critical" },
        { name: "1Password Business", url: "https://1password.com/business/", description: "Password management", priority: "high" },
        { name: "Calendly", url: "https://calendly.com", description: "Scheduling automation", priority: "high" },
      ]
    },
    {
      category: "Finance & Accounting",
      icon: "DollarSign",
      links: [
        { name: "QuickBooks", url: "https://quickbooks.intuit.com/ca/", description: "Accounting software", priority: "critical" },
        { name: "Wave", url: "https://www.waveapps.com", description: "Free accounting software", priority: "high" },
        { name: "Stripe", url: "https://stripe.com/ca", description: "Online payments", priority: "high" },
      ]
    },
    {
      category: "Government & Compliance",
      icon: "Scale",
      links: [
        { name: "CRA My Business Account", url: "https://www.canada.ca/en/revenue-agency/services/e-services/e-services-businesses/business-account.html", description: "Tax & business portal", priority: "critical" },
        { name: "Ontario Business Registry", url: "https://www.ontario.ca/page/ontario-business-registry", description: "Register & manage business", priority: "high" },
      ]
    }
  ]
};

const currencies = [
  { value: "CAD", symbol: "CA$", flag: "🇨🇦" },
  { value: "USD", symbol: "$", flag: "🇺🇸" },
  { value: "BRL", symbol: "R$", flag: "🇧🇷" },
  { value: "EUR", symbol: "€", flag: "🇪🇺" },
  { value: "GBP", symbol: "£", flag: "🇬🇧" },
];

const languages = [
  { value: "en-US", label: "English", flag: "🇺🇸" },
  { value: "pt-BR", label: "Português", flag: "🇧🇷" },
];

export function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
  const { user } = useAuth();
  const { language, setLanguage, currency, setCurrency, t } = useAppSettings();
  const [step, setStep] = useState(0);
  const [companyName, setCompanyName] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getLang = () => {
    if (language.startsWith("pt")) return "pt";
    if (language.startsWith("es")) return "es";
    if (language.startsWith("fr")) return "fr";
    return "en";
  };

  const texts = {
    welcome: {
      en: "Welcome to your Business Hub",
      pt: "Bem-vindo ao seu Hub de Negócios",
      es: "Bienvenido a tu Hub de Negocios",
      fr: "Bienvenue dans votre Hub d'Affaires"
    },
    welcomeDesc: {
      en: "Let's set up your workspace in just a few steps",
      pt: "Vamos configurar seu espaço de trabalho em poucos passos",
      es: "Configuremos tu espacio de trabajo en pocos pasos",
      fr: "Configurons votre espace de travail en quelques étapes"
    },
    selectLanguage: {
      en: "Select your language",
      pt: "Selecione seu idioma",
      es: "Selecciona tu idioma",
      fr: "Sélectionnez votre langue"
    },
    selectCurrency: {
      en: "Select your currency",
      pt: "Selecione sua moeda",
      es: "Selecciona tu moneda",
      fr: "Sélectionnez votre devise"
    },
    companyNameLabel: {
      en: "What's your company name?",
      pt: "Qual o nome da sua empresa?",
      es: "¿Cuál es el nombre de tu empresa?",
      fr: "Quel est le nom de votre entreprise?"
    },
    companyNamePlaceholder: {
      en: "Enter company name",
      pt: "Digite o nome da empresa",
      es: "Ingresa el nombre de la empresa",
      fr: "Entrez le nom de l'entreprise"
    },
    businessTypeLabel: {
      en: "What type of business?",
      pt: "Qual tipo de negócio?",
      es: "¿Qué tipo de negocio?",
      fr: "Quel type d'entreprise?"
    },
    allSet: {
      en: "You're all set!",
      pt: "Tudo pronto!",
      es: "¡Todo listo!",
      fr: "Tout est prêt!"
    },
    allSetDesc: {
      en: "Your workspace is ready with personalized links for your business!",
      pt: "Seu espaço está pronto com links personalizados para seu negócio!",
      es: "¡Tu espacio está listo con enlaces personalizados para tu negocio!",
      fr: "Votre espace est prêt avec des liens personnalisés pour votre entreprise!"
    },
    tipTitle: {
      en: "Pro Tip",
      pt: "Dica",
      es: "Consejo",
      fr: "Conseil"
    },
    tipDesc: {
      en: "Use God Mode (the golden button) to control everything by voice or text!",
      pt: "Use o God Mode (botão dourado) para controlar tudo por voz ou texto!",
      es: "¡Usa God Mode (el botón dorado) para controlar todo por voz o texto!",
      fr: "Utilisez God Mode (le bouton doré) pour tout contrôler par voix ou texte!"
    },
    linksAdded: {
      en: "personalized links added",
      pt: "links personalizados adicionados",
      es: "enlaces personalizados agregados",
      fr: "liens personnalisés ajoutés"
    },
    getStarted: {
      en: "Get Started",
      pt: "Começar",
      es: "Empezar",
      fr: "Commencer"
    },
    next: {
      en: "Next",
      pt: "Próximo",
      es: "Siguiente",
      fr: "Suivant"
    },
    back: {
      en: "Back",
      pt: "Voltar",
      es: "Atrás",
      fr: "Retour"
    },
    skip: {
      en: "Skip for now",
      pt: "Pular por agora",
      es: "Saltar por ahora",
      fr: "Passer pour l'instant"
    }
  };

  const getText = (key: keyof typeof texts) => texts[key][getLang() as keyof typeof texts.welcome] || texts[key].en;

  const handleNext = () => {
    if (step < 4) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };

  const createPersonalizedLinks = async (userId: string) => {
    const suggestions = linkSuggestionsByBusiness[businessType || "other"] || linkSuggestionsByBusiness.other;
    
    // Create categories and links
    for (let i = 0; i < suggestions.length; i++) {
      const categoryData = suggestions[i];
      
      // Create category
      const { data: category, error: catError } = await supabase
        .from("ecosystem_categories")
        .insert({
          user_id: userId,
          name: categoryData.category,
          icon: categoryData.icon,
          sort_order: i
        })
        .select()
        .single();

      if (catError || !category) {
        console.error("Error creating category:", catError);
        continue;
      }

      // Create links for this category
      const linksToInsert = categoryData.links.map(link => ({
        user_id: userId,
        category_id: category.id,
        name: link.name,
        url: link.url,
        description: link.description,
        priority: link.priority
      }));

      const { error: linksError } = await supabase
        .from("ecosystem_links")
        .insert(linksToInsert);

      if (linksError) {
        console.error("Error creating links:", linksError);
      }
    }
  };

  const getTotalLinksCount = () => {
    const suggestions = linkSuggestionsByBusiness[businessType || "other"] || linkSuggestionsByBusiness.other;
    return suggestions.reduce((total, cat) => total + cat.links.length, 0);
  };

  const handleComplete = async () => {
    if (!user) {
      onComplete();
      return;
    }

    setIsSubmitting(true);
    try {
      // Create company if name provided
      if (companyName.trim()) {
        await supabase.from("companies").insert({
          user_id: user.id,
          name: companyName.trim(),
          company_type: "hub",
          description: businessType ? businessTypes.find(b => b.id === businessType)?.label.en : null
        });
      }

      // Create personalized links based on business type
      await createPersonalizedLinks(user.id);

      // Mark onboarding as complete
      localStorage.setItem("onboarding_complete", "true");
      onComplete();
    } catch (error) {
      console.error("Error completing onboarding:", error);
      onComplete();
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = [
    // Step 0: Welcome
    <motion.div
      key="welcome"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="text-center space-y-6"
    >
      <div className="w-20 h-20 mx-auto rounded-full bg-god-gold flex items-center justify-center shadow-god-glow animate-pulse-gold">
        <Sparkles className="w-10 h-10 text-sidebar" />
      </div>
      <div>
        <h1 className="text-2xl font-bold text-foreground mb-2">{getText("welcome")}</h1>
        <p className="text-muted-foreground">{getText("welcomeDesc")}</p>
      </div>
      <Button onClick={handleNext} className="bg-god-gold text-sidebar hover:bg-god-gold-glow gap-2">
        {getText("getStarted")}
        <ArrowRight className="w-4 h-4" />
      </Button>
    </motion.div>,

    // Step 1: Language & Currency
    <motion.div
      key="preferences"
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="space-y-6"
    >
      <div className="text-center mb-6">
        <Globe className="w-10 h-10 mx-auto text-god-gold mb-3" />
        <h2 className="text-xl font-bold text-foreground">{getText("selectLanguage")}</h2>
      </div>
      
      <div className="grid grid-cols-1 gap-2">
        {languages.map((lang) => (
          <button
            key={lang.value}
            onClick={() => setLanguage(lang.value)}
            className={cn(
              "flex items-center gap-3 p-3 rounded-xl border transition-all",
              language === lang.value 
                ? "border-god-gold bg-god-gold/10" 
                : "border-border hover:border-god-gold/50"
            )}
          >
            <span className="text-2xl">{lang.flag}</span>
            <span className="text-foreground font-medium">{lang.label}</span>
            {language === lang.value && <Check className="w-4 h-4 text-god-gold ml-auto" />}
          </button>
        ))}
      </div>
    </motion.div>,

    // Step 2: Currency
    <motion.div
      key="currency"
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="space-y-6"
    >
      <div className="text-center mb-6">
        <Coins className="w-10 h-10 mx-auto text-god-gold mb-3" />
        <h2 className="text-xl font-bold text-foreground">{getText("selectCurrency")}</h2>
      </div>
      
      <div className="grid grid-cols-1 gap-2">
        {currencies.map((curr) => (
          <button
            key={curr.value}
            onClick={() => setCurrency(curr.value)}
            className={cn(
              "flex items-center gap-3 p-3 rounded-xl border transition-all",
              currency === curr.value 
                ? "border-god-gold bg-god-gold/10" 
                : "border-border hover:border-god-gold/50"
            )}
          >
            <span className="text-2xl">{curr.flag}</span>
            <span className="text-foreground font-medium">{curr.symbol} {curr.value}</span>
            {currency === curr.value && <Check className="w-4 h-4 text-god-gold ml-auto" />}
          </button>
        ))}
      </div>
    </motion.div>,

    // Step 3: Company Name
    <motion.div
      key="company"
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="space-y-6"
    >
      <div className="text-center mb-6">
        <Building2 className="w-10 h-10 mx-auto text-god-gold mb-3" />
        <h2 className="text-xl font-bold text-foreground">{getText("companyNameLabel")}</h2>
      </div>
      
      <div className="space-y-4">
        <Input
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          placeholder={getText("companyNamePlaceholder")}
          className="h-12 text-center text-lg"
        />
      </div>

      <div className="text-center">
        <h3 className="text-sm font-medium text-muted-foreground mb-4">{getText("businessTypeLabel")}</h3>
        <div className="grid grid-cols-4 gap-2">
          {businessTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => setBusinessType(type.id)}
              className={cn(
                "flex flex-col items-center gap-1 p-3 rounded-xl border transition-all",
                businessType === type.id 
                  ? "border-god-gold bg-god-gold/10" 
                  : "border-border hover:border-god-gold/50"
              )}
            >
              <span className="text-2xl">{type.icon}</span>
              <span className="text-xs text-foreground truncate w-full">
                {type.label[getLang() as keyof typeof type.label] || type.label.en}
              </span>
            </button>
          ))}
        </div>
      </div>
    </motion.div>,

    // Step 4: Complete
    <motion.div
      key="complete"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="text-center space-y-6"
    >
      <div className="w-20 h-20 mx-auto rounded-full bg-financial-positive flex items-center justify-center">
        <Check className="w-10 h-10 text-white" />
      </div>
      <div>
        <h1 className="text-2xl font-bold text-foreground mb-2">{getText("allSet")}</h1>
        <p className="text-muted-foreground">{getText("allSetDesc")}</p>
      </div>

      {/* Links added indicator */}
      {businessType && (
        <div className="flex items-center justify-center gap-2 text-god-gold">
          <Link2 className="w-5 h-5" />
          <span className="font-semibold">{getTotalLinksCount()}</span>
          <span className="text-muted-foreground text-sm">{getText("linksAdded")}</span>
        </div>
      )}

      {/* Tip Card */}
      <Card className="p-4 bg-god-gold/5 border-god-gold/20 text-left">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-god-gold/10 shrink-0">
            <Sparkles className="w-5 h-5 text-god-gold" />
          </div>
          <div>
            <h4 className="font-medium text-foreground text-sm">{getText("tipTitle")}</h4>
            <p className="text-xs text-muted-foreground">{getText("tipDesc")}</p>
          </div>
        </div>
      </Card>

      <Button 
        onClick={handleComplete} 
        disabled={isSubmitting}
        className="bg-god-gold text-sidebar hover:bg-god-gold-glow gap-2 w-full"
      >
        {isSubmitting ? (
          <div className="w-4 h-4 border-2 border-sidebar border-t-transparent rounded-full animate-spin" />
        ) : (
          <>
            {getText("getStarted")}
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </Button>
    </motion.div>,
  ];

  return (
    <div className="fixed inset-0 z-[100] bg-background flex items-center justify-center p-4">
      {/* Progress dots */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 flex gap-2">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={cn(
              "w-2 h-2 rounded-full transition-all",
              i === step ? "bg-god-gold w-6" : i < step ? "bg-god-gold" : "bg-muted"
            )}
          />
        ))}
      </div>

      {/* Content */}
      <Card className="w-full max-w-md p-6 bg-card border-border">
        <AnimatePresence mode="wait">
          {steps[step]}
        </AnimatePresence>

        {/* Navigation */}
        {step > 0 && step < 4 && (
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
            <Button variant="ghost" onClick={handleBack} className="gap-1">
              <ChevronLeft className="w-4 h-4" />
              {getText("back")}
            </Button>
            
            <div className="flex gap-2">
              {step === 3 && !companyName.trim() && (
                <Button variant="ghost" onClick={() => setStep(4)} className="text-muted-foreground">
                  {getText("skip")}
                </Button>
              )}
              <Button onClick={handleNext} className="bg-god-gold text-sidebar hover:bg-god-gold-glow gap-1">
                {getText("next")}
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}