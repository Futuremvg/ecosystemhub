import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { FileText, Upload, Loader2, Lock, CheckCircle, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAppSettings } from "@/contexts/AppSettingsContext";
import { useSubscriptionLimits } from "@/hooks/useSubscriptionLimits";
import { UpgradeModal } from "@/components/ui/UpgradeModal";
import { Progress } from "@/components/ui/progress";

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

interface ParsedTransaction {
  date: string;
  description: string;
  amount: number;
  type: "income" | "expense";
  suggested_category: string;
}

export function BankStatementImport({ 
  sources, 
  categories, 
  selectedYear,
  onImportComplete 
}: BankStatementImportProps) {
  const { t } = useAppSettings();
  const { toast } = useToast();
  const { isSubscribed, canUseFeature } = useSubscriptionLimits();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [open, setOpen] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<"idle" | "uploading" | "parsing" | "importing" | "complete" | "error">("idle");
  const [parsedTransactions, setParsedTransactions] = useState<ParsedTransaction[]>([]);
  const [importedCount, setImportedCount] = useState(0);

  const canImport = canUseFeature('bankStatementImport');

  const handleFileSelect = async (file: File) => {
    if (!canImport) {
      setShowUpgradeModal(true);
      return;
    }

    setIsProcessing(true);
    setStatus("uploading");
    setProgress(10);

    try {
      // Read file content
      const content = await readFileContent(file);
      setProgress(30);
      setStatus("parsing");

      // Send to edge function for parsing
      const { data, error } = await supabase.functions.invoke('parse-bank-statement', {
        body: { 
          content, 
          fileName: file.name,
          mimeType: file.type 
        }
      });

      if (error) throw error;

      setProgress(60);
      
      if (data?.transactions && data.transactions.length > 0) {
        setParsedTransactions(data.transactions);
        setStatus("importing");
        
        // Import transactions
        await importTransactions(data.transactions);
        
        setProgress(100);
        setStatus("complete");
        toast({ 
          title: t("money.importSuccess") || `Successfully imported ${data.transactions.length} transactions` 
        });
        
        setTimeout(() => {
          setOpen(false);
          onImportComplete();
          resetState();
        }, 2000);
      } else {
        setStatus("error");
        toast({ 
          title: t("money.noTransactionsFound") || "No transactions found in file", 
          variant: "destructive" 
        });
      }
    } catch (error) {
      console.error("Error importing bank statement:", error);
      setStatus("error");
      toast({ 
        title: t("money.importError") || "Error importing bank statement", 
        variant: "destructive" 
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      
      if (file.type === 'application/pdf') {
        reader.readAsDataURL(file);
      } else {
        reader.readAsText(file);
      }
    });
  };

  const importTransactions = async (transactions: ParsedTransaction[]) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    let imported = 0;
    
    for (const tx of transactions) {
      try {
        const date = new Date(tx.date);
        const month = date.getMonth() + 1;
        const year = date.getFullYear();

        // Find or create source/category
        let sourceId = null;
        let categoryId = null;

        if (tx.type === "income") {
          const matchingSource = sources.find(s => 
            s.name.toLowerCase().includes(tx.suggested_category.toLowerCase())
          );
          sourceId = matchingSource?.id || sources[0]?.id;
        } else {
          const matchingCategory = categories.find(c => 
            c.type === "expense" && 
            c.name.toLowerCase().includes(tx.suggested_category.toLowerCase())
          );
          categoryId = matchingCategory?.id || categories.find(c => c.type === "expense")?.id;
        }

        // Insert entry
        await supabase.from("financial_entries").insert({
          user_id: user.id,
          source_id: sourceId,
          category_id: categoryId,
          amount: Math.abs(tx.amount),
          month,
          year,
          notes: tx.description,
        });

        imported++;
        setImportedCount(imported);
        setProgress(60 + (imported / transactions.length) * 35);
      } catch (error) {
        console.error("Error importing transaction:", error);
      }
    }
  };

  const resetState = () => {
    setStatus("idle");
    setProgress(0);
    setParsedTransactions([]);
    setImportedCount(0);
    setIsProcessing(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const triggerFileSelect = () => {
    if (!canImport) {
      setShowUpgradeModal(true);
      return;
    }
    fileInputRef.current?.click();
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetState(); }}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="h-9">
            <FileText className="w-4 h-4 mr-2" />
            {t("money.importStatement") || "Import Statement"}
          </Button>
        </DialogTrigger>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              {t("money.importBankStatement") || "Import Bank Statement"}
            </DialogTitle>
          </DialogHeader>

          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.pdf,.ofx,.qfx,.txt"
            className="hidden"
            onChange={handleInputChange}
          />

          {!canImport ? (
            <div className="text-center space-y-4 py-6">
              <div className="w-12 h-12 mx-auto rounded-full bg-muted flex items-center justify-center">
                <Lock className="w-6 h-6 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-medium text-foreground">
                  {t("money.premiumFeature") || "Premium Feature"}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {t("money.importStatementPremium") || "Bank statement import is available for subscribers"}
                </p>
              </div>
              <Button onClick={() => setShowUpgradeModal(true)}>
                {t("common.upgrade") || "Upgrade"}
              </Button>
            </div>
          ) : status === "idle" ? (
            <div className="space-y-4 py-4">
              <div 
                className="border-2 border-dashed border-muted rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
                onClick={triggerFileSelect}
              >
                <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-3" />
                <p className="text-sm font-medium">
                  {t("money.clickToUpload") || "Click to upload"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  CSV, PDF, OFX, QFX
                </p>
              </div>
              <p className="text-xs text-center text-muted-foreground">
                {t("money.importHint") || "Upload your bank statement to automatically import transactions"}
              </p>
            </div>
          ) : (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {status === "uploading" && (t("money.uploading") || "Uploading...")}
                    {status === "parsing" && (t("money.parsing") || "Parsing...")}
                    {status === "importing" && (t("money.importing") || `Importing ${importedCount}/${parsedTransactions.length}...`)}
                    {status === "complete" && (t("money.importComplete") || "Import complete!")}
                    {status === "error" && (t("money.importFailed") || "Import failed")}
                  </span>
                  <span className="font-medium">{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>

              {status === "complete" && (
                <div className="flex items-center justify-center gap-2 text-green-600">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium">
                    {parsedTransactions.length} {t("money.transactionsImported") || "transactions imported"}
                  </span>
                </div>
              )}

              {status === "error" && (
                <div className="flex items-center justify-center gap-2 text-destructive">
                  <AlertCircle className="w-5 h-5" />
                  <span className="font-medium">
                    {t("money.tryAgain") || "Please try again"}
                  </span>
                </div>
              )}

              {isProcessing && (
                <div className="flex items-center justify-center">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <UpgradeModal 
        open={showUpgradeModal} 
        onOpenChange={setShowUpgradeModal}
        feature="bankStatementImport"
      />
    </>
  );
}
