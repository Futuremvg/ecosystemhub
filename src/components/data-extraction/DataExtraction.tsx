import { useState, useRef, useMemo, useCallback } from "react";
import { 
  FileSpreadsheet, Upload, X, Loader2, Check, AlertCircle, 
  ChevronDown, Download, Users, Briefcase, DollarSign, Receipt,
  Building2, UserPlus, Wallet, TrendingUp, Wand2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAppSettings } from "@/contexts/AppSettingsContext";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { parseMoney, parseDate } from "@/lib/parseMoney";
import * as XLSX from "xlsx";

// Dev logging
const isDev = typeof window !== 'undefined' && window.location.hostname === 'localhost';
function devLog(step: string, data?: unknown) {
  if (isDev) console.log(`[DataExtraction] ${step}`, data ?? '');
}

// Dataset definitions with header patterns and field mappings
const DATASET_TYPES = {
  employees: {
    label: "Employees / Funcionários",
    icon: Users,
    headerPatterns: ["name", "nome", "employee", "funcionário", "role", "cargo", "wage", "salário", "salary", "hours", "horas"],
    requiredFields: ["name"],
    optionalFields: ["role", "email", "phone", "hourly_rate"],
    table: "company_employees",
  },
  vendors: {
    label: "Vendors / Fornecedores",
    icon: Briefcase,
    headerPatterns: ["vendor", "fornecedor", "supplier", "company", "empresa", "service", "serviço", "contact"],
    requiredFields: ["name"],
    optionalFields: ["category", "contact_name", "email", "phone", "address", "notes"],
    table: "company_providers",
  },
  clients: {
    label: "Clients / Clientes",
    icon: UserPlus,
    headerPatterns: ["client", "cliente", "customer", "address", "endereço", "project", "projeto"],
    requiredFields: ["name"],
    optionalFields: ["company_name", "email", "phone", "address", "notes"],
    table: "company_clients",
  },
  accounts: {
    label: "Accounts / Contas",
    icon: Wallet,
    headerPatterns: ["account", "conta", "bank", "banco", "balance", "saldo"],
    requiredFields: ["name"],
    optionalFields: ["account_type", "description", "has_tax"],
    table: "company_accounts",
  },
  income: {
    label: "Income / Receitas",
    icon: TrendingUp,
    headerPatterns: ["income", "receita", "revenue", "invoice", "fatura", "amount", "valor"],
    requiredFields: ["amount", "date"],
    optionalFields: ["description", "category", "counterparty"],
    table: "financial_entries",
  },
  expenses: {
    label: "Expenses / Despesas",
    icon: Receipt,
    headerPatterns: ["expense", "despesa", "cost", "custo", "vendor", "amount", "valor"],
    requiredFields: ["amount", "date"],
    optionalFields: ["description", "category", "counterparty"],
    table: "financial_entries",
  },
  income_types: {
    label: "Income Types / Tipos de Receita",
    icon: DollarSign,
    headerPatterns: ["income type", "tipo de receita", "source", "fonte"],
    requiredFields: ["name"],
    optionalFields: ["description"],
    table: "income_types",
  },
  leads: {
    label: "Leads / CRM",
    icon: Building2,
    headerPatterns: ["lead", "prospect", "opportunity", "oportunidade", "status"],
    requiredFields: ["name"],
    optionalFields: ["email", "phone", "company_name", "notes"],
    table: "company_clients", // Store leads as clients with notes
  },
} as const;

type DatasetType = keyof typeof DATASET_TYPES;

