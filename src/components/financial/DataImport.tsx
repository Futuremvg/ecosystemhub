import { useState, useRef, useMemo, useCallback } from "react";
import { FileSpreadsheet, Upload, X, Loader2, Check, AlertCircle, ChevronLeft, ChevronRight, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useAppSettings } from "@/contexts/AppSettingsContext";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { parseMoney, parseDate, validateImportRows, type RowValidation } from "@/lib/parseMoney";
import * as XLSX from "xlsx";

// Dev logging helper
const isDev = typeof window !== 'undefined' && window.location.hostname === 'localhost';
function devLog(step: string, data?: unknown) {
  if (isDev) {
    console.log(`[DataImport] ${step}`, data ?? '');
  }
}

interface DataImportProps {
  sources: { id: string; name: string }[];
  categories: { id: string; name: string; type: string }[];
  selectedYear: number;
  onImportComplete: () => void;
}

type ColumnMapping = {
  date: string;
  amount: string;
  description: string;
  category?: string;
  counterparty?: string;
  type?: string;
};

type ParsedRow = Record<string, string | number>;

type ImportStep = "upload" | "preview" | "mapping" | "confirm" | "importing" | "result";

interface ImportError {
  rowIndex: number;
  error: string;
  rowData: ParsedRow;
}

const SYSTEM_FIELDS = [
  { key: "date", label: "Date", required: true },
  { key: "amount", label: "Amount", required: true },
  { key: "description", label: "Description", required: true },
  { key: "category", label: "Category", required: false },
  { key: "counterparty", label: "Counterparty/Vendor", required: false },
  { key: "type", label: "Type (income/expense)", required: false },
];

const BATCH_SIZE = 50;

