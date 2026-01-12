import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  DollarSign, Plus, ChevronLeft, ChevronRight, Download, 
  TrendingUp, TrendingDown, Settings, Loader2, Trash2, Edit, Wallet
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAppSettings } from "@/contexts/AppSettingsContext";
import { FinancialSettingsPanel } from "@/components/financial/FinancialSettingsPanel";
import { AddTransactionDialog } from "@/components/financial/AddTransactionDialog";
import { BankStatementImport } from "@/components/financial/BankStatementImport";

interface FinancialSource {
  id: string;
  name: string;
  tax_percentage: number;
  description?: string;
  color?: string;
  sort_order?: number;
}

interface FinancialCategory {
  id: string;
  name: string;
  type: string;
  parent_id?: string | null;
  icon?: string;
  color?: string;
  sort_order?: number;
}

interface FinancialEntry {
  id: string;
  source_id: string | null;
  category_id: string | null;
  amount: number;
  month: number;
  year: number;
}

const monthsEN = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

const monthsPT = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez"
];

const monthsFR = [
  "Jan", "Fév", "Mar", "Avr", "Mai", "Jun",
  "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"
];

type ViewMode = "annual" | "monthly" | "weekly";

export default function Dinheiro() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const { formatCurrency, language, t } = useAppSettings();
  const months = language.startsWith("pt") ? monthsPT : language.startsWith("fr") ? monthsFR : monthsEN;
  
  const [sources, setSources] = useState<FinancialSource[]>([]);
  const [categories, setCategories] = useState<FinancialCategory[]>([]);
  const [entries, setEntries] = useState<FinancialEntry[]>([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [viewMode, setViewMode] = useState<ViewMode>("annual");
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("incomes");
  
  // Dialogs
  const [isAddingSource, setIsAddingSource] = useState(false);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [editingSource, setEditingSource] = useState<FinancialSource | null>(null);
  const [editingCategory, setEditingCategory] = useState<FinancialCategory | null>(null);
  const [newSource, setNewSource] = useState({ name: "", tax_percentage: 0 });
  const [newCategory, setNewCategory] = useState({ name: "", type: "expense" as "expense" | "income" });

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, selectedYear]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [sourcesRes, categoriesRes, entriesRes] = await Promise.all([
        supabase.from("financial_sources").select("*"),
        supabase.from("financial_categories").select("*"),
        supabase.from("financial_entries").select("*").eq("year", selectedYear),
      ]);

      if (sourcesRes.error) throw sourcesRes.error;
      if (categoriesRes.error) throw categoriesRes.error;
      if (entriesRes.error) throw entriesRes.error;

      setSources(sourcesRes.data || []);
      setCategories(categoriesRes.data || []);
      setEntries(entriesRes.data || []);
    } catch (error) {
      console.error("Error loading data:", error);
      toast({ title: t("money.errorLoadData"), variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddSource = async () => {
    if (!newSource.name) return;
    try {
      const { data, error } = await supabase
        .from("financial_sources")
        .insert({ user_id: user!.id, ...newSource })
        .select()
        .single();

      if (error) throw error;
      setSources([...sources, data]);
      setNewSource({ name: "", tax_percentage: 0 });
      setIsAddingSource(false);
      toast({ title: t("money.sourceAdded") });
    } catch (error) {
      toast({ title: t("money.errorAddSource"), variant: "destructive" });
    }
  };

  const handleAddCategory = async () => {
    if (!newCategory.name) return;
    try {
      const { data, error } = await supabase
        .from("financial_categories")
        .insert({ user_id: user!.id, ...newCategory })
        .select()
        .single();

      if (error) throw error;
      setCategories([...categories, data]);
      setNewCategory({ name: "", type: "expense" });
      setIsAddingCategory(false);
      toast({ title: t("money.categoryAdded") });
    } catch (error) {
      toast({ title: t("money.errorAddCategory"), variant: "destructive" });
    }
  };

  // Handler for AddTransactionDialog
  const handleAddIncomeFromDialog = async (sourceId: string, amount: number, month: number, notes?: string) => {
    try {
      const { data, error } = await supabase
        .from("financial_entries")
        .insert({
          user_id: user!.id,
          source_id: sourceId,
          category_id: null,
          month,
          year: selectedYear,
          amount,
          notes: notes || null,
        })
        .select()
        .single();

      if (error) throw error;
      setEntries([...entries, data]);
      toast({ title: t("money.sourceAdded") });
    } catch (error) {
      console.error("Error adding income:", error);
      toast({ title: t("money.errorAddSource"), variant: "destructive" });
    }
  };

  const handleAddExpenseFromDialog = async (categoryId: string, amount: number, month: number, notes?: string) => {
    try {
      const { data, error } = await supabase
        .from("financial_entries")
        .insert({
          user_id: user!.id,
          source_id: null,
          category_id: categoryId,
          month,
          year: selectedYear,
          amount,
          notes: notes || null,
        })
        .select()
        .single();

      if (error) throw error;
      setEntries([...entries, data]);
      toast({ title: t("money.categoryAdded") });
    } catch (error) {
      console.error("Error adding expense:", error);
      toast({ title: t("money.errorAddCategory"), variant: "destructive" });
    }
  };

  const handleCreateSourceFromDialog = async (name: string, taxPercentage?: number): Promise<string | null> => {
    try {
      const { data, error } = await supabase
        .from("financial_sources")
        .insert({ user_id: user!.id, name, tax_percentage: taxPercentage || 0 })
        .select()
        .single();

      if (error) throw error;
      setSources([...sources, data]);
      return data.id;
    } catch (error) {
      toast({ title: t("money.errorAddSource"), variant: "destructive" });
      return null;
    }
  };

  const handleCreateCategoryFromDialog = async (name: string, type: "income" | "expense"): Promise<string | null> => {
    try {
      const { data, error } = await supabase
        .from("financial_categories")
        .insert({ user_id: user!.id, name, type })
        .select()
        .single();

      if (error) throw error;
      setCategories([...categories, data]);
      return data.id;
    } catch (error) {
      toast({ title: t("money.errorAddCategory"), variant: "destructive" });
      return null;
    }
  };

  const handleEntryChange = async (
    sourceId: string | null,
    categoryId: string | null,
    month: number,
    value: number
  ) => {
    try {
      const existingEntry = entries.find(
        e => e.source_id === sourceId && 
             e.category_id === categoryId && 
             e.month === month && 
             e.year === selectedYear
      );

      if (existingEntry) {
        if (value === 0) {
          await supabase.from("financial_entries").delete().eq("id", existingEntry.id);
          setEntries(entries.filter(e => e.id !== existingEntry.id));
        } else {
          await supabase.from("financial_entries").update({ amount: value }).eq("id", existingEntry.id);
          setEntries(entries.map(e => e.id === existingEntry.id ? { ...e, amount: value } : e));
        }
      } else if (value !== 0) {
        const { data, error } = await supabase
          .from("financial_entries")
          .insert({
            user_id: user!.id,
            source_id: sourceId,
            category_id: categoryId,
            month,
            year: selectedYear,
            amount: value,
          })
          .select()
          .single();

        if (error) throw error;
        setEntries([...entries, data]);
      }
    } catch (error) {
      console.error("Error updating entry:", error);
      toast({ title: t("money.errorUpdateValue"), variant: "destructive" });
    }
  };

  const getEntryValue = (sourceId: string | null, categoryId: string | null, month: number): number => {
    const entry = entries.find(
      e => e.source_id === sourceId && 
           e.category_id === categoryId && 
           e.month === month
    );
    return entry?.amount || 0;
  };

  const getMonthlyTotal = (month: number, type: "income" | "expense" | "all"): number => {
    if (type === "all" || type === "income") {
      return entries
        .filter(e => e.month === month && e.source_id !== null)
        .reduce((sum, e) => sum + Number(e.amount), 0);
    }
    return entries
      .filter(e => e.month === month && e.category_id !== null)
      .reduce((sum, e) => sum + Number(e.amount), 0);
  };

  const getSourceMonthlyTotal = (sourceId: string, month: number): number => {
    return entries
      .filter(e => e.source_id === sourceId && e.month === month)
      .reduce((sum, e) => sum + Number(e.amount), 0);
  };

  const getCategoryMonthlyTotal = (categoryId: string, month: number): number => {
    return entries
      .filter(e => e.category_id === categoryId && e.month === month)
      .reduce((sum, e) => sum + Number(e.amount), 0);
  };

  const formatCurrencyValue = (value: number): string => {
    return formatCurrency(value);
  };

  const exportToCSV = () => {
    const rows = [["Tipo", "Nome", ...months.map((m, i) => `${m}/${selectedYear}`)]];
    
    sources.forEach(source => {
      const values = months.map((_, i) => getSourceMonthlyTotal(source.id, i + 1));
      rows.push(["Receita", source.name, ...values.map(v => v.toString())]);
    });
    
    categories.filter(c => c.type === "expense").forEach(cat => {
      const values = months.map((_, i) => getCategoryMonthlyTotal(cat.id, i + 1));
      rows.push(["Despesa", cat.name, ...values.map(v => v.toString())]);
    });

    const csv = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `financeiro_${selectedYear}.csv`;
    a.click();
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  const incomeCategories = categories.filter(c => c.type === "income");
  const expenseCategories = categories.filter(c => c.type === "expense");

  return (
    <AppLayout>
      <div className="space-y-6 w-full">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <DollarSign className="w-5 h-5 text-primary" />
                </div>
                <span className="truncate">{t("money.title")}</span>
              </h1>
              <p className="text-xs text-muted-foreground mt-1 truncate">
                {t("money.subtitle")}
              </p>
            </div>
            {/* Year Selector */}
            <div className="flex items-center gap-0.5 bg-secondary rounded-lg p-0.5 shrink-0">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setSelectedYear(y => y - 1)}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="px-2 font-medium text-sm">{selectedYear}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setSelectedYear(y => y + 1)}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          {/* Action Buttons Row */}
          <div className="flex flex-col sm:flex-row gap-2">
            <AddTransactionDialog
              sources={sources}
              categories={categories}
              selectedYear={selectedYear}
              selectedMonth={selectedMonth}
              onAddIncome={handleAddIncomeFromDialog}
              onAddExpense={handleAddExpenseFromDialog}
              onCreateSource={handleCreateSourceFromDialog}
              onCreateCategory={handleCreateCategoryFromDialog}
            />
            <BankStatementImport
              sources={sources}
              categories={categories}
              selectedYear={selectedYear}
              onImportComplete={loadData}
            />
            <Button variant="outline" size="sm" onClick={exportToCSV} className="h-9">
              <Download className="w-4 h-4 mr-2" />
              {t("common.export")}
            </Button>
          </div>
        </div>

        {/* Summary Cards - Mobile-first responsive layout */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-primary/10 to-primary/5 shadow-sm">
            <div className="absolute top-0 right-0 w-20 h-20 bg-primary/10 rounded-full -translate-y-8 translate-x-8" />
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-primary/20 shrink-0">
                  <TrendingUp className="w-5 h-5 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground/80">{t("money.income")}</p>
                  <p className="text-xl sm:text-lg font-bold text-foreground">
                    {formatCurrency(
                      months.reduce((sum, _, i) => sum + getMonthlyTotal(i + 1, "income"), 0)
                    )}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-destructive/10 to-destructive/5 shadow-sm">
            <div className="absolute top-0 right-0 w-20 h-20 bg-destructive/10 rounded-full -translate-y-8 translate-x-8" />
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-destructive/20 shrink-0">
                  <TrendingDown className="w-5 h-5 text-destructive" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground/80">{t("money.expenses")}</p>
                  <p className="text-xl sm:text-lg font-bold text-foreground">
                    {formatCurrency(
                      entries
                        .filter(e => e.category_id !== null)
                        .reduce((sum, e) => sum + Number(e.amount), 0)
                    )}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {(() => {
            const balance = months.reduce((sum, _, i) => sum + getMonthlyTotal(i + 1, "income"), 0) -
              entries.filter(e => e.category_id !== null).reduce((sum, e) => sum + Number(e.amount), 0);
            const isPositive = balance >= 0;
            return (
              <Card className={cn(
                "relative overflow-hidden border-0 shadow-sm",
                isPositive
                  ? "bg-gradient-to-br from-primary/15 to-primary/5" 
                  : "bg-gradient-to-br from-destructive/15 to-destructive/5"
              )}>
                <div className={cn(
                  "absolute top-0 right-0 w-20 h-20 rounded-full -translate-y-8 translate-x-8",
                  isPositive ? "bg-primary/15" : "bg-destructive/15"
                )} />
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "p-2.5 rounded-lg shrink-0",
                      isPositive ? "bg-primary/20" : "bg-destructive/20"
                    )}>
                      <Wallet className={cn("w-5 h-5", isPositive ? "text-primary" : "text-destructive")} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground/80">{t("common.result")}</p>
                      <p className={cn(
                        "text-xl sm:text-lg font-bold",
                        isPositive ? "text-primary" : "text-destructive"
                      )}>
                        {formatCurrency(balance)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })()}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 md:w-auto md:inline-grid h-auto">
            <TabsTrigger value="incomes" className="text-xs sm:text-sm py-2 px-2 sm:px-4">{t("money.income")}</TabsTrigger>
            <TabsTrigger value="expenses" className="text-xs sm:text-sm py-2 px-2 sm:px-4">{t("money.expenses")}</TabsTrigger>
            <TabsTrigger value="report" className="text-xs sm:text-sm py-2 px-2 sm:px-4">{t("common.report")}</TabsTrigger>
            <TabsTrigger value="settings" className="text-xs sm:text-sm py-2 px-2 sm:px-4">{t("common.settings")}</TabsTrigger>
          </TabsList>

          {/* Incomes Tab */}
          <TabsContent value="incomes" className="mt-4">
            <Card className="material-card">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>{t("money.sources")}</CardTitle>
                  <CardDescription>{t("money.sourcesDesc")}</CardDescription>
                </div>
                <Dialog open={isAddingSource} onOpenChange={setIsAddingSource}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
                      <Plus className="w-4 h-4 mr-2" />
                      {t("money.addSource")}
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{t("money.newSource")}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                      <div>
                        <Label>{t("ecosystem.name")}</Label>
                        <Input
                          placeholder="Ex: Client ABC"
                          value={newSource.name}
                          onChange={(e) => setNewSource({ ...newSource, name: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>{t("money.taxPercent")}</Label>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={newSource.tax_percentage}
                          onChange={(e) => setNewSource({ ...newSource, tax_percentage: Number(e.target.value) })}
                        />
                      </div>
                      <Button onClick={handleAddSource} className="w-full">{t("common.add")}</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[150px]">{t("money.sources")}</TableHead>
                        {months.map((m, i) => (
                          <TableHead key={i} className="text-center min-w-[100px]">{m}</TableHead>
                        ))}
                        <TableHead className="text-center min-w-[120px]">{t("common.total")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sources.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={14} className="text-center py-8 text-muted-foreground">
                            {t("money.noSources")}
                          </TableCell>
                        </TableRow>
                      ) : (
                        sources.map((source) => (
                          <TableRow key={source.id}>
                            <TableCell className="font-medium">{source.name}</TableCell>
                            {months.map((_, i) => {
                              const value = getSourceMonthlyTotal(source.id, i + 1);
                              return (
                                <TableCell key={i} className="text-center">
                                  <Input
                                    type="number"
                                    className="w-20 text-center mx-auto"
                                    value={value || ""}
                                    placeholder="0"
                                    onChange={(e) => handleEntryChange(source.id, null, i + 1, Number(e.target.value))}
                                  />
                                </TableCell>
                              );
                            })}
                            <TableCell className="text-center font-bold text-financial-positive">
                              {formatCurrency(
                                months.reduce((sum, _, i) => sum + getSourceMonthlyTotal(source.id, i + 1), 0)
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                      {sources.length > 0 && (
                        <TableRow className="bg-muted/50 font-bold">
                          <TableCell>{t("common.total")}</TableCell>
                          {months.map((_, i) => (
                            <TableCell key={i} className="text-center text-financial-positive">
                              {formatCurrency(getMonthlyTotal(i + 1, "income"))}
                            </TableCell>
                          ))}
                          <TableCell className="text-center text-financial-positive">
                            {formatCurrency(
                              months.reduce((sum, _, i) => sum + getMonthlyTotal(i + 1, "income"), 0)
                            )}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Expenses Tab */}
          <TabsContent value="expenses" className="mt-4">
            <Card className="material-card">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>{t("money.expenses")}</CardTitle>
                  <CardDescription>{t("money.categoriesDesc")}</CardDescription>
                </div>
                <Dialog open={isAddingCategory} onOpenChange={setIsAddingCategory}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
                      <Plus className="w-4 h-4 mr-2" />
                      {t("money.addCategory")}
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{t("money.newCategory")}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                      <div>
                        <Label>{t("ecosystem.name")}</Label>
                        <Input
                          placeholder="Ex: Materials"
                          value={newCategory.name}
                          onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>{t("money.addCategory")}</Label>
                        <Select
                          value={newCategory.type}
                          onValueChange={(v: "expense" | "income") => setNewCategory({ ...newCategory, type: v })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="expense">{t("money.expenses")}</SelectItem>
                            <SelectItem value="income">{t("money.income")}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button onClick={handleAddCategory} className="w-full">{t("common.add")}</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[150px]">{t("money.addCategory")}</TableHead>
                        {months.map((m, i) => (
                          <TableHead key={i} className="text-center min-w-[100px]">{m}</TableHead>
                        ))}
                        <TableHead className="text-center min-w-[120px]">{t("common.total")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {expenseCategories.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={14} className="text-center py-8 text-muted-foreground">
                            {t("money.noCategories")}
                          </TableCell>
                        </TableRow>
                      ) : (
                        expenseCategories.map((cat) => (
                          <TableRow key={cat.id}>
                            <TableCell className="font-medium">{cat.name}</TableCell>
                            {months.map((_, i) => {
                              const value = getCategoryMonthlyTotal(cat.id, i + 1);
                              return (
                                <TableCell key={i} className="text-center">
                                  <Input
                                    type="number"
                                    className="w-20 text-center mx-auto"
                                    value={value || ""}
                                    placeholder="0"
                                    onChange={(e) => handleEntryChange(null, cat.id, i + 1, Number(e.target.value))}
                                  />
                                </TableCell>
                              );
                            })}
                            <TableCell className="text-center font-bold text-financial-negative">
                              {formatCurrency(
                                months.reduce((sum, _, i) => sum + getCategoryMonthlyTotal(cat.id, i + 1), 0)
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Report Tab */}
          <TabsContent value="report" className="mt-4">
            <Card className="material-card">
              <CardHeader>
                <CardTitle>{t("money.annualReport")} {selectedYear}</CardTitle>
                <CardDescription>{t("money.reportDesc")}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead></TableHead>
                        {months.map((m, i) => (
                          <TableHead key={i} className="text-center">{m}</TableHead>
                        ))}
                        <TableHead className="text-center">{t("common.total")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-medium">{t("money.income")}</TableCell>
                        {months.map((_, i) => (
                          <TableCell key={i} className="text-center text-financial-positive">
                            {formatCurrency(getMonthlyTotal(i + 1, "income"))}
                          </TableCell>
                        ))}
                        <TableCell className="text-center font-bold text-financial-positive">
                          {formatCurrency(months.reduce((sum, _, i) => sum + getMonthlyTotal(i + 1, "income"), 0))}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">{t("money.expenses")}</TableCell>
                        {months.map((_, i) => {
                          const total = entries
                            .filter(e => e.month === i + 1 && e.category_id !== null)
                            .reduce((sum, e) => sum + Number(e.amount), 0);
                          return (
                            <TableCell key={i} className="text-center text-financial-negative">
                              {formatCurrency(total)}
                            </TableCell>
                          );
                        })}
                        <TableCell className="text-center font-bold text-financial-negative">
                          {formatCurrency(
                            entries.filter(e => e.category_id !== null).reduce((sum, e) => sum + Number(e.amount), 0)
                          )}
                        </TableCell>
                      </TableRow>
                      <TableRow className="bg-muted/50">
                        <TableCell className="font-bold">{t("common.result")}</TableCell>
                        {months.map((_, i) => {
                          const income = getMonthlyTotal(i + 1, "income");
                          const expense = entries
                            .filter(e => e.month === i + 1 && e.category_id !== null)
                            .reduce((sum, e) => sum + Number(e.amount), 0);
                          const result = income - expense;
                          return (
                            <TableCell 
                              key={i} 
                              className={cn(
                                "text-center font-bold",
                                result >= 0 ? "text-financial-positive" : "text-financial-negative"
                              )}
                            >
                              {formatCurrency(result)}
                            </TableCell>
                          );
                        })}
                        <TableCell className="text-center font-bold">
                          {formatCurrency(
                            months.reduce((sum, _, i) => sum + getMonthlyTotal(i + 1, "income"), 0) -
                            entries.filter(e => e.category_id !== null).reduce((sum, e) => sum + Number(e.amount), 0)
                          )}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="mt-4">
            <Card className="material-card">
              <CardHeader>
                <CardTitle>{t("money.settingsTitle")}</CardTitle>
                <CardDescription>{t("money.settingsDesc")}</CardDescription>
              </CardHeader>
              <CardContent>
                <FinancialSettingsPanel
                  sources={sources}
                  categories={categories}
                  setSources={setSources}
                  setCategories={setCategories}
                  userId={user!.id}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}