// Field mapping definitions per dataset
const FIELD_MAPPINGS: Record<DatasetType, { key: string; label: string; required: boolean; patterns: string[] }[]> = {
  employees: [
    { key: "name", label: "Name", required: true, patterns: ["name", "nome", "employee", "funcionário", "full name", "nome completo"] },
    { key: "role", label: "Role", required: false, patterns: ["role", "cargo", "position", "posição", "job title", "título"] },
    { key: "email", label: "Email", required: false, patterns: ["email", "e-mail", "mail"] },
    { key: "phone", label: "Phone", required: false, patterns: ["phone", "telefone", "tel", "celular", "mobile"] },
    { key: "hourly_rate", label: "Hourly Rate", required: false, patterns: ["rate", "hourly", "wage", "salário", "salary", "valor hora"] },
  ],
  vendors: [
    { key: "name", label: "Name", required: true, patterns: ["vendor", "fornecedor", "supplier", "name", "nome", "company", "empresa"] },
    { key: "category", label: "Category", required: false, patterns: ["category", "categoria", "type", "tipo", "service", "serviço"] },
    { key: "contact_name", label: "Contact", required: false, patterns: ["contact", "contato", "responsável"] },
    { key: "email", label: "Email", required: false, patterns: ["email", "e-mail"] },
    { key: "phone", label: "Phone", required: false, patterns: ["phone", "telefone", "tel"] },
    { key: "address", label: "Address", required: false, patterns: ["address", "endereço", "location", "local"] },
    { key: "notes", label: "Notes", required: false, patterns: ["notes", "notas", "observação", "obs"] },
  ],
  clients: [
    { key: "name", label: "Name", required: true, patterns: ["client", "cliente", "customer", "name", "nome"] },
    { key: "company_name", label: "Company", required: false, patterns: ["company", "empresa", "organization", "organização"] },
    { key: "email", label: "Email", required: false, patterns: ["email", "e-mail"] },
    { key: "phone", label: "Phone", required: false, patterns: ["phone", "telefone", "tel"] },
    { key: "address", label: "Address", required: false, patterns: ["address", "endereço"] },
    { key: "notes", label: "Notes", required: false, patterns: ["notes", "notas", "project", "projeto"] },
  ],
  accounts: [
    { key: "name", label: "Account Name", required: true, patterns: ["account", "conta", "name", "nome", "bank", "banco"] },
    { key: "account_type", label: "Type", required: false, patterns: ["type", "tipo", "category", "categoria"] },
    { key: "description", label: "Description", required: false, patterns: ["description", "descrição", "notes"] },
    { key: "has_tax", label: "Has Tax", required: false, patterns: ["tax", "imposto", "taxable"] },
  ],
  income: [
    { key: "amount", label: "Amount", required: true, patterns: ["amount", "valor", "value", "total", "price", "preço"] },
    { key: "date", label: "Date", required: true, patterns: ["date", "data", "fecha", "transaction_date"] },
    { key: "description", label: "Description", required: false, patterns: ["description", "descrição", "memo", "notes"] },
    { key: "category", label: "Category", required: false, patterns: ["category", "categoria", "type", "tipo"] },
    { key: "counterparty", label: "Client/Source", required: false, patterns: ["client", "cliente", "source", "origem", "from", "de"] },
  ],
  expenses: [
    { key: "amount", label: "Amount", required: true, patterns: ["amount", "valor", "value", "total", "cost", "custo"] },
    { key: "date", label: "Date", required: true, patterns: ["date", "data", "fecha", "transaction_date"] },
    { key: "description", label: "Description", required: false, patterns: ["description", "descrição", "memo", "notes"] },
    { key: "category", label: "Category", required: false, patterns: ["category", "categoria", "type", "tipo"] },
    { key: "counterparty", label: "Vendor", required: false, patterns: ["vendor", "fornecedor", "supplier", "to", "para"] },
  ],
  income_types: [
    { key: "name", label: "Name", required: true, patterns: ["name", "nome", "type", "tipo", "source", "fonte"] },
    { key: "description", label: "Description", required: false, patterns: ["description", "descrição", "notes"] },
  ],
  leads: [
    { key: "name", label: "Name", required: true, patterns: ["name", "nome", "lead", "prospect", "contact", "contato"] },
    { key: "email", label: "Email", required: false, patterns: ["email", "e-mail"] },
    { key: "phone", label: "Phone", required: false, patterns: ["phone", "telefone", "tel"] },
    { key: "company_name", label: "Company", required: false, patterns: ["company", "empresa"] },
    { key: "notes", label: "Status/Notes", required: false, patterns: ["status", "notes", "notas", "stage", "etapa"] },
  ],
};

interface DataExtractionProps {
  companyId?: string | null;
  companyName?: string;
  onImportComplete?: () => void;
  triggerButton?: React.ReactNode;
}

type ParsedRow = Record<string, string | number>;
type ImportStep = "upload" | "sheet-select" | "dataset-select" | "mapping" | "preview" | "importing" | "result";

interface ImportError {
  rowIndex: number;
  error: string;
  rowData: ParsedRow;
}

const BATCH_SIZE = 50;

