import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { 
  Plus, Trash2, Edit2, CreditCard, Users, Building2, Truck,
  Briefcase, DollarSign, FolderTree, UserCheck
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useAppSettings } from "@/contexts/AppSettingsContext";

interface CompanySettingsPanelProps {
  companyId: string | null;
  userId: string;
}

interface Account {
  id: string;
  name: string;
  account_type: string;
  has_tax: boolean;
  description: string | null;
}

interface Employee {
  id: string;
  name: string;
  role: string | null;
  email: string | null;
  phone: string | null;
  hourly_rate: number;
  is_active: boolean;
}

interface Provider {
  id: string;
  name: string;
  category: string | null;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
}

interface Client {
  id: string;
  name: string;
  company_name: string | null;
  email: string | null;
  phone: string | null;
}

interface IncomeType {
  id: string;
  name: string;
  description: string | null;
}

interface Category {
  id: string;
  name: string;
  type: string;
  icon: string | null;
  color: string | null;
  parent_id: string | null;
}

type SettingsTab = "accounts" | "employees" | "providers" | "clients" | "income_types" | "expense_categories" | "income_categories";

const getTabConfig = (t: (key: string) => string) => [
  { id: "accounts" as const, labelKey: "settings.accounts", icon: CreditCard },
  { id: "expense_categories" as const, labelKey: "settings.expenseCategories", icon: FolderTree },
  { id: "income_categories" as const, labelKey: "settings.incomeCategories", icon: DollarSign },
  { id: "income_types" as const, labelKey: "settings.incomeTypes", icon: Briefcase },
  { id: "employees" as const, labelKey: "company.employees", icon: Users },
  { id: "clients" as const, labelKey: "company.clients", icon: UserCheck },
  { id: "providers" as const, labelKey: "company.providers", icon: Truck },
];

