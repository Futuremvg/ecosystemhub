import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { 
  Loader2, Save, Building2, Palette, Globe, Coins, 
  RefreshCw, User, Mail, Phone, MapPin, Upload, ChevronDown
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppSettings } from "@/contexts/AppSettingsContext";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const currencies = [
  { value: "CAD", label: "$ Canadian Dollar", symbol: "CA$" },
  { value: "USD", label: "$ US Dollar", symbol: "$" },
  { value: "BRL", label: "R$ Brazilian Real", symbol: "R$" },
  { value: "EUR", label: "€ Euro", symbol: "€" },
  { value: "GBP", label: "£ British Pound", symbol: "£" },
];

const languages = [
  { value: "en-US", label: "English", flag: "🇺🇸" },
  { value: "pt-BR", label: "Português (Brasil)", flag: "🇧🇷" },
];

const getBusinessTypes = (t: (key: string) => string, lang: string) => {
  const isEnglish = lang.startsWith("en");
  
  if (isEnglish) {
    return [
      { value: "cleaning", label: "🧹 Cleaning" },
      { value: "restaurant", label: "🍽️ Restaurant" },
      { value: "construction", label: "🏗️ Construction" },
      { value: "retail", label: "🛍️ Retail" },
      { value: "tech", label: "💻 Technology" },
      { value: "health", label: "🏥 Health" },
      { value: "education", label: "📚 Education" },
      { value: "other", label: "🏢 Other" },
    ];
  }
  
  // Default: Portuguese
  return [
    { value: "cleaning", label: "🧹 Limpeza" },
    { value: "restaurant", label: "🍽️ Restaurante" },
    { value: "construction", label: "🏗️ Construção" },
    { value: "retail", label: "🛍️ Varejo" },
    { value: "tech", label: "💻 Tecnologia" },
    { value: "health", label: "🏥 Saúde" },
    { value: "education", label: "📚 Educação" },
    { value: "other", label: "🏢 Outro" },
  ];
};

interface BrandingSettings {
  companyName: string;
  businessType: string;
  ownerName: string;
  email: string;
  phone: string;
  address: string;
  logoUrl: string;
}

interface Company {
  id: string;
  name: string;
  company_type: string;
  parent_id: string | null;
  logo_url: string | null;
  description: string | null;
}

