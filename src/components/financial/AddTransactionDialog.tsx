import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, TrendingUp, TrendingDown, Receipt, Camera, AlertCircle, Lock } from "lucide-react";
import { useAppSettings } from "@/contexts/AppSettingsContext";
import { ReceiptScanner } from "./ReceiptScanner";
import { useSubscriptionLimits } from "@/hooks/useSubscriptionLimits";
import { UpgradeModal } from "@/components/ui/UpgradeModal";
interface FinancialSource {
  id: string;
  name: string;
}

interface FinancialCategory {
  id: string;
  name: string;
  type: string;
}

interface AddTransactionDialogProps {
  sources: FinancialSource[];
  categories: FinancialCategory[];
  selectedYear: number;
  selectedMonth: number;
  currentMonthTransactionCount: number;
  onAddIncome: (sourceId: string, amount: number, month: number, notes?: string) => Promise<void>;
  onAddExpense: (categoryId: string, amount: number, month: number, notes?: string) => Promise<void>;
  onCreateSource: (name: string, taxPercentage?: number) => Promise<string | null>;
  onCreateCategory: (name: string, type: "income" | "expense") => Promise<string | null>;
}

const monthsEN = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const monthsPT = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
const monthsFR = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];

interface ExtractedData {
  total: number;
  date: string | null;
  merchant: string;
  type: "income" | "expense";
  suggested_category: string;
  items: { name: string; amount: number }[];
}

