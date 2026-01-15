import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { FileUp, Upload, Loader2, Check, X, FileSpreadsheet, Crown } from "lucide-react";
import { useAppSettings } from "@/contexts/AppSettingsContext";
import { useSubscriptionLimits } from "@/hooks/useSubscriptionLimits";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ParsedTransaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: "income" | "expense";
  selected: boolean;
}

interface FinancialSource {
  id: string;
  name: string;
}

interface FinancialCategory {
  id: string;
  name: string;
  type: string;
}

interface BankStatementImportProps {
  sources: FinancialSource[];
  categories: FinancialCategory[];
  selectedYear: number;
  onImportComplete: () => void;
}

export function BankStatementImport({ 
  sources, 
  categories, 
  selectedYear, 
  onImportComplete 
}: BankStatementImportProps) {
  const { t, formatCurrency, language } = useAppSettings();
  const { canUseFeature } = useSubscriptionLimits();
  const navigate = useNavigate();
  const isPt = language.startsWith('pt');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [open, setOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [transactions, setTransactions] = useState<ParsedTransaction[]>([]);
  const [selectedSourceId, setSelectedSourceId] = useState<string>("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [fileName, setFileName] = useState<string>("");

  const canImport = canUseFeature('bankStatementImport');
  const expenseCategories = categories.filter(c => c.type === "expense");

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setIsAnalyzing(true);
    
    try {
      const content = await file.text();
      const isOFX = file.name.toLowerCase().endsWith('.ofx') || file.name.toLowerCase().endsWith('.qfx');
      
      // Call edge function to parse the file
      const { data, error } = await supabase.functions.invoke('parse-bank-statement', {
        body: { 
          content, 
          fileType: isOFX ? 'ofx' : 'csv',
          fileName: file.name 
        }
      });

      if (error) throw error;

      if (data?.transactions && Array.isArray(data.transactions)) {
        setTransactions(data.transactions.map((t: any, idx: number) => ({
          id: `tx-${idx}`,
          date: t.date || '',
          description: t.description || '',
          amount: Math.abs(Number(t.amount) || 0),
          type: Number(t.amount) >= 0 ? 'income' : 'expense',
          selected: true,
        })));
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Error parsing file:', error);
      toast.error(t("money.errorParseFile") || "Error parsing file");
      setTransactions([]);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const toggleTransaction = (id: string) => {
    setTransactions(prev => 
      prev.map(t => t.id === id ? { ...t, selected: !t.selected } : t)
    );
  };

  const toggleAll = (selected: boolean) => {
    setTransactions(prev => prev.map(t => ({ ...t, selected })));
  };

  const handleImport = async () => {
    const selectedTransactions = transactions.filter(t => t.selected);
    if (selectedTransactions.length === 0) {
      toast.error(t("money.selectTransactions") || "Select at least one transaction");
      return;
    }

    setIsImporting(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const entries = selectedTransactions.map(t => {
        const date = new Date(t.date);
        const month = isNaN(date.getTime()) ? new Date().getMonth() + 1 : date.getMonth() + 1;
        
        return {
          user_id: user.id,
          amount: t.amount,
          month,
          year: selectedYear,
          notes: t.description,
          source_id: t.type === 'income' && selectedSourceId ? selectedSourceId : null,
          category_id: t.type === 'expense' && selectedCategoryId ? selectedCategoryId : null,
        };
      });

      const { error } = await supabase.from('financial_entries').insert(entries);
      if (error) throw error;

      toast.success(`${selectedTransactions.length} ${t("money.transactionsImported") || "transactions imported"}`);
      setOpen(false);
      setTransactions([]);
      setFileName("");
      onImportComplete();
    } catch (error) {
      console.error('Error importing:', error);
      toast.error(t("money.errorImport") || "Error importing transactions");
    } finally {
      setIsImporting(false);
    }
  };

  const reset = () => {
    setTransactions([]);
    setFileName("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const incomeCount = transactions.filter(t => t.type === 'income' && t.selected).length;
  const expenseCount = transactions.filter(t => t.type === 'expense' && t.selected).length;
  const incomeTotal = transactions.filter(t => t.type === 'income' && t.selected).reduce((sum, t) => sum + t.amount, 0);
  const expenseTotal = transactions.filter(t => t.type === 'expense' && t.selected).reduce((sum, t) => sum + t.amount, 0);

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-9">
          <FileUp className="w-4 h-4 mr-2" />
          {t("money.importStatement") || "Import Statement"}
          {!canImport && <Badge variant="secondary" className="ml-1.5 text-[10px] px-1">PRO</Badge>}
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[calc(100vw-2rem)] max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5" />
            {t("money.importBankStatement") || "Import Bank Statement"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          {/* Premium Block */}
          {!canImport ? (
            <div className="space-y-4 text-center py-6">
              <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                <Crown className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">{isPt ? 'Importação Premium' : 'Premium Import'}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {isPt ? 'Faça upgrade para importar extratos bancários automaticamente.' : 'Upgrade to automatically import bank statements.'}
                </p>
              </div>
              <Button onClick={() => navigate('/billing')} className="w-full">
                <Crown className="w-4 h-4 mr-2" />
                {isPt ? 'Fazer Upgrade • 7 dias grátis' : 'Upgrade • 7 days free'}
              </Button>
            </div>
          ) : transactions.length === 0 ? (
          /* File Upload */
            <div className="space-y-3">
              <Label>{t("money.selectFile") || "Select File"}</Label>
              <div 
                className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                {isAnalyzing ? (
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">{t("money.analyzing") || "Analyzing..."}</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="w-8 h-8 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      {t("money.dropOrClick") || "Drop file here or click to upload"}
                    </p>
                    <p className="text-xs text-muted-foreground">CSV, OFX, QFX</p>
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.ofx,.qfx"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          ) : null}

          {/* Transactions List */}
          {transactions.length > 0 && (
            <>
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <p className="text-sm text-muted-foreground">
                  {fileName} • {transactions.length} {t("money.transactions") || "transactions"}
                </p>
                <Button variant="ghost" size="sm" onClick={reset}>
                  {t("money.changeFile") || "Change file"}
                </Button>
              </div>

              {/* Category/Source Selection */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">{t("money.defaultSource") || "Default Source"}</Label>
                  <Select value={selectedSourceId} onValueChange={setSelectedSourceId}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder={t("money.selectSource")} />
                    </SelectTrigger>
                    <SelectContent>
                      {sources.map(s => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">{t("money.defaultCategory") || "Default Category"}</Label>
                  <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder={t("money.selectCategory")} />
                    </SelectTrigger>
                    <SelectContent>
                      {expenseCategories.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Summary */}
              <div className="flex gap-4 text-xs">
                <span className="text-financial-positive">
                  ↑ {incomeCount} = {formatCurrency(incomeTotal)}
                </span>
                <span className="text-financial-negative">
                  ↓ {expenseCount} = {formatCurrency(expenseTotal)}
                </span>
              </div>

              {/* Table */}
              <div className="flex-1 overflow-auto border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">
                        <Checkbox
                          checked={transactions.every(t => t.selected)}
                          onCheckedChange={(checked) => toggleAll(!!checked)}
                        />
                      </TableHead>
                      <TableHead className="text-xs">{t("common.date") || "Date"}</TableHead>
                      <TableHead className="text-xs">{t("common.description") || "Description"}</TableHead>
                      <TableHead className="text-xs text-right">{t("money.amount")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map(tx => (
                      <TableRow key={tx.id} className={!tx.selected ? "opacity-50" : ""}>
                        <TableCell>
                          <Checkbox
                            checked={tx.selected}
                            onCheckedChange={() => toggleTransaction(tx.id)}
                          />
                        </TableCell>
                        <TableCell className="text-xs">{tx.date}</TableCell>
                        <TableCell className="text-xs max-w-[200px] truncate">{tx.description}</TableCell>
                        <TableCell className={`text-xs text-right font-medium ${tx.type === 'income' ? 'text-financial-positive' : 'text-financial-negative'}`}>
                          {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setOpen(false)}>
                  {t("common.cancel")}
                </Button>
                <Button 
                  onClick={handleImport} 
                  disabled={isImporting || transactions.filter(t => t.selected).length === 0}
                  className="bg-god-gold text-god-gold-dark hover:bg-god-gold-glow"
                >
                  {isImporting ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4 mr-2" />
                  )}
                  {t("money.import") || "Import"} ({transactions.filter(t => t.selected).length})
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
