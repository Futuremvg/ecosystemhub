import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Globe, Coins, RefreshCw, Building2, Users, Crown } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useAppSettings } from "@/contexts/AppSettingsContext";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { useTenant } from "@/contexts/TenantContext";
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const currencies = [
  { value: "CAD", label: "$ Canadian Dollar", symbol: "CA$" },
  { value: "USD", label: "$ US Dollar", symbol: "$" },
  { value: "BRL", label: "R$ Brazilian Real", symbol: "R$" },
  { value: "EUR", label: "€ Euro", symbol: "€" },
  { value: "GBP", label: "£ British Pound", symbol: "£" },
];

const languages = [
  { value: "en-CA", label: "EN-CA", flag: "🇨🇦" },
  { value: "fr-CA", label: "FR-CA", flag: "🇨🇦" },
  { value: "en-US", label: "EN-US", flag: "🇺🇸" },
  { value: "pt-BR", label: "PT-BR", flag: "🇧🇷" },
  { value: "es-ES", label: "ES-ES", flag: "🇪🇸" },
];

const businessTypeLabels: Record<string, string> = {
  cleaning: "🧹 Limpeza",
  restaurant: "🍽️ Restaurante",
  construction: "🏗️ Construção",
  retail: "🛍️ Varejo",
  tech: "💻 Tecnologia",
  health: "🏥 Saúde",
  education: "📚 Educação",
  other: "🏢 Outro",
};

export function SettingsPanel() {
  const navigate = useNavigate();
  const { currency, setCurrency, language, setLanguage } = useAppSettings();
  const { triggerOnboarding } = useOnboarding();
  const { isSuperAdmin } = useTenant();
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [businessType, setBusinessType] = useState<string | null>(null);

  useEffect(() => {
    const storedType = localStorage.getItem("business_type");
    setBusinessType(storedType);
  }, []);

  const handleRedoOnboarding = () => {
    setShowConfirmDialog(true);
  };

  const confirmRedoOnboarding = () => {
    localStorage.removeItem("onboarding_complete");
    setShowConfirmDialog(false);
    triggerOnboarding();
  };

  return (
    <>
      <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap">
        {/* Admin Tenants Button - Only for Super Admins */}
        {isSuperAdmin && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/admin/tenants")}
                className="h-7 sm:h-8 px-2 text-xs gap-1 border-god-gold/30 bg-god-gold/10 hover:bg-god-gold/20 hover:border-god-gold/50 text-god-gold"
              >
                <Crown className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span className="hidden sm:inline">Admin</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Gerenciar Tenants (Super Admin)</p>
            </TooltipContent>
          </Tooltip>
        )}
        {/* Business Type Badge - Hidden on very small screens */}
        {businessType && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="hidden xs:flex items-center gap-1 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-md bg-primary/10 border border-primary/20 text-[10px] sm:text-xs">
                <Building2 className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-primary" />
                <span className="hidden sm:inline text-foreground">
                  {businessTypeLabels[businessType] || businessType}
                </span>
                <span className="sm:hidden">
                  {businessTypeLabels[businessType]?.split(" ")[0] || "🏢"}
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Tipo de negócio: {businessTypeLabels[businessType] || businessType}</p>
            </TooltipContent>
          </Tooltip>
        )}

        {/* Redo Onboarding Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRedoOnboarding}
              className="h-7 sm:h-8 px-2 text-xs gap-1 border-primary/30 hover:bg-primary/10 hover:border-primary/50"
            >
              <RefreshCw className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span className="hidden sm:inline">Setup</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Refazer configuração inicial</p>
          </TooltipContent>
        </Tooltip>

        {/* Currency Selector */}
        <Select value={currency} onValueChange={setCurrency}>
          <SelectTrigger className="w-[55px] sm:w-[80px] h-7 sm:h-8 text-[10px] sm:text-xs px-1.5 sm:px-2">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-popover">
            {currencies.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {c.value}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Language Selector */}
        <Select value={language} onValueChange={setLanguage}>
          <SelectTrigger className="w-[65px] sm:w-[90px] h-7 sm:h-8 text-[10px] sm:text-xs px-1.5 sm:px-2">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-popover">
            {languages.map((l) => (
              <SelectItem key={l.value} value={l.value}>
                {l.flag} {l.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Refazer Configuração?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Você está prestes a refazer o setup inicial. Os links existentes serão mantidos, 
              mas novos links serão adicionados baseados no novo tipo de negócio selecionado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border">Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmRedoOnboarding}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Continuar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// Re-export for backward compatibility
export { useAppSettings as useCurrency } from "@/contexts/AppSettingsContext";