export function AddTransactionDialog({
  sources,
  categories,
  selectedYear,
  selectedMonth,
  currentMonthTransactionCount,
  onAddIncome,
  onAddExpense,
  onCreateSource,
  onCreateCategory,
}: AddTransactionDialogProps) {
  const { t, language } = useAppSettings();
  const { isSubscribed, canAddMore, getFeatureLimit } = useSubscriptionLimits();
  const months = language.startsWith("pt") ? monthsPT : monthsEN;
  
  const [open, setOpen] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [activeTab, setActiveTab] = useState<"income" | "expense" | "scan">("income");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const canAddTransaction = canAddMore('transactions', currentMonthTransactionCount);
  const transactionLimit = getFeatureLimit('transactions');
  
  // Income form
  const [incomeSourceId, setIncomeSourceId] = useState("");
  const [incomeAmount, setIncomeAmount] = useState("");
  const [incomeMonth, setIncomeMonth] = useState(selectedMonth.toString());
  const [incomeNotes, setIncomeNotes] = useState("");
  const [newSourceName, setNewSourceName] = useState("");
  const [showNewSource, setShowNewSource] = useState(false);
  
  // Expense form
  const [expenseCategoryId, setExpenseCategoryId] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseMonth, setExpenseMonth] = useState(selectedMonth.toString());
  const [expenseNotes, setExpenseNotes] = useState("");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [showNewCategory, setShowNewCategory] = useState(false);

  const expenseCategories = categories.filter(c => c.type === "expense");

  // Auto-show new source/category input if lists are empty
  useEffect(() => {
    if (sources.length === 0) setShowNewSource(true);
  }, [sources.length]);

  useEffect(() => {
    if (expenseCategories.length === 0) setShowNewCategory(true);
  }, [expenseCategories.length]);

  const resetForm = () => {
    setIncomeSourceId("");
    setIncomeAmount("");
    setIncomeMonth(selectedMonth.toString());
    setIncomeNotes("");
    setNewSourceName("");
    setShowNewSource(sources.length === 0);
    setExpenseCategoryId("");
    setExpenseAmount("");
    setExpenseMonth(selectedMonth.toString());
    setExpenseNotes("");
    setNewCategoryName("");
    setShowNewCategory(expenseCategories.length === 0);
    setActiveTab("income");
  };

  const handleAddIncome = async () => {
    if ((!incomeSourceId && !newSourceName) || !incomeAmount) return;
    
    // Check subscription limit
    if (!canAddTransaction) {
      setShowUpgradeModal(true);
      return;
    }
    
    setIsSubmitting(true);
    try {
      let sourceId = incomeSourceId;
      
      if (showNewSource && newSourceName) {
        const newId = await onCreateSource(newSourceName);
        if (newId) sourceId = newId;
      }
      
      if (sourceId) {
        await onAddIncome(sourceId, Number(incomeAmount), Number(incomeMonth), incomeNotes || undefined);
        resetForm();
        setOpen(false);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddExpense = async () => {
    if ((!expenseCategoryId && !newCategoryName) || !expenseAmount) return;
    
    // Check subscription limit
    if (!canAddTransaction) {
      setShowUpgradeModal(true);
      return;
    }
    
    setIsSubmitting(true);
    try {
      let categoryId = expenseCategoryId;
      
      if (showNewCategory && newCategoryName) {
        const newId = await onCreateCategory(newCategoryName, "expense");
        if (newId) categoryId = newId;
      }
      
      if (categoryId) {
        await onAddExpense(categoryId, Number(expenseAmount), Number(expenseMonth), expenseNotes || undefined);
        resetForm();
        setOpen(false);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleScanData = (data: ExtractedData) => {
    // Determine month from date if available
    let monthFromDate = selectedMonth;
    if (data.date) {
      const dateObj = new Date(data.date);
      if (!isNaN(dateObj.getTime())) {
        monthFromDate = dateObj.getMonth() + 1;
      }
    }

    if (data.type === "income") {
      setActiveTab("income");
      setIncomeAmount(data.total.toString());
      setIncomeMonth(monthFromDate.toString());
      setIncomeNotes(`${data.merchant}${data.suggested_category ? ` - ${data.suggested_category}` : ""}`);
      
      // Try to find matching source
      const matchingSource = sources.find(s => 
        s.name.toLowerCase().includes(data.merchant.toLowerCase()) ||
        data.merchant.toLowerCase().includes(s.name.toLowerCase())
      );
      if (matchingSource) {
        setIncomeSourceId(matchingSource.id);
        setShowNewSource(false);
      } else if (sources.length === 0) {
        setNewSourceName(data.merchant);
        setShowNewSource(true);
      }
    } else {
      setActiveTab("expense");
      setExpenseAmount(data.total.toString());
      setExpenseMonth(monthFromDate.toString());
      setExpenseNotes(`${data.merchant}${data.suggested_category ? ` - ${data.suggested_category}` : ""}`);
      
      // Try to find matching category
      const matchingCategory = expenseCategories.find(c => 
        c.name.toLowerCase().includes(data.suggested_category.toLowerCase()) ||
        data.suggested_category.toLowerCase().includes(c.name.toLowerCase())
      );
      if (matchingCategory) {
        setExpenseCategoryId(matchingCategory.id);
        setShowNewCategory(false);
      } else if (expenseCategories.length === 0) {
        setNewCategoryName(data.suggested_category || data.merchant);
        setShowNewCategory(true);
      }
    }
  };

  return (
    <>
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
      <DialogTrigger asChild>
        <Button className="w-full sm:w-auto bg-god-gold text-god-gold-dark hover:bg-god-gold-glow">
          <Plus className="w-4 h-4 mr-2" />
          {t("money.addTransaction")}
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[calc(100vw-2rem)] max-w-md max-h-[85vh] overflow-y-auto mx-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="w-5 h-5" />
            {t("money.addTransaction")}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "income" | "expense" | "scan")}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="income" className="flex items-center gap-1 text-xs">
              <TrendingUp className="w-3 h-3" />
              {t("money.income")}
            </TabsTrigger>
            <TabsTrigger value="expense" className="flex items-center gap-1 text-xs">
              <TrendingDown className="w-3 h-3" />
              {t("money.expenses")}
            </TabsTrigger>
            <TabsTrigger value="scan" className="flex items-center gap-1 text-xs">
              <Camera className="w-3 h-3" />
              {t("money.scanReceipt")}
            </TabsTrigger>
          </TabsList>

          {/* Scan Tab */}
          <TabsContent value="scan" className="mt-4">
            <ReceiptScanner 
              onDataExtracted={handleScanData}
              onCancel={() => setActiveTab("income")}
            />
          </TabsContent>

          {/* Income Tab */}
          <TabsContent value="income" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>{t("money.sources")}</Label>
              
              {sources.length === 0 && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 p-2 rounded">
                  <AlertCircle className="w-4 h-4" />
                  {t("money.noSourcesHint")}
                </div>
              )}
              
              {!showNewSource && sources.length > 0 ? (
                <div className="space-y-2">
                  <Select value={incomeSourceId} onValueChange={setIncomeSourceId}>
                    <SelectTrigger>
                      <SelectValue placeholder={t("money.selectSource")} />
                    </SelectTrigger>
                    <SelectContent>
                      {sources.map(s => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-xs" 
                    onClick={() => setShowNewSource(true)}
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    {t("money.newSource")}
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Input
                    placeholder={t("money.sourceName")}
                    value={newSourceName}
                    onChange={(e) => setNewSourceName(e.target.value)}
                    autoFocus={sources.length === 0}
                  />
                  {sources.length > 0 && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-xs" 
                      onClick={() => { setShowNewSource(false); setNewSourceName(""); }}
                    >
                      {t("common.cancel")}
                    </Button>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>{t("money.amount")}</Label>
              <Input
                type="number"
                placeholder="0.00"
                value={incomeAmount}
                onChange={(e) => setIncomeAmount(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>{t("money.month")}</Label>
              <Select value={incomeMonth} onValueChange={setIncomeMonth}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {months.map((m, i) => (
                    <SelectItem key={i} value={(i + 1).toString()}>{m} {selectedYear}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t("common.notes")} ({t("common.optional")})</Label>
              <Textarea
                placeholder={t("money.notesPlaceholder")}
                value={incomeNotes}
                onChange={(e) => setIncomeNotes(e.target.value)}
              />
            </div>

            <Button 
              onClick={handleAddIncome} 
              className="w-full bg-financial-positive hover:bg-financial-positive/90"
              disabled={isSubmitting || (!incomeSourceId && !newSourceName) || !incomeAmount}
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              {t("money.addIncome")}
            </Button>
          </TabsContent>

          {/* Expense Tab */}
          <TabsContent value="expense" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>{t("money.addCategory")}</Label>
              
              {expenseCategories.length === 0 && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 p-2 rounded">
                  <AlertCircle className="w-4 h-4" />
                  {t("money.noCategoriesHint")}
                </div>
              )}
              
              {!showNewCategory && expenseCategories.length > 0 ? (
                <div className="space-y-2">
                  <Select value={expenseCategoryId} onValueChange={setExpenseCategoryId}>
                    <SelectTrigger>
                      <SelectValue placeholder={t("money.selectCategory")} />
                    </SelectTrigger>
                    <SelectContent>
                      {expenseCategories.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-xs" 
                    onClick={() => setShowNewCategory(true)}
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    {t("money.newCategory")}
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Input
                    placeholder={t("money.categoryName")}
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    autoFocus={expenseCategories.length === 0}
                  />
                  {expenseCategories.length > 0 && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-xs" 
                      onClick={() => { setShowNewCategory(false); setNewCategoryName(""); }}
                    >
                      {t("common.cancel")}
                    </Button>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>{t("money.amount")}</Label>
              <Input
                type="number"
                placeholder="0.00"
                value={expenseAmount}
                onChange={(e) => setExpenseAmount(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>{t("money.month")}</Label>
              <Select value={expenseMonth} onValueChange={setExpenseMonth}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {months.map((m, i) => (
                    <SelectItem key={i} value={(i + 1).toString()}>{m} {selectedYear}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t("common.notes")} ({t("common.optional")})</Label>
              <Textarea
                placeholder={t("money.notesPlaceholder")}
                value={expenseNotes}
                onChange={(e) => setExpenseNotes(e.target.value)}
              />
            </div>

            <Button 
              onClick={handleAddExpense} 
              className="w-full bg-financial-negative hover:bg-financial-negative/90"
              disabled={isSubmitting || (!expenseCategoryId && !newCategoryName) || !expenseAmount}
            >
              <TrendingDown className="w-4 h-4 mr-2" />
              {t("money.addExpense")}
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>

    {/* Show limit warning if approaching limit */}
    {!isSubscribed && currentMonthTransactionCount >= transactionLimit - 5 && currentMonthTransactionCount < transactionLimit && (
      <div className="text-xs text-amber-600 bg-amber-50 dark:bg-amber-900/20 p-2 rounded mt-2">
        <AlertCircle className="w-3 h-3 inline mr-1" />
        {language.startsWith("pt") 
          ? `Você usou ${currentMonthTransactionCount}/${transactionLimit} transações este mês`
          : `You've used ${currentMonthTransactionCount}/${transactionLimit} transactions this month`
        }
      </div>
    )}

    <UpgradeModal
      open={showUpgradeModal}
      onOpenChange={setShowUpgradeModal}
      feature="transactions"
      currentCount={currentMonthTransactionCount}
      limit={transactionLimit}
    />
    </>
  );
}
