import { useState, useRef, useMemo } from "react";
import { FileSpreadsheet, Upload, X, Loader2, Check, AlertCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { useAppSettings } from "@/contexts/AppSettingsContext";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import * as XLSX from "xlsx";

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

type ImportStep = "upload" | "preview" | "mapping" | "confirm" | "result";

const SYSTEM_FIELDS = [
  { key: "date", label: "Date", required: true },
  { key: "amount", label: "Amount", required: true },
  { key: "description", label: "Description", required: true },
  { key: "category", label: "Category", required: false },
  { key: "counterparty", label: "Counterparty/Vendor", required: false },
  { key: "type", label: "Type (income/expense)", required: false },
];

export function DataImport({ sources, categories, selectedYear, onImportComplete }: DataImportProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<ImportStep>("upload");
  const [isLoading, setIsLoading] = useState(false);
  const [fileName, setFileName] = useState("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [mapping, setMapping] = useState<Partial<ColumnMapping>>({});
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [importResult, setImportResult] = useState<{
    imported: number;
    skipped: number;
    invalid: number;
  } | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { t, language } = useAppSettings();
  const isPt = language === 'pt-BR';

  const resetState = () => {
    setStep("upload");
    setFileName("");
    setHeaders([]);
    setRows([]);
    setMapping({});
    setValidationErrors([]);
    setImportResult(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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
          
          if (lines.length < 2) {
            reject(new Error("File must have at least a header row and one data row"));
            return;
          }

          // Detect delimiter (comma, semicolon, or tab)
          const firstLine = lines[0];
          const delimiter = firstLine.includes(";") ? ";" : firstLine.includes("\t") ? "\t" : ",";
          
          const headerLine = lines[0].split(delimiter).map(h => h.trim().replace(/^["']|["']$/g, ""));
          setHeaders(headerLine);

          const dataRows: ParsedRow[] = [];
          for (let i = 1; i < Math.min(lines.length, 101); i++) {
            const values = lines[i].split(delimiter).map(v => v.trim().replace(/^["']|["']$/g, ""));
            const row: ParsedRow = {};
            headerLine.forEach((header, idx) => {
              row[header] = values[idx] || "";
            });
            dataRows.push(row);
          }
          setRows(dataRows);
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

    if (jsonData.length < 2) {
      throw new Error("File must have at least a header row and one data row");
    }

    const headerRow = (jsonData[0]).map(h => String(h || "").trim());
    setHeaders(headerRow);

    const dataRows: ParsedRow[] = [];
    for (let i = 1; i < Math.min(jsonData.length, 101); i++) {
      const values = jsonData[i];
      const row: ParsedRow = {};
      headerRow.forEach((header, idx) => {
        row[header] = values?.[idx] ?? "";
      });
      dataRows.push(row);
    }
    setRows(dataRows);
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

    setMapping(detected);
  };

  const validateRows = (): { valid: ParsedRow[]; invalid: number; errors: string[] } => {
    const valid: ParsedRow[] = [];
    let invalid = 0;
    const errors: string[] = [];

    rows.forEach((row, idx) => {
      const dateVal = mapping.date ? row[mapping.date] : null;
      const amountVal = mapping.amount ? row[mapping.amount] : null;

      if (!dateVal || dateVal === "") {
        invalid++;
        if (errors.length < 5) errors.push(`Row ${idx + 2}: Missing date`);
        return;
      }

      if (amountVal === null || amountVal === "" || isNaN(Number(String(amountVal).replace(/[^0-9.-]/g, "")))) {
        invalid++;
        if (errors.length < 5) errors.push(`Row ${idx + 2}: Invalid amount`);
        return;
      }

      valid.push(row);
    });

    return { valid, invalid, errors };
  };

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
    const { errors } = validateRows();
    setValidationErrors(errors);
    setStep("confirm");
  };

  const handleImport = async () => {
    setIsLoading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Not authenticated");

      const { valid, invalid } = validateRows();
      let imported = 0;
      let skipped = 0;

      // Get existing entries for fingerprint checking
      const { data: existingEntries } = await supabase
        .from("financial_entries")
        .select("notes, amount, month, year")
        .eq("user_id", userData.user.id)
        .eq("year", selectedYear);

      const existingFingerprints = new Set(
        (existingEntries || []).map(e => `${e.amount}-${e.month}-${e.notes || ""}`.toLowerCase())
      );

      for (const row of valid) {
        const dateStr = String(row[mapping.date!] || "");
        const amountRaw = String(row[mapping.amount!] || "0").replace(/[^0-9.-]/g, "");
        const amount = parseFloat(amountRaw);
        const description = mapping.description ? String(row[mapping.description] || "") : "";

        // Parse date
        let parsedDate: Date | null = null;
        try {
          // Try common formats
          if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
            parsedDate = new Date(dateStr);
          } else if (/^\d{2}\/\d{2}\/\d{4}/.test(dateStr)) {
            const [day, month, year] = dateStr.split("/");
            parsedDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
          } else if (/^\d{2}-\d{2}-\d{4}/.test(dateStr)) {
            const [day, month, year] = dateStr.split("-");
            parsedDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
          } else {
            parsedDate = new Date(dateStr);
          }
        } catch {
          continue;
        }

        if (!parsedDate || isNaN(parsedDate.getTime())) continue;
        
        const month = parsedDate.getMonth() + 1;
        const year = parsedDate.getFullYear();

        if (year !== selectedYear) continue;

        // Check for duplicates
        const fingerprint = `${Math.abs(amount)}-${month}-${description}`.toLowerCase();
        if (existingFingerprints.has(fingerprint)) {
          skipped++;
          continue;
        }

        // Determine if income or expense
        const isIncome = amount >= 0 || 
          (mapping.type && String(row[mapping.type] || "").toLowerCase().match(/income|receita|entrada/));

        // Find or create source/category
        let sourceId: string | null = null;
        let categoryId: string | null = null;

        if (isIncome) {
          // Use first source or skip
          sourceId = sources[0]?.id || null;
        } else {
          // Use first expense category or skip
          const expenseCat = categories.find(c => c.type === "expense");
          categoryId = expenseCat?.id || null;
        }

        if (!sourceId && !categoryId) {
          skipped++;
          continue;
        }

        const { error } = await supabase.from("financial_entries").insert({
          user_id: userData.user.id,
          source_id: sourceId,
          category_id: categoryId,
          amount: Math.abs(amount),
          month,
          year,
          notes: description,
        });

        if (!error) {
          imported++;
          existingFingerprints.add(fingerprint);
        }
      }

      setImportResult({ imported, skipped, invalid });
      setStep("result");

      if (imported > 0) {
        onImportComplete();
      }
    } catch (error) {
      console.error("Import error:", error);
      toast({
        title: isPt ? "Erro na importação" : "Import error",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
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
            {["upload", "preview", "mapping", "confirm", "result"].map((s, i) => (
              <div key={s} className="flex items-center gap-1">
                <div className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-medium",
                  step === s ? "bg-primary text-primary-foreground" : 
                  ["upload", "preview", "mapping", "confirm", "result"].indexOf(step) > i ? "bg-primary/20 text-primary" : "bg-muted"
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

              <div className="flex justify-between mt-auto pt-4">
                <Button variant="outline" onClick={() => setStep("preview")}>
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  {isPt ? "Voltar" : "Back"}
                </Button>
                <Button 
                  onClick={proceedToConfirm}
                  disabled={!mapping.date || !mapping.amount}
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
                      {validateRows().valid.length} {isPt ? "linhas válidas" : "valid rows"}
                    </span>
                  </div>
                  {validateRows().invalid > 0 && (
                    <div className="flex items-center gap-2 text-destructive">
                      <AlertCircle className="w-4 h-4" />
                      <span className="text-sm">
                        {validateRows().invalid} {isPt ? "linhas inválidas (serão ignoradas)" : "invalid rows (will be skipped)"}
                      </span>
                    </div>
                  )}
                </div>

                {validationErrors.length > 0 && (
                  <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-xs space-y-1">
                    {validationErrors.map((err, i) => (
                      <p key={i}>{err}</p>
                    ))}
                    {validationErrors.length >= 5 && (
                      <p className="opacity-70">...</p>
                    )}
                  </div>
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
                <Button onClick={handleImport} disabled={isLoading || validateRows().valid.length === 0}>
                  {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {isPt ? "Importar" : "Import"}
                </Button>
              </div>
            </div>
          )}

          {/* Result Step */}
          {step === "result" && importResult && (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Check className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-medium mb-4">
                {isPt ? "Importação Concluída" : "Import Complete"}
              </h3>
              <div className="space-y-2 text-sm">
                <p className="text-primary font-medium">
                  {importResult.imported} {isPt ? "registros importados" : "records imported"}
                </p>
                {importResult.skipped > 0 && (
                  <p className="text-muted-foreground">
                    {importResult.skipped} {isPt ? "duplicatas ignoradas" : "duplicates skipped"}
                  </p>
                )}
                {importResult.invalid > 0 && (
                  <p className="text-muted-foreground">
                    {importResult.invalid} {isPt ? "linhas inválidas" : "invalid rows"}
                  </p>
                )}
              </div>
              <Button onClick={handleClose} className="mt-6">
                {isPt ? "Fechar" : "Close"}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
