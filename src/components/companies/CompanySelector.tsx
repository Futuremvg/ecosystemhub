import { Building2, ChevronDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useAppSettings } from "@/contexts/AppSettingsContext";

interface Company {
  id: string;
  name: string;
  company_type: string;
  parent_id: string | null;
}

interface CompanySelectorProps {
  companies: Company[];
  selectedCompany: Company | null;
  onSelect: (company: Company | null) => void;
  className?: string;
}

export function CompanySelector({
  companies,
  selectedCompany,
  onSelect,
  className,
}: CompanySelectorProps) {
  const { t } = useAppSettings();
  const hubs = companies.filter((c) => c.company_type === "hub");
  const getSatellites = (hubId: string) =>
    companies.filter((c) => c.parent_id === hubId);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className={cn("justify-between gap-2", className)}>
          <div className="flex items-center gap-2 min-w-0">
            <Building2 className="w-4 h-4 shrink-0" />
            <span className="truncate text-sm">
              {selectedCompany ? selectedCompany.name : t("ecosystem.allCompanies")}
            </span>
          </div>
          <ChevronDown className="w-4 h-4 shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 bg-popover">
        <DropdownMenuItem onClick={() => onSelect(null)}>
          <Building2 className="w-4 h-4 mr-2" />
          {t("ecosystem.allCompanies")}
          {!selectedCompany && <span className="ml-auto text-primary">✓</span>}
        </DropdownMenuItem>
        
        {hubs.length > 0 && <DropdownMenuSeparator />}
        
        {hubs.map((hub) => {
          const satellites = getSatellites(hub.id);
          return (
            <div key={hub.id}>
              <DropdownMenuItem onClick={() => onSelect(hub)}>
                <span className="font-medium">{hub.name}</span>
                {selectedCompany?.id === hub.id && (
                  <span className="ml-auto text-primary">✓</span>
                )}
              </DropdownMenuItem>
              {satellites.map((sat) => (
                <DropdownMenuItem
                  key={sat.id}
                  className="pl-6"
                  onClick={() => onSelect(sat)}
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
        
        {selectedCompany && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onSelect(null)} className="text-muted-foreground">
              <X className="w-4 h-4 mr-2" />
              {t("ecosystem.clearSelection")}
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