export function CompanySettingsPanel({ companyId, userId }: CompanySettingsPanelProps) {
  const { toast } = useToast();
  const { t } = useAppSettings();
  const tabConfig = getTabConfig(t);
  const [activeTab, setActiveTab] = useState<SettingsTab>("accounts");
  const [isLoading, setIsLoading] = useState(true);

  // Data states
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [incomeTypes, setIncomeTypes] = useState<IncomeType[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<Category[]>([]);
  const [incomeCategories, setIncomeCategories] = useState<Category[]>([]);

  // Dialog states
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    loadAllData();
  }, [companyId, userId]);

  const loadAllData = async () => {
    setIsLoading(true);
    try {
      // Load accounts
      const { data: accountsData } = await supabase
        .from("company_accounts")
        .select("*")
        .eq("user_id", userId)
        .order("sort_order");
      setAccounts(accountsData || []);

      // Load employees
      const { data: employeesData } = await supabase
        .from("company_employees")
        .select("*")
        .eq("user_id", userId)
        .order("name");
      setEmployees(employeesData || []);

      // Load providers
      const { data: providersData } = await supabase
        .from("company_providers")
        .select("*")
        .eq("user_id", userId)
        .order("name");
      setProviders(providersData || []);

      // Load clients
      const { data: clientsData } = await supabase
        .from("company_clients")
        .select("*")
        .eq("user_id", userId)
        .order("name");
      setClients(clientsData || []);

      // Load income types
      const { data: incomeTypesData } = await supabase
        .from("income_types")
        .select("*")
        .eq("user_id", userId)
        .order("sort_order");
      setIncomeTypes(incomeTypesData || []);

      // Load expense categories
      const { data: expenseCatsData } = await supabase
        .from("financial_categories")
        .select("*")
        .eq("user_id", userId)
        .eq("type", "expense")
        .order("sort_order");
      setExpenseCategories(expenseCatsData || []);

      // Load income categories
      const { data: incomeCatsData } = await supabase
        .from("financial_categories")
        .select("*")
        .eq("user_id", userId)
        .eq("type", "income")
        .order("sort_order");
      setIncomeCategories(incomeCatsData || []);

    } catch (error) {
      console.error("Error loading settings:", error);
      toast({ title: "Erro ao carregar configurações", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const openAddDialog = () => {
    setEditingItem(null);
    setFormData(getDefaultFormData());
    setIsDialogOpen(true);
  };

  const openEditDialog = (item: any) => {
    setEditingItem(item);
    setFormData({ ...item });
    setIsDialogOpen(true);
  };

  const getDefaultFormData = () => {
    switch (activeTab) {
      case "accounts":
        return { name: "", account_type: "checking", has_tax: false, description: "" };
      case "employees":
        return { name: "", role: "", email: "", phone: "", hourly_rate: 0, is_active: true };
      case "providers":
        return { name: "", category: "", contact_name: "", email: "", phone: "" };
      case "clients":
        return { name: "", company_name: "", email: "", phone: "" };
      case "income_types":
        return { name: "", description: "" };
      case "expense_categories":
      case "income_categories":
        return { name: "", icon: "folder", color: "#808080" };
      default:
        return {};
    }
  };

  const handleSave = async () => {
    if (!formData.name?.trim()) {
      toast({ title: "Nome é obrigatório", variant: "destructive" });
      return;
    }

    try {
      let table = "";
      let data: any = { ...formData, user_id: userId };
      
      if (companyId) {
        data.company_id = companyId;
      }

      switch (activeTab) {
        case "accounts":
          table = "company_accounts";
          break;
        case "employees":
          table = "company_employees";
          break;
        case "providers":
          table = "company_providers";
          break;
        case "clients":
          table = "company_clients";
          break;
        case "income_types":
          table = "income_types";
          break;
        case "expense_categories":
        case "income_categories":
          table = "financial_categories";
          data.type = activeTab === "expense_categories" ? "expense" : "income";
          break;
      }

      if (editingItem) {
        const { error } = await supabase
          .from(table as any)
          .update(data)
          .eq("id", editingItem.id);
        if (error) throw error;
        toast({ title: "Atualizado com sucesso!" });
      } else {
        const { error } = await supabase
          .from(table as any)
          .insert(data);
        if (error) throw error;
        toast({ title: "Adicionado com sucesso!" });
      }

      setIsDialogOpen(false);
      loadAllData();
    } catch (error) {
      console.error("Error saving:", error);
      toast({ title: "Erro ao salvar", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      let table = "";
      switch (activeTab) {
        case "accounts": table = "company_accounts"; break;
        case "employees": table = "company_employees"; break;
        case "providers": table = "company_providers"; break;
        case "clients": table = "company_clients"; break;
        case "income_types": table = "income_types"; break;
        case "expense_categories":
        case "income_categories":
          table = "financial_categories"; break;
      }

      const { error } = await supabase
        .from(table as any)
        .delete()
        .eq("id", id);
      
      if (error) throw error;
      toast({ title: "Removido com sucesso!" });
      loadAllData();
    } catch (error) {
      console.error("Error deleting:", error);
      toast({ title: "Erro ao remover", variant: "destructive" });
    }
  };

  const getCurrentData = () => {
    switch (activeTab) {
      case "accounts": return accounts;
      case "employees": return employees;
      case "providers": return providers;
      case "clients": return clients;
      case "income_types": return incomeTypes;
      case "expense_categories": return expenseCategories;
      case "income_categories": return incomeCategories;
      default: return [];
    }
  };

  const renderFormFields = () => {
    switch (activeTab) {
      case "accounts":
        return (
          <>
            <div className="space-y-2">
              <Label>Nome da Conta</Label>
              <Input 
                value={formData.name || ""} 
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="Ex: TD Chequing"
              />
            </div>
            <div className="space-y-2">
              <Label>Tipo de Conta</Label>
              <Select 
                value={formData.account_type || "checking"} 
                onValueChange={(v) => setFormData({...formData, account_type: v})}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="checking">Conta Corrente</SelectItem>
                  <SelectItem value="savings">Poupança</SelectItem>
                  <SelectItem value="credit_card">Cartão de Crédito</SelectItem>
                  <SelectItem value="cash">Dinheiro</SelectItem>
                  <SelectItem value="payroll">Folha de Pagamento</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Switch 
                checked={formData.has_tax || false}
                onCheckedChange={(v) => setFormData({...formData, has_tax: v})}
              />
              <Label>Imposto Aplicável (Tax)</Label>
            </div>
          </>
        );

      case "employees":
        return (
          <>
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input 
                value={formData.name || ""} 
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>Função</Label>
              <Input 
                value={formData.role || ""} 
                onChange={(e) => setFormData({...formData, role: e.target.value})}
                placeholder="Ex: Drywall Worker"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input 
                  type="email"
                  value={formData.email || ""} 
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Telefone</Label>
                <Input 
                  value={formData.phone || ""} 
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Valor/Hora ($)</Label>
              <Input 
                type="number"
                value={formData.hourly_rate || 0} 
                onChange={(e) => setFormData({...formData, hourly_rate: parseFloat(e.target.value) || 0})}
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch 
                checked={formData.is_active !== false}
                onCheckedChange={(v) => setFormData({...formData, is_active: v})}
              />
              <Label>Ativo</Label>
            </div>
          </>
        );

      case "providers":
        return (
          <>
            <div className="space-y-2">
              <Label>Nome do Fornecedor</Label>
              <Input 
                value={formData.name || ""} 
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Input 
                value={formData.category || ""} 
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                placeholder="Ex: Material, Hardware, Rental"
              />
            </div>
            <div className="space-y-2">
              <Label>Contato</Label>
              <Input 
                value={formData.contact_name || ""} 
                onChange={(e) => setFormData({...formData, contact_name: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input 
                  type="email"
                  value={formData.email || ""} 
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Telefone</Label>
                <Input 
                  value={formData.phone || ""} 
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                />
              </div>
            </div>
          </>
        );

      case "clients":
        return (
          <>
            <div className="space-y-2">
              <Label>Nome do Cliente</Label>
              <Input 
                value={formData.name || ""} 
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>Empresa</Label>
              <Input 
                value={formData.company_name || ""} 
                onChange={(e) => setFormData({...formData, company_name: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input 
                  type="email"
                  value={formData.email || ""} 
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Telefone</Label>
                <Input 
                  value={formData.phone || ""} 
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                />
              </div>
            </div>
          </>
        );

      case "income_types":
        return (
          <>
            <div className="space-y-2">
              <Label>Tipo de Receita</Label>
              <Input 
                value={formData.name || ""} 
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="Ex: PW, HOUR, PROJECT"
              />
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Input 
                value={formData.description || ""} 
                onChange={(e) => setFormData({...formData, description: e.target.value})}
              />
            </div>
          </>
        );

      case "expense_categories":
      case "income_categories":
        return (
          <>
            <div className="space-y-2">
              <Label>Nome da Categoria</Label>
              <Input 
                value={formData.name || ""} 
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder={activeTab === "expense_categories" ? "Ex: Material, Tools, Maintenance" : "Ex: Garage, Prep Work, Repair"}
              />
            </div>
            <div className="space-y-2">
              <Label>Cor</Label>
              <div className="flex gap-2 items-center">
                <Input 
                  type="color"
                  className="w-12 h-10 p-1"
                  value={formData.color || "#808080"} 
                  onChange={(e) => setFormData({...formData, color: e.target.value})}
                />
                <span className="text-sm text-muted-foreground">{formData.color}</span>
              </div>
            </div>
          </>
        );
    }
  };

  const renderTableHeaders = () => {
    switch (activeTab) {
      case "accounts":
        return ["Nome", "Tipo", "Tax"];
      case "employees":
        return ["Nome", "Função", "Valor/h", "Status"];
      case "providers":
        return ["Nome", "Categoria", "Contato"];
      case "clients":
        return ["Nome", "Empresa", "Contato"];
      case "income_types":
        return ["Nome", "Descrição"];
      case "expense_categories":
      case "income_categories":
        return ["Nome", "Cor"];
      default:
        return [];
    }
  };

  const renderTableRow = (item: any) => {
    switch (activeTab) {
      case "accounts":
        return (
          <>
            <td className="p-2 sm:p-3 font-medium truncate max-w-[120px] sm:max-w-none">{item.name}</td>
            <td className="p-2 sm:p-3 text-muted-foreground capitalize text-xs sm:text-sm">{item.account_type?.replace("_", " ")}</td>
            <td className="p-2 sm:p-3">
              <Badge variant={item.has_tax ? "default" : "secondary"} className="text-[10px] sm:text-xs">
                {item.has_tax ? "Sim" : "Não"}
              </Badge>
            </td>
          </>
        );
      case "employees":
        return (
          <>
            <td className="p-2 sm:p-3 font-medium truncate max-w-[100px] sm:max-w-none">{item.name}</td>
            <td className="p-2 sm:p-3 text-muted-foreground text-xs sm:text-sm truncate max-w-[80px] sm:max-w-none">{item.role || "-"}</td>
            <td className="p-2 sm:p-3 text-xs sm:text-sm">${item.hourly_rate || 0}</td>
            <td className="p-2 sm:p-3">
              <Badge variant={item.is_active ? "default" : "secondary"} className="text-[10px] sm:text-xs">
                {item.is_active ? "Ativo" : "Inativo"}
              </Badge>
            </td>
          </>
        );
      case "providers":
        return (
          <>
            <td className="p-2 sm:p-3 font-medium truncate max-w-[120px] sm:max-w-none">{item.name}</td>
            <td className="p-2 sm:p-3 text-muted-foreground text-xs sm:text-sm truncate max-w-[80px] sm:max-w-none">{item.category || "-"}</td>
            <td className="p-2 sm:p-3 text-muted-foreground text-xs sm:text-sm truncate max-w-[100px] sm:max-w-none">{item.contact_name || item.email || "-"}</td>
          </>
        );
      case "clients":
        return (
          <>
            <td className="p-2 sm:p-3 font-medium truncate max-w-[120px] sm:max-w-none">{item.name}</td>
            <td className="p-2 sm:p-3 text-muted-foreground text-xs sm:text-sm truncate max-w-[100px] sm:max-w-none">{item.company_name || "-"}</td>
            <td className="p-2 sm:p-3 text-muted-foreground text-xs sm:text-sm truncate max-w-[100px] sm:max-w-none">{item.email || item.phone || "-"}</td>
          </>
        );
      case "income_types":
        return (
          <>
            <td className="p-2 sm:p-3 font-medium truncate max-w-[100px] sm:max-w-none">{item.name}</td>
            <td className="p-2 sm:p-3 text-muted-foreground text-xs sm:text-sm truncate max-w-[150px] sm:max-w-none">{item.description || "-"}</td>
          </>
        );
      case "expense_categories":
      case "income_categories":
        return (
          <>
            <td className="p-2 sm:p-3 font-medium truncate max-w-[150px] sm:max-w-none">{item.name}</td>
            <td className="p-2 sm:p-3">
              <div 
                className="w-5 h-5 sm:w-6 sm:h-6 rounded border border-border shrink-0"
                style={{ backgroundColor: item.color || "#808080" }}
              />
            </td>
          </>
        );
    }
  };

  const getDialogTitle = () => {
    const isEditing = !!editingItem;
    switch (activeTab) {
      case "accounts": return isEditing ? "Editar Conta" : "Nova Conta";
      case "employees": return isEditing ? "Editar Funcionário" : "Novo Funcionário";
      case "providers": return isEditing ? "Editar Fornecedor" : "Novo Fornecedor";
      case "clients": return isEditing ? "Editar Cliente" : "Novo Cliente";
      case "income_types": return isEditing ? "Editar Tipo de Receita" : "Novo Tipo de Receita";
      case "expense_categories": return isEditing ? "Editar Categoria" : "Nova Categoria de Despesa";
      case "income_categories": return isEditing ? "Editar Categoria" : "Nova Categoria de Receita";
      default: return "";
    }
  };

  const data = getCurrentData();
  const headers = renderTableHeaders();

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Tabs - Horizontal scroll on mobile */}
      <div className="overflow-x-auto -mx-2 px-2 pb-2">
        <div className="flex gap-1.5 sm:gap-2 bg-card/50 p-1.5 sm:p-2 rounded-lg border border-border min-w-max">
          {tabConfig.map((tab) => {
            const Icon = tab.icon;
            return (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-1 sm:gap-2 text-[10px] sm:text-xs px-2 sm:px-3 h-8 whitespace-nowrap",
                  activeTab === tab.id && "bg-primary text-primary-foreground"
                )}
              >
                <Icon className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                <span className="hidden xs:inline sm:inline">{t(tab.labelKey)}</span>
              </Button>
            );
          })}
        </div>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="flex items-center justify-between p-2.5 sm:p-3 border-b border-border bg-muted/30 gap-2">
          <h3 className="font-semibold text-xs sm:text-sm truncate">
            {t(tabConfig.find(tab => tab.id === activeTab)?.labelKey || "")} ({data.length})
          </h3>
          <Button 
            size="sm" 
            onClick={openAddDialog} 
            className="bg-primary text-primary-foreground shrink-0 h-8 px-2.5 sm:px-3 text-xs"
          >
            <Plus className="w-3.5 h-3.5 sm:mr-1" />
            <span className="hidden sm:inline">{t("settings.addItem")}</span>
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs sm:text-sm">
            <thead className="bg-muted/50">
              <tr>
                {headers.map((h, i) => (
                  <th key={i} className="p-2 sm:p-3 text-left font-medium text-muted-foreground uppercase text-[10px] sm:text-xs whitespace-nowrap">
                    {h}
                  </th>
                ))}
                <th className="p-2 sm:p-3 text-right font-medium text-muted-foreground uppercase text-[10px] sm:text-xs w-16 sm:w-20">
                  {t("settings.actions")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.length === 0 ? (
                <tr>
                  <td colSpan={headers.length + 1} className="p-6 sm:p-8 text-center text-muted-foreground text-xs sm:text-sm">
                    {t("settings.noItems")}
                  </td>
                </tr>
              ) : (
                data.map((item) => (
                  <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                    {renderTableRow(item)}
                    <td className="p-2 sm:p-3 text-right">
                      <div className="flex justify-end gap-0.5 sm:gap-1">
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-6 w-6 sm:h-7 sm:w-7"
                          onClick={() => openEditDialog(item)}
                        >
                          <Edit2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                        </Button>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-6 w-6 sm:h-7 sm:w-7 text-destructive hover:text-destructive"
                          onClick={() => handleDelete(item.id)}
                        >
                          <Trash2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">{getDialogTitle()}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 sm:space-y-4">
            {renderFormFields()}
            <div className="flex justify-end gap-2 pt-3 sm:pt-4">
              <Button variant="outline" size="sm" onClick={() => setIsDialogOpen(false)}>
                {t("common.cancel")}
              </Button>
              <Button size="sm" onClick={handleSave} className="bg-primary text-primary-foreground">
                {t("common.save")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
