import { Building2, Users, MoreVertical, Trash2, Edit } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface Company {
  id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  company_type: string;
  parent_id: string | null;
}

interface CompanyCardProps {
  company: Company;
  isSelected: boolean;
  onSelect: (company: Company) => void;
  onEdit: (company: Company) => void;
  onDelete: (company: Company) => void;
  satelliteCount?: number;
}

export function CompanyCard({
  company,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
  satelliteCount = 0,
}: CompanyCardProps) {
  const isHub = company.company_type === "hub";

  return (
    <Card
      className={cn(
        "cursor-pointer transition-all hover:shadow-md active:scale-[0.98]",
        "touch-manipulation",
        isSelected && "ring-2 ring-primary shadow-lg",
        isHub && "border-primary/50"
      )}
      onClick={() => onSelect(company)}
    >
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            {company.logo_url ? (
              <img
                src={company.logo_url}
                alt={company.name}
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg object-cover shrink-0"
              />
            ) : (
              <div className={cn(
                "w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center shrink-0",
                isHub ? "bg-primary/20" : "bg-muted"
              )}>
                <Building2 className={cn(
                  "w-5 h-5 sm:w-6 sm:h-6",
                  isHub ? "text-primary" : "text-muted-foreground"
                )} />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-sm sm:text-base truncate">{company.name}</h3>
              <div className="flex items-center gap-1.5 sm:gap-2 mt-0.5 sm:mt-1">
                <Badge variant={isHub ? "default" : "secondary"} className="text-[10px] sm:text-xs px-1.5 py-0">
                  {isHub ? "Hub" : "Satélite"}
                </Badge>
                {isHub && satelliteCount > 0 && (
                  <span className="text-[10px] sm:text-xs text-muted-foreground flex items-center gap-0.5">
                    <Users className="w-3 h-3" />
                    {satelliteCount}
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation();
                onEdit(company);
              }}>
                <Edit className="w-4 h-4 mr-2" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(company);
                }}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        {company.description && (
          <p className="text-sm text-muted-foreground mt-3 line-clamp-2">
            {company.description}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