export function DataImport({ sources, categories, selectedYear, onImportComplete }: DataImportProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<ImportStep>("upload");
  const [isLoading, setIsLoading] = useState(false);
  const [fileName, setFileName] = useState("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [mapping, setMapping] = useState<Partial<ColumnMapping>>({});
  const [rowValidations, setRowValidations] = useState<RowValidation[]>([]);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });
  const [importResult, setImportResult] = useState<{
    imported: number;
    skipped: number;
    invalid: number;
    errors: ImportError[];
  } | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { t, language } = useAppSettings();
  const isPt = language === 'pt-BR';

  const resetState = useCallback(() => {
    setStep("upload");
    setFileName("");
    setHeaders([]);
    setRows([]);
    setMapping({});
    setRowValidations([]);
    setImportProgress({ current: 0, total: 0 });
    setImportResult(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    devLog("File selected", { name: file.name, size: file.size, type: file.type });
    setIsLoading(true);
    setFileName(file.name);

    try {
      const extension = file.name.split(".").pop()?.toLowerCase();
      
      if (extension === "csv") {
        await parseCSV(file);
      } else if (extension === "xlsx" || extension === "xls") {
        await parseXLSX(file);
      } else {
        throw new Error("Unsupported file format. Use CSV or XLSX.");
      }

      setStep("preview");
    } catch (error) {
      console.error("Parse error:", error);
      toast({
        title: isPt ? "Erro ao ler arquivo" : "Error reading file",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
      resetState();
    } finally {
      setIsLoading(false);
    }
  };

  const parseCSV = (file: File): Promise<void> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const text = event.target?.result as string;
          const lines = text.split(/\r?\n/).filter(line => line.trim());
          
          devLog("CSV parsed", { totalLines: lines.length });
          
          if (lines.length < 2) {
            reject(new Error("File must have at least a header row and one data row"));
            return;
          }

          // Detect delimiter (comma, semicolon, or tab)
          const firstLine = lines[0];
          const delimiter = firstLine.includes(";") ? ";" : firstLine.includes("\t") ? "\t" : ",";
          
          const headerLine = lines[0].split(delimiter).map(h => h.trim().replace(/^["']|["']$/g, ""));
          setHeaders(headerLine);
          devLog("Detected columns", { columns: headerLine, delimiter });

          const dataRows: ParsedRow[] = [];
          for (let i = 1; i < Math.min(lines.length, 1001); i++) { // Limit to 1000 rows
            const values = lines[i].split(delimiter).map(v => v.trim().replace(/^["']|["']$/g, ""));
            const row: ParsedRow = {};
            headerLine.forEach((header, idx) => {
              row[header] = values[idx] || "";
            });
            dataRows.push(row);
          }
          setRows(dataRows);
          devLog("Parsed rows count", { count: dataRows.length });
          autoDetectMapping(headerLine);
          resolve();
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsText(file);
    });
  };

  const parseXLSX = async (file: File): Promise<void> => {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: "array" });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const jsonData = XLSX.utils.sheet_to_json<(string | number)[]>(worksheet, { header: 1 });

    devLog("XLSX parsed", { totalRows: jsonData.length, sheet: firstSheetName });

    if (jsonData.length < 2) {
      throw new Error("File must have at least a header row and one data row");
    }

    const headerRow = (jsonData[0]).map(h => String(h || "").trim());
    setHeaders(headerRow);
    devLog("Detected columns", { columns: headerRow });

    const dataRows: ParsedRow[] = [];
    for (let i = 1; i < Math.min(jsonData.length, 1001); i++) { // Limit to 1000 rows
      const values = jsonData[i];
      const row: ParsedRow = {};
      headerRow.forEach((header, idx) => {
        row[header] = values?.[idx] ?? "";
      });
      dataRows.push(row);
    }
    setRows(dataRows);
    devLog("Parsed rows count", { count: dataRows.length });
    autoDetectMapping(headerRow);
  };

  const autoDetectMapping = (cols: string[]) => {
    const detected: Partial<ColumnMapping> = {};
    
    const datePatterns = ["date", "data", "fecha", "datum", "transaction_date", "transação"];
    const amountPatterns = ["amount", "valor", "value", "montante", "total", "price", "preço"];
    const descPatterns = ["description", "descrição", "descricao", "desc", "memo", "notes", "observação"];
    const categoryPatterns = ["category", "categoria", "type", "tipo"];
    const counterpartyPatterns = ["counterparty", "vendor", "fornecedor", "cliente", "name", "nome", "party"];
    const typePatterns = ["income", "expense", "receita", "despesa", "entrada", "saída", "tipo"];

    cols.forEach(col => {
      const lowerCol = col.toLowerCase();
      if (!detected.date && datePatterns.some(p => lowerCol.includes(p))) detected.date = col;
      if (!detected.amount && amountPatterns.some(p => lowerCol.includes(p))) detected.amount = col;
      if (!detected.description && descPatterns.some(p => lowerCol.includes(p))) detected.description = col;
      if (!detected.category && categoryPatterns.some(p => lowerCol.includes(p))) detected.category = col;
      if (!detected.counterparty && counterpartyPatterns.some(p => lowerCol.includes(p))) detected.counterparty = col;
      if (!detected.type && typePatterns.some(p => lowerCol.includes(p))) detected.type = col;
    });

    devLog("Auto-detected mapping", detected);
    setMapping(detected);
  };

  // Memoized validation with robust parsing
  const validationStats = useMemo(() => {
    if (!mapping.date || !mapping.amount || rows.length === 0) {
      return { validCount: 0, invalidCount: 0, totalErrors: { amount: 0, date: 0 }, validations: [] };
    }
    
    const result = validateImportRows(rows, mapping.date, mapping.amount);
    devLog("Validation complete", { 
      valid: result.validCount, 
      invalid: result.invalidCount,
      errors: result.totalErrors 
    });
    return result;
  }, [rows, mapping.date, mapping.amount]);

  const previewRows = useMemo(() => rows.slice(0, 20), [rows]);

  const handleMappingChange = (field: keyof ColumnMapping, column: string) => {
    setMapping(prev => ({
      ...prev,
      [field]: column === "__none__" ? undefined : column,
    }));
  };

  const proceedToMapping = () => {
    setStep("mapping");
  };

  const proceedToConfirm = () => {
    // Run validation
    if (mapping.date && mapping.amount) {
      const result = validateImportRows(rows, mapping.date, mapping.amount);
      setRowValidations(result.validations);
    }
    setStep("confirm");
  };

  const handleImport = async () => {
    devLog("Confirm import clicked");
    setStep("importing");
    setIsLoading(true);
    
    const errors: ImportError[] = [];
    let imported = 0;
    let skipped = 0;
    
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Not authenticated");

      // Get valid rows only
      const validRows = rows.filter((_, idx) => {
        const validation = validationStats.validations[idx];
        return validation?.isValid;
      });
      
      const total = validRows.length;
      setImportProgress({ current: 0, total });
      devLog("Starting import", { validRows: total });

      // Get existing entries for fingerprint checking
      const { data: existingEntries } = await supabase
        .from("financial_entries")
        .select("notes, amount, month, year")
        .eq("user_id", userData.user.id)
        .eq("year", selectedYear);

      const existingFingerprints = new Set(
        (existingEntries || []).map(e => 
          `${Math.abs(Number(e.amount))}-${e.month}-${(e.notes || "").toLowerCase().trim()}`
        )
      );

      // Process in batches
      for (let batchStart = 0; batchStart < validRows.length; batchStart += BATCH_SIZE) {
        const batch = validRows.slice(batchStart, batchStart + BATCH_SIZE);
        const batchInserts: Array<{
          user_id: string;
          source_id: string | null;
          category_id: string | null;
          amount: number;
          month: number;
          year: number;
          notes: string;
        }> = [];
        
        for (const row of batch) {
          const rowIndex = rows.indexOf(row);
          
          try {
            // Parse amount with robust parser
            const amountResult = parseMoney(row[mapping.amount!]);
            if (amountResult.value === null) {
              errors.push({ rowIndex, error: amountResult.error || 'Invalid amount', rowData: row });
              continue;
            }
            const amount = amountResult.value;
            
            // Parse date
            const parsedDate = parseDate(row[mapping.date!]);
            if (!parsedDate) {
              errors.push({ rowIndex, error: 'Invalid date', rowData: row });
              continue;
            }
            
            const month = parsedDate.getMonth() + 1;
            const year = parsedDate.getFullYear();
            
            // Skip if not in selected year
            if (year !== selectedYear) {
              skipped++;
              continue;
            }
            
            const description = mapping.description ? String(row[mapping.description] || "").trim() : "";
            
            // Check for duplicates using fingerprint
            const fingerprint = `${Math.abs(amount)}-${month}-${description.toLowerCase().trim()}`;
            if (existingFingerprints.has(fingerprint)) {
              skipped++;
              devLog("Duplicate skipped", { fingerprint });
              continue;
            }
            
            // Determine if income or expense based on sign or type column
            let isIncome = amount >= 0;
            if (mapping.type) {
              const typeValue = String(row[mapping.type] || "").toLowerCase();
              if (typeValue.match(/income|receita|entrada|revenue/)) {
                isIncome = true;
              } else if (typeValue.match(/expense|despesa|saída|cost/)) {
                isIncome = false;
              }
            }
            
            // Find or use default source/category
            let sourceId: string | null = null;
            let categoryId: string | null = null;
            
            if (isIncome) {
              sourceId = sources[0]?.id || null;
            } else {
              const expenseCat = categories.find(c => c.type === "expense");
              categoryId = expenseCat?.id || null;
            }
            
            if (!sourceId && !categoryId) {
              skipped++;
              continue;
            }
            
            batchInserts.push({
              user_id: userData.user.id,
              source_id: sourceId,
              category_id: categoryId,
              amount: Math.abs(amount),
              month,
              year,
              notes: description,
            });
            
            // Add to fingerprints to prevent duplicates within same import
            existingFingerprints.add(fingerprint);
          } catch (err) {
            errors.push({ 
              rowIndex, 
              error: err instanceof Error ? err.message : 'Unknown error', 
              rowData: row 
            });
          }
        }
        
        // Insert batch
        if (batchInserts.length > 0) {
          const { error: insertError, data: insertedData } = await supabase
            .from("financial_entries")
            .insert(batchInserts)
            .select("id");
          
          if (insertError) {
            devLog("Batch insert error", insertError);
            // Mark all rows in this batch as failed
            batch.forEach((row, i) => {
              errors.push({ 
                rowIndex: rows.indexOf(row), 
                error: insertError.message, 
                rowData: row 
              });
            });
          } else {
            imported += insertedData?.length || 0;
          }
        }
        
        // Update progress
        setImportProgress({ current: batchStart + batch.length, total });
        
        // Small delay to prevent UI freeze
        await new Promise(resolve => setTimeout(resolve, 10));
      }
      
      devLog("Import complete", { imported, skipped, errors: errors.length });
      
      setImportResult({ 
        imported, 
        skipped, 
        invalid: errors.length,
        errors 
      });
      setStep("result");
      
      if (imported > 0) {
        toast({
          title: isPt ? "Importação concluída" : "Import complete",
          description: `${imported} ${isPt ? "registros importados" : "records imported"}`,
        });
        onImportComplete();
      } else if (errors.length > 0) {
        toast({
          title: isPt ? "Importação com erros" : "Import had errors",
          description: `${errors.length} ${isPt ? "erros encontrados" : "errors found"}`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Import error:", error);
      devLog("Import fatal error", error);
      toast({
        title: isPt ? "Erro na importação" : "Import error",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
      setImportResult({ imported, skipped, invalid: errors.length + rows.length, errors });
      setStep("result");
    } finally {
      setIsLoading(false);
    }
  };

  const downloadErrorsCSV = () => {
    if (!importResult?.errors.length) return;
    
    const csvRows = [
      ["Row", "Error", ...headers].join(","),
      ...importResult.errors.map(err => 
        [
          err.rowIndex + 2, // +2 for 1-indexed and header row
          `"${err.error}"`,
          ...headers.map(h => `"${String(err.rowData[h] || "")}"`)
        ].join(",")
      )
    ];
    
    const csv = csvRows.join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `import_errors_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClose = () => {
    setOpen(false);
    setTimeout(resetState, 300);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setTimeout(resetState, 300); }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-9 gap-2">
          <FileSpreadsheet className="w-4 h-4" />
          {isPt ? "Importar Planilha" : "Import Spreadsheet"}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-primary" />
            {isPt ? "Importar Dados" : "Import Data"}
          </DialogTitle>
          <DialogDescription>
            {isPt ? "Importe dados de arquivos CSV ou Excel" : "Import data from CSV or Excel files"}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-4 text-xs text-muted-foreground">
            {(["upload", "preview", "mapping", "confirm", "result"] as const).map((s, i) => (
              <div key={s} className="flex items-center gap-1">
                <div className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-medium",
                  step === s || (step === "importing" && s === "confirm") ? "bg-primary text-primary-foreground" : 
                  (["upload", "preview", "mapping", "confirm", "importing", "result"] as const).indexOf(step) > i ? "bg-primary/20 text-primary" : "bg-muted"
                )}>
                  {i + 1}
                </div>
                {i < 4 && <div className="w-4 h-px bg-border" />}
              </div>
            ))}
          </div>

          {/* Upload Step */}
          {step === "upload" && (
            <div className="flex-1 flex flex-col items-center justify-center p-8">
              <div 
                className={cn(
                  "border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors w-full max-w-md",
                  "hover:border-primary hover:bg-primary/5"
                )}
                onClick={() => fileInputRef.current?.click()}
              >
                {isLoading ? (
                  <Loader2 className="w-10 h-10 mx-auto mb-4 animate-spin text-primary" />
                ) : (
                  <Upload className="w-10 h-10 mx-auto mb-4 text-muted-foreground" />
                )}
                <p className="text-sm font-medium mb-1">
                  {isPt ? "Arraste ou clique para selecionar" : "Drag or click to select"}
                </p>
                <p className="text-xs text-muted-foreground">
                  CSV, XLSX, XLS
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          )}

          {/* Preview Step */}
          {step === "preview" && (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{fileName}</Badge>
                  <span className="text-xs text-muted-foreground">
                    {rows.length} {isPt ? "linhas" : "rows"}
                  </span>
                </div>
                <Button variant="ghost" size="sm" onClick={resetState}>
                  <X className="w-4 h-4 mr-1" />
                  {isPt ? "Limpar" : "Clear"}
                </Button>
              </div>
              
              <ScrollArea className="flex-1 border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {headers.map((h, i) => (
                        <TableHead key={i} className="whitespace-nowrap text-xs">{h}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previewRows.map((row, i) => (
                      <TableRow key={i}>
                        {headers.map((h, j) => (
                          <TableCell key={j} className="text-xs whitespace-nowrap max-w-[200px] truncate">
                            {String(row[h] || "")}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
              
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={resetState}>
                  {isPt ? "Cancelar" : "Cancel"}
                </Button>
                <Button onClick={proceedToMapping}>
                  {isPt ? "Continuar" : "Continue"}
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}

          {/* Mapping Step */}
          {step === "mapping" && (
            <div className="flex-1 flex flex-col overflow-hidden">
              <p className="text-sm text-muted-foreground mb-4">
                {isPt 
                  ? "Mapeie as colunas do seu arquivo para os campos do sistema:"
                  : "Map your file columns to system fields:"}
              </p>
              
              <div className="grid gap-4 mb-4">
                {SYSTEM_FIELDS.map((field) => (
                  <div key={field.key} className="flex items-center gap-4">
                    <div className="w-40 text-sm">
                      {field.label}
                      {field.required && <span className="text-destructive ml-1">*</span>}
                    </div>
                    <Select
                      value={mapping[field.key as keyof ColumnMapping] || "__none__"}
                      onValueChange={(v) => handleMappingChange(field.key as keyof ColumnMapping, v)}
                    >
                      <SelectTrigger className="w-64">
                        <SelectValue placeholder={isPt ? "Selecionar coluna" : "Select column"} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">{isPt ? "(Não mapear)" : "(Don't map)"}</SelectItem>
                        {headers.map((h) => (
                          <SelectItem key={h} value={h}>{h}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>

              {/* Live validation preview */}
              {mapping.date && mapping.amount && (
                <div className="p-3 rounded-lg bg-muted/50 mb-4">
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-primary" />
                      <span>{validationStats.validCount} {isPt ? "válidas" : "valid"}</span>
                    </div>
                    {validationStats.invalidCount > 0 && (
                      <div className="flex items-center gap-2 text-destructive">
                        <AlertCircle className="w-4 h-4" />
                        <span>{validationStats.invalidCount} {isPt ? "inválidas" : "invalid"}</span>
                      </div>
                    )}
                    {validationStats.totalErrors.amount > 0 && (
                      <span className="text-xs text-muted-foreground">
                        ({validationStats.totalErrors.amount} {isPt ? "erros de valor" : "amount errors"})
                      </span>
                    )}
                    {validationStats.totalErrors.date > 0 && (
                      <span className="text-xs text-muted-foreground">
                        ({validationStats.totalErrors.date} {isPt ? "erros de data" : "date errors"})
                      </span>
                    )}
                  </div>
                </div>
              )}

              <div className="flex justify-between mt-auto pt-4">
                <Button variant="outline" onClick={() => setStep("preview")}>
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  {isPt ? "Voltar" : "Back"}
                </Button>
                <Button 
                  onClick={proceedToConfirm}
                  disabled={!mapping.date || !mapping.amount || validationStats.validCount === 0}
                >
                  {isPt ? "Validar" : "Validate"}
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}

          {/* Confirm Step */}
          {step === "confirm" && (
            <div className="flex-1 flex flex-col">
              <div className="space-y-4 mb-4">
                <div className="p-4 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2 mb-2">
                    <Check className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">
                      {validationStats.validCount} {isPt ? "linhas válidas prontas para importar" : "valid rows ready to import"}
                    </span>
                  </div>
                  {validationStats.invalidCount > 0 && (
                    <div className="flex items-center gap-2 text-destructive">
                      <AlertCircle className="w-4 h-4" />
                      <span className="text-sm">
                        {validationStats.invalidCount} {isPt ? "linhas inválidas (serão ignoradas)" : "invalid rows (will be skipped)"}
                      </span>
                    </div>
                  )}
                </div>

                {/* Show sample of errors */}
                {validationStats.invalidCount > 0 && (
                  <ScrollArea className="h-32 border rounded-lg p-3">
                    <div className="text-xs space-y-1">
                      {validationStats.validations
                        .filter(v => !v.isValid)
                        .slice(0, 10)
                        .map((v, i) => (
                          <div key={i} className="flex items-center gap-2 text-destructive">
                            <span className="font-mono">Row {v.rowIndex + 2}:</span>
                            {v.amountError && <Badge variant="destructive" className="text-[10px]">{v.amountError}</Badge>}
                            {v.dateError && <Badge variant="destructive" className="text-[10px]">{v.dateError}</Badge>}
                          </div>
                        ))}
                      {validationStats.invalidCount > 10 && (
                        <p className="text-muted-foreground">
                          ... {isPt ? "e mais" : "and"} {validationStats.invalidCount - 10} {isPt ? "outras" : "more"}
                        </p>
                      )}
                    </div>
                  </ScrollArea>
                )}

                <p className="text-sm text-muted-foreground">
                  {isPt 
                    ? `Os dados serão importados para o ano ${selectedYear}. Duplicatas serão ignoradas automaticamente.`
                    : `Data will be imported for year ${selectedYear}. Duplicates will be skipped automatically.`}
                </p>
              </div>

              <div className="flex justify-between mt-auto pt-4">
                <Button variant="outline" onClick={() => setStep("mapping")}>
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  {isPt ? "Voltar" : "Back"}
                </Button>
                <Button 
                  onClick={handleImport} 
                  disabled={isLoading || validationStats.validCount === 0}
                >
                  {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {isPt ? "Importar" : "Import"} ({validationStats.validCount})
                </Button>
              </div>
            </div>
          )}

          {/* Importing Step (Progress) */}
          {step === "importing" && (
            <div className="flex-1 flex flex-col items-center justify-center p-8">
              <Loader2 className="w-12 h-12 animate-spin text-primary mb-6" />
              <h3 className="text-lg font-medium mb-2">
                {isPt ? "Importando..." : "Importing..."}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {importProgress.current} / {importProgress.total} {isPt ? "registros processados" : "records processed"}
              </p>
              <Progress 
                value={(importProgress.current / Math.max(importProgress.total, 1)) * 100} 
                className="w-64"
              />
            </div>
          )}

          {/* Result Step */}
          {step === "result" && importResult && (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <div className={cn(
                "w-16 h-16 rounded-full flex items-center justify-center mb-4",
                importResult.imported > 0 ? "bg-primary/10" : "bg-destructive/10"
              )}>
                {importResult.imported > 0 ? (
                  <Check className="w-8 h-8 text-primary" />
                ) : (
                  <AlertCircle className="w-8 h-8 text-destructive" />
                )}
              </div>
              <h3 className="text-lg font-medium mb-4">
                {importResult.imported > 0 
                  ? (isPt ? "Importação Concluída" : "Import Complete")
                  : (isPt ? "Importação Falhou" : "Import Failed")}
              </h3>
              <div className="space-y-2 text-sm">
                {importResult.imported > 0 && (
                  <p className="text-primary font-medium">
                    {importResult.imported} {isPt ? "registros importados" : "records imported"}
                  </p>
                )}
                {importResult.skipped > 0 && (
                  <p className="text-muted-foreground">
                    {importResult.skipped} {isPt ? "duplicatas/ignoradas" : "duplicates/skipped"}
                  </p>
                )}
                {importResult.invalid > 0 && (
                  <p className="text-destructive">
                    {importResult.invalid} {isPt ? "erros" : "errors"}
                  </p>
                )}
              </div>
              
              <div className="flex gap-2 mt-6">
                {importResult.errors.length > 0 && (
                  <Button variant="outline" onClick={downloadErrorsCSV}>
                    <Download className="w-4 h-4 mr-2" />
                    {isPt ? "Baixar erros" : "Download errors"}
                  </Button>
                )}
                <Button onClick={handleClose}>
                  {isPt ? "Fechar" : "Close"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
