import { Link, useLocation } from "react-router-dom";
import { Home, Building2, DollarSign, FileText, Settings, ChevronLeft, ChevronRight, X, Shield, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppSettings } from "@/contexts/AppSettingsContext";
import { useTenant } from "@/contexts/TenantContext";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";

const getNavItems = (t: (key: string) => string, isSuperAdmin: boolean) => {
  const items = [
    { icon: Home, label: t("nav.home"), path: "/" },
    { icon: Building2, label: t("nav.companies"), path: "/empresas" },
    { icon: DollarSign, label: t("nav.money"), path: "/dinheiro" },
    { icon: FileText, label: t("nav.documents"), path: "/documentos" },
    { icon: Settings, label: t("nav.settings"), path: "/configuracoes" },
    { icon: HelpCircle, label: t("nav.help"), path: "/ajuda" },
  ];
  
  if (isSuperAdmin) {
    items.push({ icon: Shield, label: "Admin", path: "/admin/tenants" });
  }
  
  return items;
};

interface DesktopSidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
  isMobileSheet?: boolean;
}

export function DesktopSidebar({ collapsed = false, onToggle, isMobileSheet = false }: DesktopSidebarProps) {
  const location = useLocation();
  const { t, language } = useAppSettings();
  const { isSuperAdmin, tenant } = useTenant();
  const navItems = getNavItems(t, isSuperAdmin);

  const footerText = tenant?.name || (
    language.startsWith("pt") ? "God Mode Ativo" : 
    language.startsWith("fr") ? "God Mode Actif" : 
    "God Mode Active"
  );

  return (
    <TooltipProvider delayDuration={0}>
      <div className={cn(
        "h-full bg-sidebar text-sidebar-foreground flex flex-col transition-all duration-300 border-r border-border/30",
        collapsed ? "w-16" : "w-64"
      )}>
        {/* Logo */}
        <div className={cn(
          "border-b border-border/30 flex items-center shrink-0",
          collapsed ? "p-3 justify-center h-16" : "px-5 py-4 h-16"
        )}>
          {collapsed ? (
            <div 
              className="w-9 h-9 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: tenant?.primary_color || "hsl(var(--accent))" }}
            >
              <span className="font-bold text-sidebar text-sm">
                {tenant?.name?.charAt(0).toUpperCase() || "M"}
              </span>
            </div>
          ) : (
            <div className="flex items-center justify-between flex-1 min-w-0">
              <div className="flex-1 min-w-0">
                {tenant?.logo_url ? (
                  <img src={tenant.logo_url} alt={tenant.name} className="h-8 object-contain" />
                ) : (
                  <Logo size="md" />
                )}
                <p className="text-[11px] text-sidebar-foreground/70 mt-0.5 truncate font-medium">
                  {tenant?.name || "Business OS"}
                </p>
              </div>
            </div>
          )}
          
          {/* Toggle/Close button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className={cn(
              "shrink-0 h-8 w-8 text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent/50",
              collapsed && !isMobileSheet && "absolute -right-3 top-5 w-6 h-6 rounded-full bg-sidebar border border-border/50 shadow-sm"
            )}
          >
            {isMobileSheet ? (
              <X className="w-4 h-4" />
            ) : collapsed ? (
              <ChevronRight className="w-3.5 h-3.5" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </Button>
        </div>

        {/* Navigation */}
        <nav className={cn(
          "flex-1 overflow-y-auto",
          collapsed ? "p-2 space-y-1" : "p-3 space-y-0.5"
        )}>
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || 
              (item.path === "/admin/tenants" && location.pathname.startsWith("/admin"));
            const Icon = item.icon;
            const isAdmin = item.path.startsWith("/admin");
            
            const linkContent = (
              <Link
                key={item.path}
                to={item.path}
                onClick={isMobileSheet ? onToggle : undefined}
                className={cn(
                  "flex items-center rounded-lg transition-all duration-200",
                  collapsed ? "justify-center p-2.5" : "gap-3 px-3 py-2.5",
                  isActive
                    ? isAdmin 
                      ? "bg-accent/20 text-accent"
                      : "bg-sidebar-accent/80 text-sidebar-foreground"
                    : "text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
                  isAdmin && !isActive && "hover:text-accent"
                )}
              >
                <Icon className={cn(
                  "w-[18px] h-[18px] shrink-0",
                  isAdmin && !isActive && "text-accent/70"
                )} />
                {!collapsed && (
                  <>
                    <span className="text-sm font-medium">{item.label}</span>
                    {isAdmin && (
                      <div className="ml-auto w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                    )}
                  </>
                )}
              </Link>
            );

            if (collapsed) {
              return (
                <Tooltip key={item.path}>
                  <TooltipTrigger asChild>
                    {linkContent}
                  </TooltipTrigger>
                  <TooltipContent side="right" className="text-xs">
                    {item.label}
                  </TooltipContent>
                </Tooltip>
              );
            }

            return linkContent;
          })}
        </nav>

        {/* Footer */}
        {!collapsed && (
          <div className="p-4 border-t border-border/30 shrink-0">
            <p className="text-[10px] text-sidebar-foreground/30 text-center uppercase tracking-wider">
              {footerText}
            </p>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
