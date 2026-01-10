import { Building2, GitBranch, ChevronRight, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAppSettings } from "@/contexts/AppSettingsContext";

interface Company {
  id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  company_type: string;
  parent_id: string | null;
}

interface CompanyTreeProps {
  companies: Company[];
  selectedCompanyId?: string;
  onSelect: (company: Company) => void;
  onAddChild?: (parentId: string) => void;
}

export function CompanyTree({ companies, selectedCompanyId, onSelect, onAddChild }: CompanyTreeProps) {
  const { t } = useAppSettings();
  const hubs = companies.filter(c => c.company_type === "hub");
  
  const getChildren = (parentId: string) => 
    companies.filter(c => c.parent_id === parentId);

  const renderCompanyNode = (company: Company, level: number = 0) => {
    const children = getChildren(company.id);
    const isSelected = selectedCompanyId === company.id;
    const isHub = company.company_type === "hub";

    return (
      <div key={company.id} className="relative">
        {/* Connection line from parent */}
        {level > 0 && (
          <div className="absolute left-3 -top-3 w-px h-3 bg-border" />
        )}
        
        <div className="flex items-start gap-2">
          {/* Vertical line for tree structure */}
          {level > 0 && (
            <div className="flex flex-col items-center shrink-0 w-6">
              <div className="w-4 h-px bg-border mt-5" />
            </div>
          )}
          
          {/* Company card */}
          <div className="flex-1 flex items-center gap-2 min-w-0">
            <button
              onClick={() => onSelect(company)}
              className={cn(
                "flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-xl border transition-all flex-1 text-left min-w-0",
                "hover:bg-accent hover:border-primary/30",
                isSelected ? "bg-primary/10 border-primary" : "bg-card border-border",
                isHub ? "shadow-md" : "shadow-sm"
              )}
            >
              <div className={cn(
                "w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0",
                isHub 
                  ? "bg-gradient-to-br from-god-gold to-amber-600 text-sidebar shadow-god-glow" 
                  : "bg-primary/10 text-primary"
              )}>
                {company.logo_url ? (
                  <img 
                    src={company.logo_url} 
                    alt={company.name}
                    className="w-7 h-7 sm:w-8 sm:h-8 object-contain rounded-lg"
                  />
                ) : (
                  <Building2 className="w-4 h-4 sm:w-5 sm:h-5" />
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="font-semibold text-xs sm:text-sm truncate">{company.name}</span>
                  <span className={cn(
                    "text-[9px] sm:text-[10px] px-1 sm:px-1.5 py-0.5 rounded-full font-medium shrink-0",
                    isHub 
                      ? "bg-god-gold/20 text-god-gold" 
                      : "bg-primary/10 text-primary"
                  )}>
                    {isHub ? "HUB" : "SAT"}
                  </span>
                </div>
                {company.description && (
                  <p className="text-[10px] sm:text-xs text-muted-foreground truncate mt-0.5">
                    {company.description}
                  </p>
                )}
                {children.length > 0 && (
                  <p className="text-[9px] sm:text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                    <GitBranch className="w-3 h-3" />
                    {children.length} {t("ecosystem.subCompanies")}
                  </p>
                )}
              </div>
              
              <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
            </button>
            
            {/* Add child button */}
            {onAddChild && (
              <Button
                size="icon"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  onAddChild(company.id);
                }}
                className="shrink-0 h-8 w-8 rounded-lg border-primary/30 text-primary hover:bg-primary/10 hover:text-primary"
                title={t("ecosystem.addSubCompany")}
              >
                <Plus className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
        
        {/* Children */}
        {children.length > 0 && (
          <div className="relative ml-6 mt-2 space-y-2 border-l border-border pl-0">
            {children.map((child) => renderCompanyNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  // Find orphan satellites (satellites without a valid parent)
  const orphanSatellites = companies.filter(
    c => c.company_type === "satellite" && !c.parent_id
  );

  return (
    <div className="space-y-4">
      {/* Hub companies with their satellites */}
      {hubs.map((hub) => renderCompanyNode(hub))}
      
      {/* Orphan satellites */}
      {orphanSatellites.length > 0 && (
        <div className="pt-4 border-t border-dashed border-border">
          <p className="text-xs text-muted-foreground mb-3 flex items-center gap-2">
            <Building2 className="w-3.5 h-3.5" />
            {t("ecosystem.unlinkedSatellites")}
          </p>
          <div className="space-y-2">
            {orphanSatellites.map((sat) => renderCompanyNode(sat))}
          </div>
        </div>
      )}
      
      {/* Empty state */}
      {companies.length === 0 && (
        <div className="text-center py-8">
          <Building2 className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-sm text-muted-foreground">{t("ecosystem.noCompanies")}</p>
        </div>
      )}
    </div>
  );
}