export default function Configuracoes() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { currency, setCurrency, language, setLanguage, t } = useAppSettings();
  const { triggerOnboarding } = useOnboarding();
  const isMobile = useIsMobile();
  
  const businessTypes = getBusinessTypes(t, language);
  
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [branding, setBranding] = useState<BrandingSettings>({
    companyName: "",
    businessType: "",
    ownerName: "",
    email: "",
    phone: "",
    address: "",
    logoUrl: "",
  });

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  // Load companies
  useEffect(() => {
    if (user) {
      loadCompanies();
    }
  }, [user]);

  const loadCompanies = async () => {
    const { data } = await supabase
      .from("companies")
      .select("*")
      .order("name");
    if (data) {
      setCompanies(data);
    }
  };

  // Load branding when company changes
  useEffect(() => {
    if (selectedCompany) {
      // Load from company data
      setBranding({
        companyName: selectedCompany.name,
        businessType: "",
        ownerName: "",
        email: "",
        phone: "",
        address: "",
        logoUrl: selectedCompany.logo_url || "",
      });
    } else {
      // Load from localStorage (global settings)
      const savedBranding = localStorage.getItem("branding_settings");
      if (savedBranding) {
        setBranding(JSON.parse(savedBranding));
      } else {
        const businessType = localStorage.getItem("business_type");
        const companyName = localStorage.getItem("company_name");
        setBranding({
          companyName: companyName || "",
          businessType: businessType || "",
          ownerName: "",
          email: "",
          phone: "",
          address: "",
          logoUrl: "",
        });
      }
    }
  }, [selectedCompany]);

  const hubs = companies.filter((c) => c.company_type === "hub");
  const getSatellites = (hubId: string) => companies.filter((c) => c.parent_id === hubId);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (selectedCompany) {
        // Save to company in database
        const { error } = await supabase
          .from("companies")
          .update({
            name: branding.companyName,
            logo_url: branding.logoUrl || null,
          })
          .eq("id", selectedCompany.id);
        
        if (error) throw error;
        
        // Update local state
        setCompanies(prev => prev.map(c => 
          c.id === selectedCompany.id 
            ? { ...c, name: branding.companyName, logo_url: branding.logoUrl || null }
            : c
        ));
        setSelectedCompany(prev => prev ? { ...prev, name: branding.companyName, logo_url: branding.logoUrl || null } : null);
      } else {
        // Save global settings to localStorage
        localStorage.setItem("branding_settings", JSON.stringify(branding));
        localStorage.setItem("business_type", branding.businessType);
        localStorage.setItem("company_name", branding.companyName);
      }
      toast.success(t("settings.saved"));
    } catch (error) {
      toast.error(t("settings.errorSaving"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleRedoOnboarding = () => {
    setShowConfirmDialog(true);
  };

  const confirmRedoOnboarding = () => {
    localStorage.removeItem("onboarding_complete");
    setShowConfirmDialog(false);
    triggerOnboarding();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <AppLayout>
      <div className="space-y-5 w-full">
        {/* Header */}
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">
            {t("nav.settings")}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {t("settings.subtitle")}
          </p>
        </div>

        {/* Branding Section */}
        <Card className="material-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Building2 className="w-5 h-5 text-primary" />
              {t("settings.branding")}
            </CardTitle>
            <CardDescription>
              {t("settings.brandingDesc")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Company Selector */}
            {companies.length > 0 && (
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  {t("settings.selectCompany")}
                </Label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-full justify-between">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4" />
                        <span className="truncate">
                          {selectedCompany ? selectedCompany.name : t("settings.globalSettings")}
                        </span>
                      </div>
                      <ChevronDown className="w-4 h-4 ml-2 opacity-50" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-56">
                    <DropdownMenuItem onClick={() => setSelectedCompany(null)}>
                      <Globe className="w-4 h-4 mr-2" />
                      {t("settings.globalSettings")}
                      {!selectedCompany && <span className="ml-auto text-primary">✓</span>}
                    </DropdownMenuItem>
                    
                    {hubs.length > 0 && <DropdownMenuSeparator />}
                    
                    {hubs.map((hub) => {
                      const satellites = getSatellites(hub.id);
                      return (
                        <div key={hub.id}>
                          <DropdownMenuItem onClick={() => setSelectedCompany(hub)}>
                            <span className="font-medium">{hub.name}</span>
                            {selectedCompany?.id === hub.id && (
                              <span className="ml-auto text-primary">✓</span>
                            )}
                          </DropdownMenuItem>
                          {satellites.map((sat) => (
                            <DropdownMenuItem
                              key={sat.id}
                              className="pl-6"
                              onClick={() => setSelectedCompany(sat)}
                            >
                              <span className="text-muted-foreground">└</span>
                              <span className="ml-2">{sat.name}</span>
                              {selectedCompany?.id === sat.id && (
                                <span className="ml-auto text-primary">✓</span>
                              )}
                            </DropdownMenuItem>
                          ))}
                        </div>
                      );
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}

            <Separator />

            {/* Logo Upload Placeholder */}
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-xl border-2 border-dashed border-border flex items-center justify-center bg-muted/50">
                {branding.logoUrl ? (
                  <img src={branding.logoUrl} alt="Logo" className="w-full h-full object-cover rounded-xl" />
                ) : (
                  <Upload className="w-8 h-8 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1">
                <Label className="text-sm font-medium">{t("settings.companyLogo")}</Label>
                <p className="text-xs text-muted-foreground mb-2">{t("settings.logoHint")}</p>
                <Input
                  type="url"
                  placeholder={t("settings.logoPlaceholder")}
                  value={branding.logoUrl}
                  onChange={(e) => setBranding({ ...branding, logoUrl: e.target.value })}
                  className="text-sm"
                />
              </div>
            </div>

            <Separator />

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="companyName" className="flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  {t("settings.companyName")}
                </Label>
                <Input
                  id="companyName"
                  placeholder="My Company Inc."
                  value={branding.companyName}
                  onChange={(e) => setBranding({ ...branding, companyName: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="businessType" className="flex items-center gap-2">
                  <Palette className="w-4 h-4" />
                  {t("settings.businessType")}
                </Label>
                <Select 
                  value={branding.businessType} 
                  onValueChange={(value) => setBranding({ ...branding, businessType: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("settings.selectPlaceholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    {businessTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ownerName" className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  {t("settings.ownerName")}
                </Label>
                <Input
                  id="ownerName"
                  placeholder="John Smith"
                  value={branding.ownerName}
                  onChange={(e) => setBranding({ ...branding, ownerName: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  {t("settings.email")}
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="contact@company.com"
                  value={branding.email}
                  onChange={(e) => setBranding({ ...branding, email: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  {t("settings.phone")}
                </Label>
                <Input
                  id="phone"
                  placeholder="+1 (555) 123-4567"
                  value={branding.phone}
                  onChange={(e) => setBranding({ ...branding, phone: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address" className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  {t("settings.address")}
                </Label>
                <Input
                  id="address"
                  placeholder="123 Main St, Toronto, ON"
                  value={branding.address}
                  onChange={(e) => setBranding({ ...branding, address: e.target.value })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Preferences Section */}
        <Card className="material-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Globe className="w-5 h-5 text-primary" />
              {t("settings.preferences")}
            </CardTitle>
            <CardDescription>
              {t("settings.preferencesDesc")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  {t("settings.language")}
                </Label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {languages.map((l) => (
                      <SelectItem key={l.value} value={l.value}>
                        {l.flag} {l.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Coins className="w-4 h-4" />
                  {t("settings.currency")}
                </Label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {currencies.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.symbol} {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Setup Section */}
        <Card className="material-card border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <RefreshCw className="w-5 h-5 text-primary" />
              {t("settings.setup")}
            </CardTitle>
            <CardDescription>
              {t("settings.setupDesc")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              variant="outline" 
              onClick={handleRedoOnboarding}
              className="border-primary/30 hover:bg-primary/10"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              {t("settings.redoSetup")}
            </Button>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end gap-3 pb-6">
          <Button onClick={handleSave} disabled={isSaving} className="min-w-[140px]">
            {isSaving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            {t("settings.saveChanges")}
          </Button>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">{t("settings.confirmRedo")}</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              {t("settings.confirmRedoDesc")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border">{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmRedoOnboarding}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {t("settings.continue")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}