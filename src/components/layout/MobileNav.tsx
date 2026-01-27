import { Link, useLocation, useNavigate } from "react-router-dom";
import { 
  Home, 
  Building2, 
  DollarSign, 
  FileText, 
  Settings, 
  X, 
  CreditCard, 
  Sparkles,
  Menu,
  Monitor
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppSettings } from "@/contexts/AppSettingsContext";
import { useTenant } from "@/contexts/TenantContext";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { useState } from "react";

const getNavItems = (t: (key: string) => string) => [
  { icon: Home, label: t("nav.home"), path: "/dashboard" },
  { icon: Building2, label: t("nav.companies"), path: "/empresas" },
  { icon: DollarSign, label: t("nav.money"), path: "/dinheiro" },
  { icon: FileText, label: t("nav.documents"), path: "/documentos" },
  { icon: CreditCard, label: t("nav.billing") || "Billing", path: "/billing" },
  { icon: Settings, label: t("nav.settings"), path: "/configuracoes" },
];

interface MobileNavProps {
  className?: string;
}

export function MobileNav({ className }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { t, language } = useAppSettings();
  const { tenant } = useTenant();
  const navItems = getNavItems(t);
  const isPt = language === 'pt-BR';

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className={cn("h-11 w-11 shrink-0", className)}
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent 
        side="left" 
        className="w-[280px] p-0 bg-sidebar border-r border-border/30"
      >
        <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
        
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-border/30">
          <div className="flex items-center gap-3">
            {tenant?.logo_url ? (
              <img src={tenant.logo_url} alt={tenant.name} className="h-8 object-contain" />
            ) : (
              <Logo size="sm" />
            )}
            <span className="text-sm font-medium text-sidebar-foreground truncate">
              {tenant?.name || "Architecta"}
            </span>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setOpen(false)}
            className="h-9 w-9 text-sidebar-foreground/60"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || 
              (item.path === "/dashboard" && location.pathname === "/");
            const Icon = item.icon;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-3 rounded-lg transition-colors min-h-[44px]",
                  isActive
                    ? "bg-sidebar-accent/80 text-sidebar-foreground"
                    : "text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                )}
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* God Mode Button */}
        <div className="p-3 border-t border-border/30">
          <Button
            variant="ghost"
            onClick={() => {
              setOpen(false);
              navigate("/godmode");
            }}
            className="w-full justify-start gap-3 h-12 bg-gradient-to-r from-primary/10 to-accent/10 hover:from-primary/20 hover:to-accent/20 text-primary"
          >
            <Sparkles className="w-5 h-5" />
            <span className="text-sm font-medium">God Mode</span>
          </Button>
        </div>

        {/* Mobile Notice */}
        <div className="px-4 pb-4">
          <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border border-border/30">
            <Monitor className="w-4 h-4 text-muted-foreground shrink-0" />
            <p className="text-[10px] text-muted-foreground leading-tight">
              {isPt 
                ? "Operações completas disponíveis em tablet/desktop." 
                : "Full operations available on tablet/desktop."}
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function MobileHeader() {
  const { language } = useAppSettings();
  const { tenant } = useTenant();
  const isPt = language === 'pt-BR';

  return (
    <header className="lg:hidden sticky top-0 z-40 flex items-center justify-between h-14 px-4 border-b border-border/30 bg-background/95 backdrop-blur-md">
      <MobileNav />
      <div className="flex items-center gap-2">
        {tenant?.logo_url ? (
          <img src={tenant.logo_url} alt={tenant.name} className="h-6 object-contain" />
        ) : (
          <Logo size="sm" />
        )}
      </div>
      <div className="w-11" /> {/* Spacer for centering */}
    </header>
  );
}