export function DataExtraction({ 
  companyId, 
  companyName,
  onImportComplete,
  triggerButton
}: DataExtractionProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<ImportStep>("upload");
  const [isLoading, setIsLoading] = useState(false);
  const [fileName, setFileName] = useState("");
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState("");
  const [workbook, setWorkbook] = useState<XLSX.WorkBook | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [detectedDataset, setDetectedDataset] = useState<DatasetType>("employees");
  const [selectedDataset, setSelectedDataset] = useState<DatasetType>("employees");
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });
  const [importResult, setImportResult] = useState<{
    imported: number;
    skipped: number;
    invalid: number;
    errors: ImportError[];
  } | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { language } = useAppSettings();
  const isPt = language === 'pt-BR';

  const resetState = useCallback(() => {
    setStep("upload");
    setFileName("");
    setSheetNames([]);
    setSelectedSheet("");
    setWorkbook(null);
    setHeaders([]);
    setRows([]);
    setDetectedDataset("employees");
    setSelectedDataset("employees");
    setMapping({});
    setImportProgress({ current: 0, total: 0 });
    setImportResult(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    devLog("File selected", { name: file.name, size: file.size });
    setIsLoading(true);
    setFileName(file.name);

    try {
      const extension = file.name.split(".").pop()?.toLowerCase();
      
      if (extension === "csv") {
        await parseCSV(file);
        setStep("dataset-select");
      } else if (extension === "xlsx" || extension === "xls") {
        const result = await parseXLSX(file);
        // If multiple sheets, show sheet selection
        if (result.sheetCount > 1) {
          setStep("sheet-select");
        } else {
          setStep("dataset-select");
        }
      } else {
        throw new Error(isPt ? "Formato não suportado. Use CSV ou XLSX." : "Unsupported format. Use CSV or XLSX.");
      }
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

  /**
   * Smart header detection: scans the first N rows to find the one that
   * looks most like a header row (most non-empty, non-numeric unique cells).
   */
  const findHeaderRowIndex = (allRows: (string | number)[][]): number => {
    const maxScan = Math.min(allRows.length, 10);
    let bestIndex = 0;
    let bestScore = 0;

    for (let i = 0; i < maxScan; i++) {
      const row = allRows[i];
      if (!row || row.length === 0) continue;

      const cells = row.map(c => String(c ?? "").trim()).filter(c => c !== "");
      if (cells.length === 0) continue;

      // Score: number of non-empty cells that look like text (not purely numeric)
      const textCells = cells.filter(c => isNaN(Number(c)));
      const uniqueCells = new Set(cells);
      // Prefer rows with more text cells + more unique values + at least 2 columns
      const score = textCells.length * 2 + uniqueCells.size + (cells.length >= 2 ? 5 : 0);

      devLog(`Header scan row ${i}`, { cells: cells.slice(0, 5), score });

      if (score > bestScore) {
        bestScore = score;
        bestIndex = i;
      }
    }

    devLog("Best header row", { index: bestIndex, score: bestScore });
    return bestIndex;
  };

  const parseCSV = (file: File): Promise<void> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const text = event.target?.result as string;
          const lines = text.split(/\r?\n/).filter(line => line.trim());
          
          if (lines.length < 2) {
            reject(new Error(isPt ? "Arquivo precisa ter pelo menos uma linha de cabeçalho e uma linha de dados" : "File must have header and data rows"));
            return;
          }

          const delimiter = lines[0].includes(";") ? ";" : lines[0].includes("\t") ? "\t" : ",";
          
          // Parse all lines into arrays for header detection
          const allParsed = lines.map(line => 
            line.split(delimiter).map(v => v.trim().replace(/^["']|["']$/g, ""))
          );

          const headerIdx = findHeaderRowIndex(allParsed);
          const headerLine = allParsed[headerIdx].filter(h => h !== "");

          if (headerLine.length === 0) {
            reject(new Error(isPt ? "Nenhum cabeçalho encontrado no arquivo" : "No headers found in file"));
            return;
          }

          setHeaders(headerLine);
          
          const dataRows: ParsedRow[] = [];
          for (let i = headerIdx + 1; i < Math.min(allParsed.length, headerIdx + 1001); i++) {
            const values = allParsed[i];
            const row: ParsedRow = {};
            headerLine.forEach((header, idx) => {
              row[header] = values[idx] || "";
            });
            // Skip completely empty rows
            if (Object.values(row).some(v => String(v).trim() !== "")) {
              dataRows.push(row);
            }
          }
          setRows(dataRows);
          autoDetectDataset(headerLine);
          
          devLog("CSV parsed", { headerIdx, headers: headerLine, rowCount: dataRows.length });
          resolve();
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsText(file);
    });
  };

  const parseXLSX = async (file: File): Promise<{ sheetCount: number }> => {
    const arrayBuffer = await file.arrayBuffer();
    const wb = XLSX.read(arrayBuffer, { type: "array" });
    setWorkbook(wb);
    setSheetNames(wb.SheetNames);
    
    if (wb.SheetNames.length > 0) {
      setSelectedSheet(wb.SheetNames[0]);
      loadSheetData(wb, wb.SheetNames[0]);
    }
    
    devLog("XLSX parsed", { sheets: wb.SheetNames });
    return { sheetCount: wb.SheetNames.length };
  };

  const loadSheetData = (wb: XLSX.WorkBook, sheetName: string) => {
    const worksheet = wb.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json<(string | number)[]>(worksheet, { header: 1 });

    devLog("Raw sheet data", { 
      sheetName, 
      totalRows: jsonData.length, 
      firstRows: jsonData.slice(0, 5).map(r => (r || []).slice(0, 5))
    });

    if (jsonData.length < 2) {
      toast({
        title: isPt ? "Planilha vazia" : "Empty sheet",
        variant: "destructive",
      });
      return;
    }

    // Smart header detection - find the actual header row
    const headerIdx = findHeaderRowIndex(jsonData);
    const headerRow = (jsonData[headerIdx] || []).map(h => String(h ?? "").trim()).filter(h => h !== "");

    devLog("Detected headers", { headerIdx, headers: headerRow });

    if (headerRow.length === 0) {
      toast({
        title: isPt ? "Nenhum cabeçalho encontrado" : "No headers found",
        description: isPt 
          ? "Verifique se a planilha tem uma linha de cabeçalho com nomes de colunas"
          : "Make sure the spreadsheet has a header row with column names",
        variant: "destructive",
      });
      return;
    }

    setHeaders(headerRow);

    const dataRows: ParsedRow[] = [];
    for (let i = headerIdx + 1; i < Math.min(jsonData.length, headerIdx + 1001); i++) {
      const values = jsonData[i];
      if (!values || values.length === 0) continue;
      const row: ParsedRow = {};
      headerRow.forEach((header, idx) => {
        row[header] = values?.[idx] ?? "";
      });
      // Skip completely empty rows
      if (Object.values(row).some(v => String(v).trim() !== "")) {
        dataRows.push(row);
      }
    }
    setRows(dataRows);
    autoDetectDataset(headerRow);
  };

  const autoDetectDataset = (cols: string[]) => {
    const colsLower = cols.filter(Boolean).map(c => (c || "").toLowerCase());
    let maxScore = 0;
    let detected: DatasetType = "employees";

    for (const [key, config] of Object.entries(DATASET_TYPES)) {
      const score = config.headerPatterns.filter(pattern => 
        colsLower.some(col => col.includes(pattern))
      ).length;
      
      if (score > maxScore) {
        maxScore = score;
        detected = key as DatasetType;
      }
    }

    devLog("Auto-detected dataset", { detected, score: maxScore });
    setDetectedDataset(detected);
    setSelectedDataset(detected);
    autoDetectMapping(cols, detected);
  };

  const autoDetectMapping = (cols: string[], dataset: DatasetType) => {
    const fields = FIELD_MAPPINGS[dataset];
    const detected: Record<string, string> = {};

    fields.forEach(field => {
      for (const col of cols) {
        if (!col) continue;
        const colLower = (col || "").toLowerCase();
        if (field.patterns.some(p => colLower.includes(p))) {
          detected[field.key] = col;
          break;
        }
      }
    });

    devLog("Auto-detected mapping", detected);
    setMapping(detected);
  };

  // Re-run auto-detect mapping for current dataset
  const handleAutoMapAll = () => {
    autoDetectMapping(headers, selectedDataset);
    toast({
      title: isPt ? "Mapeamento automático aplicado" : "Auto-mapping applied",
      description: isPt 
        ? "Campos foram mapeados automaticamente com base nos padrões detectados" 
        : "Fields were automatically mapped based on detected patterns",
    });
  };

  // Clear all mappings
  const handleClearMapping = () => {
    setMapping({});
    toast({
      title: isPt ? "Mapeamento limpo" : "Mapping cleared",
    });
  };

  const handleSheetSelect = (sheetName: string) => {
    setSelectedSheet(sheetName);
    if (workbook) {
      loadSheetData(workbook, sheetName);
    }
    setStep("dataset-select");
  };

  const handleDatasetChange = (dataset: DatasetType) => {
    setSelectedDataset(dataset);
    autoDetectMapping(headers, dataset);
  };

  const handleMappingChange = (fieldKey: string, column: string) => {
    setMapping(prev => ({
      ...prev,
      [fieldKey]: column === "__none__" ? "" : column,
    }));
  };

  // Validate rows based on selected dataset
  const validationStats = useMemo(() => {
    const fields = FIELD_MAPPINGS[selectedDataset];
    const requiredFields = fields.filter(f => f.required).map(f => f.key);
    
    let validCount = 0;
    let invalidCount = 0;
    const errors: Record<string, number> = {};

    rows.forEach((row, idx) => {
      let isValid = true;
      
      for (const reqField of requiredFields) {
        const col = mapping[reqField];
        if (!col || !row[col] || String(row[col]).trim() === "") {
          isValid = false;
          errors[reqField] = (errors[reqField] || 0) + 1;
        }
        
        // Special validation for amount/date fields
        if (reqField === "amount" && col && row[col]) {
          const parsed = parseMoney(row[col]);
          if (parsed.value === null) {
            isValid = false;
            errors["amount_parse"] = (errors["amount_parse"] || 0) + 1;
          }
        }
        if (reqField === "date" && col && row[col]) {
          const parsed = parseDate(row[col]);
          if (!parsed) {
            isValid = false;
            errors["date_parse"] = (errors["date_parse"] || 0) + 1;
          }
        }
      }

      if (isValid) validCount++;
      else invalidCount++;
    });

    return { validCount, invalidCount, errors };
  }, [rows, mapping, selectedDataset]);

  const previewRows = useMemo(() => rows.slice(0, 20), [rows]);

  const handleImport = async () => {
    devLog("Starting import", { dataset: selectedDataset, rowCount: rows.length });
    setStep("importing");
    setIsLoading(true);
    
    const errors: ImportError[] = [];
    let imported = 0;
    let skipped = 0;
    
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Not authenticated");

      const total = rows.length;
      setImportProgress({ current: 0, total });

      // Process based on dataset type
      for (let batchStart = 0; batchStart < rows.length; batchStart += BATCH_SIZE) {
        const batch = rows.slice(batchStart, batchStart + BATCH_SIZE);
        
        for (const row of batch) {
          const rowIndex = rows.indexOf(row);
          
          try {
            const result = await processRow(row, rowIndex, userData.user.id);
            if (result.success) {
              imported++;
            } else if (result.skipped) {
              skipped++;
            } else {
              errors.push({ rowIndex, error: result.error || "Unknown error", rowData: row });
            }
          } catch (err) {
            errors.push({ 
              rowIndex, 
              error: err instanceof Error ? err.message : "Unknown error", 
              rowData: row 
            });
          }
        }
        
        setImportProgress({ current: batchStart + batch.length, total });
        await new Promise(resolve => setTimeout(resolve, 10));
      }
      
      setImportResult({ imported, skipped, invalid: errors.length, errors });
      setStep("result");
      
      if (imported > 0) {
        toast({
          title: isPt ? "Importação concluída" : "Import complete",
          description: `${imported} ${isPt ? "registros importados" : "records imported"}`,
        });
        onImportComplete?.();
      }
    } catch (error) {
      console.error("Import error:", error);
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

  const processRow = async (
    row: ParsedRow, 
    rowIndex: number, 
    userId: string
  ): Promise<{ success: boolean; skipped?: boolean; error?: string }> => {
    const getMappedValue = (key: string): string => {
      const col = mapping[key];
      if (!col) return "";
      return String(row[col] || "").trim();
    };

    const tableName = DATASET_TYPES[selectedDataset].table;

    switch (selectedDataset) {
      case "employees": {
        const name = getMappedValue("name");
        if (!name) return { success: false, error: "Missing name" };
        
        // Check for duplicates
        const { data: existing } = await supabase
          .from("company_employees")
          .select("id")
          .eq("user_id", userId)
          .eq("name", name)
          .maybeSingle();
        
        if (existing) return { success: false, skipped: true };
        
        const { error } = await supabase.from("company_employees").insert({
          user_id: userId,
          company_id: companyId || null,
          name,
          role: getMappedValue("role") || null,
          email: getMappedValue("email") || null,
          phone: getMappedValue("phone") || null,
          hourly_rate: getMappedValue("hourly_rate") ? parseFloat(getMappedValue("hourly_rate")) : null,
        });
        
        if (error) return { success: false, error: error.message };
        return { success: true };
      }
      
      case "vendors": {
        const name = getMappedValue("name");
        if (!name) return { success: false, error: "Missing name" };
        
        const { data: existing } = await supabase
          .from("company_providers")
          .select("id")
          .eq("user_id", userId)
          .eq("name", name)
          .maybeSingle();
        
        if (existing) return { success: false, skipped: true };
        
        const { error } = await supabase.from("company_providers").insert({
          user_id: userId,
          company_id: companyId || null,
          name,
          category: getMappedValue("category") || null,
          contact_name: getMappedValue("contact_name") || null,
          email: getMappedValue("email") || null,
          phone: getMappedValue("phone") || null,
          address: getMappedValue("address") || null,
          notes: getMappedValue("notes") || null,
        });
        
        if (error) return { success: false, error: error.message };
        return { success: true };
      }
      
      case "clients":
      case "leads": {
        const name = getMappedValue("name");
        if (!name) return { success: false, error: "Missing name" };
        
        const { data: existing } = await supabase
          .from("company_clients")
          .select("id")
          .eq("user_id", userId)
          .or(`name.eq.${name},email.eq.${getMappedValue("email") || "___none___"}`)
          .maybeSingle();
        
        if (existing) return { success: false, skipped: true };
        
        const { error } = await supabase.from("company_clients").insert({
          user_id: userId,
          company_id: companyId || null,
          name,
          company_name: getMappedValue("company_name") || null,
          email: getMappedValue("email") || null,
          phone: getMappedValue("phone") || null,
          address: getMappedValue("address") || null,
          notes: getMappedValue("notes") || null,
        });
        
        if (error) return { success: false, error: error.message };
        return { success: true };
      }
      
      case "accounts": {
        const name = getMappedValue("name");
        if (!name) return { success: false, error: "Missing name" };
        
        const { data: existing } = await supabase
          .from("company_accounts")
          .select("id")
          .eq("user_id", userId)
          .eq("name", name)
          .maybeSingle();
        
        if (existing) return { success: false, skipped: true };
        
        const { error } = await supabase.from("company_accounts").insert({
          user_id: userId,
          company_id: companyId || null,
          name,
          account_type: getMappedValue("account_type") || null,
          description: getMappedValue("description") || null,
          has_tax: getMappedValue("has_tax")?.toLowerCase() === "true" || getMappedValue("has_tax") === "1",
        });
        
        if (error) return { success: false, error: error.message };
        return { success: true };
      }
      
      case "income":
      case "expenses": {
        const amountRaw = getMappedValue("amount");
        const dateRaw = getMappedValue("date");
        
        if (!amountRaw || !dateRaw) return { success: false, error: "Missing amount or date" };
        
        const parsed = parseMoney(amountRaw);
        if (parsed.value === null) return { success: false, error: parsed.error || "Invalid amount" };
        
        const parsedDate = parseDate(dateRaw);
        if (!parsedDate) return { success: false, error: "Invalid date" };
        
        const month = parsedDate.getMonth() + 1;
        const year = parsedDate.getFullYear();
        const description = getMappedValue("description");
        
        // Fingerprint for dedup
        const fingerprint = `${Math.abs(parsed.value)}-${month}-${year}-${description.toLowerCase().trim()}`;
        
        const { data: existing } = await supabase
          .from("financial_entries")
          .select("id")
          .eq("user_id", userId)
          .eq("month", month)
          .eq("year", year)
          .eq("amount", Math.abs(parsed.value));
        
        // Simple dedup check
        if (existing && existing.length > 0) {
          return { success: false, skipped: true };
        }
        
        // For income, use source_id; for expenses, use category_id
        // For now, just insert with notes
        const { error } = await supabase.from("financial_entries").insert({
          user_id: userId,
          company_id: companyId || null,
          source_id: selectedDataset === "income" ? null : null, // Would need to match to actual sources
          category_id: selectedDataset === "expenses" ? null : null, // Would need to match to actual categories
          amount: Math.abs(parsed.value),
          month,
          year,
          notes: description || null,
        });
        
        if (error) return { success: false, error: error.message };
        return { success: true };
      }
      
      case "income_types": {
        const name = getMappedValue("name");
        if (!name) return { success: false, error: "Missing name" };
        
        const { data: existing } = await supabase
          .from("income_types")
          .select("id")
          .eq("user_id", userId)
          .eq("name", name)
          .maybeSingle();
        
        if (existing) return { success: false, skipped: true };
        
        const { error } = await supabase.from("income_types").insert({
          user_id: userId,
          company_id: companyId || null,
          name,
          description: getMappedValue("description") || null,
        });
        
        if (error) return { success: false, error: error.message };
        return { success: true };
      }
      
      default:
        return { success: false, error: "Unknown dataset type" };
    }
  };

  const downloadErrorsCSV = () => {
    if (!importResult?.errors.length) return;
    
    const csvRows = [
      ["Row", "Error", ...headers].join(","),
      ...importResult.errors.map(err => 
        [
          err.rowIndex + 2,
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
  };

  const fields = FIELD_MAPPINGS[selectedDataset];
  const DatasetIcon = DATASET_TYPES[selectedDataset].icon;

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetState(); }}>
      <DialogTrigger asChild>
        {triggerButton || (
          <Button variant="outline" size="sm" className="h-9 gap-2">
            <FileSpreadsheet className="w-4 h-4" />
            {isPt ? "Importar/Extrair" : "Import/Extract"}
          </Button>
        )}
      </DialogTrigger>
      
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-primary" />
            {isPt ? "Extração de Dados" : "Data Extraction"}
            {companyName && (
              <Badge variant="outline" className="ml-2">
                {companyName}
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            {isPt 
              ? "Importe funcionários, fornecedores, clientes, contas e mais de planilhas CSV ou XLSX"
              : "Import employees, vendors, clients, accounts and more from CSV or XLSX spreadsheets"
            }
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {/* Step: Upload */}
          {step === "upload" && (
            <div className="py-8 text-center space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileSelect}
                className="hidden"
              />
              
              <div 
                className={cn(
                  "border-2 border-dashed rounded-xl p-12 cursor-pointer transition-colors",
                  "hover:border-primary/50 hover:bg-primary/5"
                )}
                onClick={() => fileInputRef.current?.click()}
              >
                {isLoading ? (
                  <Loader2 className="w-12 h-12 mx-auto animate-spin text-primary" />
                ) : (
                  <>
                    <Upload className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-lg font-medium">
                      {isPt ? "Arraste ou clique para selecionar" : "Drag or click to select"}
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      CSV, XLSX, XLS (max 1000 {isPt ? "linhas" : "rows"})
                    </p>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Step: Sheet Selection (XLSX with multiple sheets) */}
          {step === "sheet-select" && (
            <div className="py-6 space-y-4">
              <p className="text-sm text-muted-foreground">
                {isPt ? "Selecione a planilha para importar:" : "Select sheet to import:"}
              </p>
              <div className="grid gap-2">
                {sheetNames.map((sheet) => (
                  <Button
                    key={sheet}
                    variant="outline"
                    className="justify-start h-12 text-left"
                    onClick={() => handleSheetSelect(sheet)}
                  >
                    <FileSpreadsheet className="w-4 h-4 mr-3" />
                    {sheet}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Step: Dataset Selection */}
          {step === "dataset-select" && (
            <div className="py-6 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{fileName}</p>
                  <p className="text-sm text-muted-foreground">
                    {rows.length} {isPt ? "linhas" : "rows"} · {headers.length} {isPt ? "colunas" : "columns"}
                  </p>
                </div>
                <Badge variant="secondary">
                  {isPt ? "Detectado" : "Detected"}: {DATASET_TYPES[detectedDataset].label}
                </Badge>
              </div>

              {/* Show detected columns */}
              {headers.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground font-medium">
                    {isPt ? "Colunas encontradas:" : "Columns found:"}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {headers.map(h => (
                      <Badge key={h} variant="outline" className="text-xs">{h}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {headers.length === 0 && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-sm">
                  <AlertCircle className="w-4 h-4 text-destructive shrink-0" />
                  <span className="text-destructive">
                    {isPt 
                      ? "Nenhuma coluna detectada. Verifique se a planilha tem cabeçalhos." 
                      : "No columns detected. Check that the spreadsheet has headers."}
                  </span>
                </div>
              )}
              
              <div>
                <Label className="mb-2 block">
                  {isPt ? "Tipo de dados a importar" : "Data type to import"}
                </Label>
                <Select value={selectedDataset} onValueChange={(v) => handleDatasetChange(v as DatasetType)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(DATASET_TYPES).map(([key, config]) => {
                      const Icon = config.icon;
                      return (
                        <SelectItem key={key} value={key}>
                          <div className="flex items-center gap-2">
                            <Icon className="w-4 h-4" />
                            {config.label}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <Button 
                onClick={() => setStep("mapping")} 
                className="w-full"
                disabled={headers.length === 0}
              >
                {isPt ? "Continuar para Mapeamento" : "Continue to Mapping"}
              </Button>
            </div>
          )}

          {/* Step: Column Mapping */}
          {step === "mapping" && (
            <div className="py-4 space-y-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                <DatasetIcon className="w-5 h-5 text-primary" />
                <span className="font-medium">{DATASET_TYPES[selectedDataset].label}</span>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleAutoMapAll}
                    className="gap-1"
                  >
                    <Wand2 className="w-3 h-3" />
                    {isPt ? "Mapear Todos" : "Map All"}
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleClearMapping}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              </div>

              <div className="grid gap-3">
                {fields.map((field) => (
                  <div key={field.key} className={cn(
                    "flex items-center gap-3 p-2 rounded-lg transition-colors",
                    field.required && !mapping[field.key] && "bg-destructive/10 border border-destructive/30"
                  )}>
                    <Label className={cn("w-32 shrink-0", field.required && "font-semibold text-foreground")}>
                      {field.label}
                      {field.required && <span className="text-destructive ml-1">*</span>}
                    </Label>
                    <Select
                      value={mapping[field.key] || "__none__"} 
                      onValueChange={(v) => handleMappingChange(field.key, v)}
                    >
                      <SelectTrigger className={cn(
                        "flex-1",
                        field.required && !mapping[field.key] && "border-destructive"
                      )}>
                        <SelectValue placeholder={isPt ? "Selecione coluna" : "Select column"} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">
                          <span className="text-muted-foreground">— {isPt ? "Não mapear" : "Don't map"} —</span>
                        </SelectItem>
                        {headers.map((col) => (
                          <SelectItem key={col} value={col}>{col}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {mapping[field.key] && (
                      <Check className="w-4 h-4 text-green-500 shrink-0" />
                    )}
                  </div>
                ))}
              </div>

              {/* Warning for unmapped required fields */}
              {fields.filter(f => f.required).some(f => !mapping[f.key]) && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-sm">
                  <AlertCircle className="w-4 h-4 text-destructive shrink-0" />
                  <span className="text-destructive">
                    {isPt 
                      ? "Campos obrigatórios (*) precisam ser mapeados para continuar" 
                      : "Required fields (*) must be mapped to continue"}
                  </span>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Button variant="outline" onClick={() => setStep("dataset-select")}>
                  {isPt ? "Voltar" : "Back"}
                </Button>
                <Button 
                  onClick={() => setStep("preview")} 
                  className="flex-1"
                  disabled={fields.filter(f => f.required).some(f => !mapping[f.key])}
                >
                  {isPt ? "Ver Preview" : "View Preview"}
                </Button>
              </div>
            </div>
          )}

          {/* Step: Preview */}
          {step === "preview" && (
            <div className="py-4 space-y-4">
              {/* Stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-lg bg-muted/50 text-center">
                  <p className="text-2xl font-bold">{rows.length}</p>
                  <p className="text-xs text-muted-foreground">{isPt ? "Total" : "Total"}</p>
                </div>
                <div className="p-3 rounded-lg bg-green-500/10 text-center">
                  <p className="text-2xl font-bold text-green-600">{validationStats.validCount}</p>
                  <p className="text-xs text-muted-foreground">{isPt ? "Válidos" : "Valid"}</p>
                </div>
                <div className="p-3 rounded-lg bg-red-500/10 text-center">
                  <p className="text-2xl font-bold text-red-600">{validationStats.invalidCount}</p>
                  <p className="text-xs text-muted-foreground">{isPt ? "Inválidos" : "Invalid"}</p>
                </div>
              </div>

              {/* Preview Table */}
              <ScrollArea className="h-64 border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">#</TableHead>
                      {fields.filter(f => mapping[f.key]).map((field) => (
                        <TableHead key={field.key}>{field.label}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previewRows.map((row, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="text-muted-foreground">{idx + 1}</TableCell>
                        {fields.filter(f => mapping[f.key]).map((field) => (
                          <TableCell key={field.key} className="max-w-[150px] truncate">
                            {String(row[mapping[field.key]] || "-")}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep("mapping")}>
                  {isPt ? "Voltar" : "Back"}
                </Button>
                <Button 
                  onClick={handleImport} 
                  className="flex-1"
                  disabled={validationStats.validCount === 0}
                >
                  {isPt ? `Importar ${validationStats.validCount} registros` : `Import ${validationStats.validCount} records`}
                </Button>
              </div>
            </div>
          )}

          {/* Step: Importing */}
          {step === "importing" && (
            <div className="py-12 text-center space-y-6">
              <Loader2 className="w-12 h-12 mx-auto animate-spin text-primary" />
              <div>
                <p className="font-medium">
                  {isPt ? "Importando..." : "Importing..."}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {importProgress.current} / {importProgress.total}
                </p>
              </div>
              <Progress value={(importProgress.current / importProgress.total) * 100} className="w-full" />
            </div>
          )}

          {/* Step: Result */}
          {step === "result" && importResult && (
            <div className="py-6 space-y-6">
              <div className="grid grid-cols-3 gap-3">
                <div className="p-4 rounded-lg bg-green-500/10 text-center">
                  <Check className="w-6 h-6 mx-auto text-green-600 mb-2" />
                  <p className="text-2xl font-bold text-green-600">{importResult.imported}</p>
                  <p className="text-xs text-muted-foreground">{isPt ? "Importados" : "Imported"}</p>
                </div>
                <div className="p-4 rounded-lg bg-yellow-500/10 text-center">
                  <AlertCircle className="w-6 h-6 mx-auto text-yellow-600 mb-2" />
                  <p className="text-2xl font-bold text-yellow-600">{importResult.skipped}</p>
                  <p className="text-xs text-muted-foreground">{isPt ? "Duplicados" : "Duplicates"}</p>
                </div>
                <div className="p-4 rounded-lg bg-red-500/10 text-center">
                  <X className="w-6 h-6 mx-auto text-red-600 mb-2" />
                  <p className="text-2xl font-bold text-red-600">{importResult.invalid}</p>
                  <p className="text-xs text-muted-foreground">{isPt ? "Erros" : "Errors"}</p>
                </div>
              </div>

              {importResult.errors.length > 0 && (
                <Button 
                  variant="outline" 
                  onClick={downloadErrorsCSV}
                  className="w-full gap-2"
                >
                  <Download className="w-4 h-4" />
                  {isPt ? "Baixar CSV de erros" : "Download errors CSV"}
                </Button>
              )}

              <Button onClick={() => { setOpen(false); resetState(); }} className="w-full">
                {isPt ? "Fechar" : "Close"}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
