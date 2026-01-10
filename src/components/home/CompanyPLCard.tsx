import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppSettings } from "@/contexts/AppSettingsContext";

interface CompanyPLCardProps {
  company: {
    id: string;
    name: string;
    company_type: string;
    logo_url?: string | null;
  };
  income: number;
  expenses: number;
  isHub?: boolean;
  isLoading?: boolean;
}

export function CompanyPLCard({ company, income, expenses, isHub, isLoading }: CompanyPLCardProps) {
  const { formatCurrency, t } = useAppSettings();
  const balance = income - expenses;

  return (
    <Card className={cn(
      "material-card overflow-hidden transition-all",
      isHub && "border-primary/30 bg-gradient-to-br from-primary/5 to-transparent"
    )}>
      <CardContent className="p-3 sm:p-4">
        {/* Company Header */}
        <div className="flex items-center gap-2 mb-3">
          <div className={cn(
            "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
            isHub ? "bg-primary/20" : "bg-muted"
          )}>
            {company.logo_url ? (
              <img src={company.logo_url} alt={company.name} className="w-6 h-6 object-contain rounded" />
            ) : (
              <Building2 className={cn("w-4 h-4", isHub ? "text-primary" : "text-muted-foreground")} />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className={cn(
              "font-medium truncate",
              isHub ? "text-sm sm:text-base" : "text-xs sm:text-sm"
            )}>
              {company.name}
            </h3>
            {isHub && (
              <span className="text-[10px] text-primary font-medium">{t("ecosystem.hub")}</span>
            )}
          </div>
        </div>

        {/* P&L Summary */}
        <div className="space-y-1.5">
          {/* Income */}
          <div className="flex items-center justify-between text-xs sm:text-sm">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <TrendingUp className="w-3 h-3 text-financial-positive" />
              <span className="truncate">{t("money.income")}</span>
            </div>
            <span className="font-medium text-financial-positive">
              {isLoading ? "..." : formatCurrency(income)}
            </span>
          </div>

          {/* Expenses */}
          <div className="flex items-center justify-between text-xs sm:text-sm">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <TrendingDown className="w-3 h-3 text-financial-negative" />
              <span className="truncate">{t("money.expenses")}</span>
            </div>
            <span className="font-medium text-financial-negative">
              {isLoading ? "..." : `(${formatCurrency(expenses)})`}
            </span>
          </div>

          {/* Divider */}
          <div className="border-t border-border my-1.5" />

          {/* Balance */}
          <div className="flex items-center justify-between">
            <span className={cn(
              "font-medium",
              isHub ? "text-xs sm:text-sm" : "text-xs"
            )}>
              {t("home.netIncome")}
            </span>
            <span className={cn(
              "font-bold",
              isHub ? "text-base sm:text-lg" : "text-sm",
              balance >= 0 ? "text-financial-positive" : "text-financial-negative"
            )}>
              {isLoading ? "..." : formatCurrency(balance)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
