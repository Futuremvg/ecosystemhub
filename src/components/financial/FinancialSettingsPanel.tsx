import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, Trash2, Edit, ChevronRight, Folder, FolderOpen, 
  DollarSign, TrendingUp, TrendingDown, Palette, GripVertical,
  Building2, Briefcase, CreditCard, ShoppingCart, Home, Car,
  Utensils, Smartphone, Plane, Heart, Lightbulb, Wrench
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAppSettings } from "@/contexts/AppSettingsContext";
import { cn } from "@/lib/utils";

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

interface FinancialSettingsPanelProps {
  sources: FinancialSource[];
  categories: FinancialCategory[];
  setSources: (sources: FinancialSource[]) => void;
  setCategories: (categories: FinancialCategory[]) => void;
  userId: string;
}

const CATEGORY_ICONS = [
  { name: "folder", icon: Folder, label: "Pasta" },
  { name: "building", icon: Building2, label: "Empresa" },
  { name: "briefcase", icon: Briefcase, label: "Trabalho" },
  { name: "credit-card", icon: CreditCard, label: "Cartão" },
  { name: "shopping-cart", icon: ShoppingCart, label: "Compras" },
  { name: "home", icon: Home, label: "Casa" },
  { name: "car", icon: Car, label: "Transporte" },
  { name: "utensils", icon: Utensils, label: "Alimentação" },
  { name: "smartphone", icon: Smartphone, label: "Tecnologia" },
  { name: "plane", icon: Plane, label: "Viagem" },
  { name: "heart", icon: Heart, label: "Saúde" },
  { name: "lightbulb", icon: Lightbulb, label: "Serviços" },
  { name: "wrench", icon: Wrench, label: "Manutenção" },
];

const COLORS = [
  "#22c55e", "#ef4444", "#3b82f6", "#f59e0b", "#8b5cf6",
  "#ec4899", "#14b8a6", "#f97316", "#6366f1", "#84cc16",
  "#06b6d4", "#a855f7"
];

const getIconComponent = (iconName?: string) => {
  const found = CATEGORY_ICONS.find(i => i.name === iconName);
  return found?.icon || Folder;
};

export function FinancialSettingsPanel({
  sources,
  categories,
  setSources,
  setCategories,
  userId
}: FinancialSettingsPanelProps) {
  const { toast } = useToast();
  const { t } = useAppSettings();
  
  // Source dialog state
  const [isAddingSource, setIsAddingSource] = useState(false);
  const [editingSource, setEditingSource] = useState<FinancialSource | null>(null);
  const [newSource, setNewSource] = useState({ 
    name: "", 
    tax_percentage: 0, 
    description: "", 
    color: "#22c55e" 
  });
  
  // Category dialog state
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [editingCategory, setEditingCategory] = useState<FinancialCategory | null>(null);
  const [newCategory, setNewCategory] = useState({ 
    name: "", 
    type: "expense" as "expense" | "income",
    parent_id: null as string | null,
    icon: "folder",
    color: "#808080"
  });

  // Get parent categories (those without parent_id)
  const parentCategories = categories.filter(c => !c.parent_id);
  const getSubcategories = (parentId: string) => 
    categories.filter(c => c.parent_id === parentId);

  // Sources CRUD
  const handleAddSource = async () => {
    if (!newSource.name.trim()) return;
    try {
      const { data, error } = await supabase
        .from("financial_sources")
        .insert({ 
          user_id: userId, 
          name: newSource.name.trim(),
          tax_percentage: newSource.tax_percentage,
          description: newSource.description || null,
          color: newSource.color
        })
        .select()
        .single();

      if (error) throw error;
      setSources([...sources, data]);
      setNewSource({ name: "", tax_percentage: 0, description: "", color: "#22c55e" });
      setIsAddingSource(false);
      toast({ title: t("money.sourceAdded") || "Fonte adicionada!" });
    } catch (error) {
      console.error(error);
      toast({ title: "Erro ao adicionar fonte", variant: "destructive" });
    }
  };

  const handleUpdateSource = async () => {
    if (!editingSource || !editingSource.name.trim()) return;
    try {
      const { error } = await supabase
        .from("financial_sources")
        .update({ 
          name: editingSource.name.trim(),
          tax_percentage: editingSource.tax_percentage,
          description: editingSource.description || null,
          color: editingSource.color
        })
        .eq("id", editingSource.id);

      if (error) throw error;
      setSources(sources.map(s => s.id === editingSource.id ? editingSource : s));
      setEditingSource(null);
      toast({ title: "Fonte atualizada!" });
    } catch (error) {
      console.error(error);
      toast({ title: "Erro ao atualizar fonte", variant: "destructive" });
    }
  };

  const handleDeleteSource = async (id: string) => {
    try {
      const { error } = await supabase.from("financial_sources").delete().eq("id", id);
      if (error) throw error;
      setSources(sources.filter(s => s.id !== id));
      toast({ title: "Fonte removida!" });
    } catch (error) {
      console.error(error);
      toast({ title: "Erro ao remover fonte", variant: "destructive" });
    }
  };

  // Categories CRUD
  const handleAddCategory = async () => {
    if (!newCategory.name.trim()) return;
    try {
      const { data, error } = await supabase
        .from("financial_categories")
        .insert({ 
          user_id: userId, 
          name: newCategory.name.trim(),
          type: newCategory.type,
          parent_id: newCategory.parent_id || null,
          icon: newCategory.icon,
          color: newCategory.color
        })
        .select()
        .single();

      if (error) throw error;
      setCategories([...categories, data]);
      setNewCategory({ name: "", type: "expense", parent_id: null, icon: "folder", color: "#808080" });
      setIsAddingCategory(false);
      toast({ title: "Categoria adicionada!" });
    } catch (error) {
      console.error(error);
      toast({ title: "Erro ao adicionar categoria", variant: "destructive" });
    }
  };

  const handleUpdateCategory = async () => {
    if (!editingCategory || !editingCategory.name.trim()) return;
    try {
      const { error } = await supabase
        .from("financial_categories")
        .update({ 
          name: editingCategory.name.trim(),
          type: editingCategory.type,
          parent_id: editingCategory.parent_id || null,
          icon: editingCategory.icon,
          color: editingCategory.color
        })
        .eq("id", editingCategory.id);

      if (error) throw error;
      setCategories(categories.map(c => c.id === editingCategory.id ? editingCategory : c));
      setEditingCategory(null);
      toast({ title: "Categoria atualizada!" });
    } catch (error) {
      console.error(error);
      toast({ title: "Erro ao atualizar categoria", variant: "destructive" });
    }
  };

  const handleDeleteCategory = async (id: string) => {
    try {
      // Delete subcategories first
      const subs = getSubcategories(id);
      for (const sub of subs) {
        await supabase.from("financial_categories").delete().eq("id", sub.id);
      }
      const { error } = await supabase.from("financial_categories").delete().eq("id", id);
      if (error) throw error;
      setCategories(categories.filter(c => c.id !== id && c.parent_id !== id));
      toast({ title: "Categoria removida!" });
    } catch (error) {
      console.error(error);
      toast({ title: "Erro ao remover categoria", variant: "destructive" });
    }
  };

  const incomeCategories = parentCategories.filter(c => c.type === "income");
  const expenseCategories = parentCategories.filter(c => c.type === "expense");

  return (
    <div className="space-y-6">
      <Tabs defaultValue="sources" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="sources" className="flex items-center gap-2">
            <Briefcase className="w-4 h-4" />
            {t("money.sources")}
          </TabsTrigger>
          <TabsTrigger value="income-categories" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            {t("money.income")}
          </TabsTrigger>
          <TabsTrigger value="expense-categories" className="flex items-center gap-2">
            <TrendingDown className="w-4 h-4" />
            {t("money.expenses")}
          </TabsTrigger>
        </TabsList>

        {/* Sources Tab */}
        <TabsContent value="sources" className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">{t("money.sources")}</h3>
              <p className="text-sm text-muted-foreground">{t("money.sourcesDesc")}</p>
            </div>
            <Dialog open={isAddingSource} onOpenChange={setIsAddingSource}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-financial-positive hover:bg-financial-positive/90">
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
                      placeholder="Ex: Cliente ABC, Projeto X"
                      value={newSource.name}
                      onChange={(e) => setNewSource({ ...newSource, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Descrição (opcional)</Label>
                    <Input
                      placeholder="Detalhes sobre a fonte"
                      value={newSource.description}
                      onChange={(e) => setNewSource({ ...newSource, description: e.target.value })}
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
                  <div>
                    <Label>Cor</Label>
                    <div className="flex gap-2 flex-wrap mt-2">
                      {COLORS.map(color => (
                        <button
                          key={color}
                          className={cn(
                            "w-8 h-8 rounded-full border-2 transition-all",
                            newSource.color === color ? "border-foreground scale-110" : "border-transparent"
                          )}
                          style={{ backgroundColor: color }}
                          onClick={() => setNewSource({ ...newSource, color })}
                        />
                      ))}
                    </div>
                  </div>
                  <Button onClick={handleAddSource} className="w-full">{t("common.add")}</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {sources.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-8">
                <Briefcase className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-center">{t("money.noSources")}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Adicione clientes ou projetos como fontes de receita
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3">
              {sources.map((source) => (
                <Card key={source.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div 
                      className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${source.color || '#22c55e'}20` }}
                    >
                      <DollarSign className="w-5 h-5" style={{ color: source.color || '#22c55e' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{source.name}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>Imposto: {source.tax_percentage}%</span>
                        {source.description && (
                          <>
                            <span>•</span>
                            <span className="truncate">{source.description}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Dialog open={editingSource?.id === source.id} onOpenChange={(open) => !open && setEditingSource(null)}>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="icon" onClick={() => setEditingSource(source)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Editar Fonte</DialogTitle>
                          </DialogHeader>
                          {editingSource && (
                            <div className="space-y-4 mt-4">
                              <div>
                                <Label>{t("ecosystem.name")}</Label>
                                <Input
                                  value={editingSource.name}
                                  onChange={(e) => setEditingSource({ ...editingSource, name: e.target.value })}
                                />
                              </div>
                              <div>
                                <Label>Descrição</Label>
                                <Input
                                  value={editingSource.description || ""}
                                  onChange={(e) => setEditingSource({ ...editingSource, description: e.target.value })}
                                />
                              </div>
                              <div>
                                <Label>{t("money.taxPercent")}</Label>
                                <Input
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={editingSource.tax_percentage}
                                  onChange={(e) => setEditingSource({ ...editingSource, tax_percentage: Number(e.target.value) })}
                                />
                              </div>
                              <div>
                                <Label>Cor</Label>
                                <div className="flex gap-2 flex-wrap mt-2">
                                  {COLORS.map(color => (
                                    <button
                                      key={color}
                                      className={cn(
                                        "w-8 h-8 rounded-full border-2 transition-all",
                                        editingSource.color === color ? "border-foreground scale-110" : "border-transparent"
                                      )}
                                      style={{ backgroundColor: color }}
                                      onClick={() => setEditingSource({ ...editingSource, color })}
                                    />
                                  ))}
                                </div>
                              </div>
                              <Button onClick={handleUpdateSource} className="w-full">{t("common.save")}</Button>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleDeleteSource(source.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Income Categories Tab */}
        <TabsContent value="income-categories" className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Categorias de Receita</h3>
              <p className="text-sm text-muted-foreground">Organize suas fontes de receita em categorias</p>
            </div>
            <Dialog open={isAddingCategory && newCategory.type === "income"} onOpenChange={(open) => {
              setIsAddingCategory(open);
              if (open) setNewCategory({ ...newCategory, type: "income" });
            }}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-financial-positive hover:bg-financial-positive/90">
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Nova Categoria de Receita</DialogTitle>
                </DialogHeader>
                <CategoryForm
                  category={newCategory}
                  setCategory={setNewCategory}
                  parentCategories={incomeCategories}
                  onSubmit={handleAddCategory}
                  t={t}
                />
              </DialogContent>
            </Dialog>
          </div>

          <CategoryList
            categories={incomeCategories}
            allCategories={categories}
            getSubcategories={getSubcategories}
            onEdit={setEditingCategory}
            onDelete={handleDeleteCategory}
            type="income"
            t={t}
          />
        </TabsContent>

        {/* Expense Categories Tab */}
        <TabsContent value="expense-categories" className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Categorias de Despesa</h3>
              <p className="text-sm text-muted-foreground">Organize suas despesas em categorias e subcategorias</p>
            </div>
            <Dialog open={isAddingCategory && newCategory.type === "expense"} onOpenChange={(open) => {
              setIsAddingCategory(open);
              if (open) setNewCategory({ ...newCategory, type: "expense" });
            }}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-financial-negative hover:bg-financial-negative/90">
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Nova Categoria de Despesa</DialogTitle>
                </DialogHeader>
                <CategoryForm
                  category={newCategory}
                  setCategory={setNewCategory}
                  parentCategories={expenseCategories}
                  onSubmit={handleAddCategory}
                  t={t}
                />
              </DialogContent>
            </Dialog>
          </div>

          <CategoryList
            categories={expenseCategories}
            allCategories={categories}
            getSubcategories={getSubcategories}
            onEdit={setEditingCategory}
            onDelete={handleDeleteCategory}
            type="expense"
            t={t}
          />
        </TabsContent>
      </Tabs>

      {/* Edit Category Dialog */}
      <Dialog open={!!editingCategory} onOpenChange={(open) => !open && setEditingCategory(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Categoria</DialogTitle>
          </DialogHeader>
          {editingCategory && (
            <CategoryForm
              category={editingCategory}
              setCategory={(cat) => setEditingCategory(cat as FinancialCategory)}
              parentCategories={parentCategories.filter(c => c.type === editingCategory.type && c.id !== editingCategory.id)}
              onSubmit={handleUpdateCategory}
              isEdit
              t={t}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Category Form Component
function CategoryForm({
  category,
  setCategory,
  parentCategories,
  onSubmit,
  isEdit = false,
  t
}: {
  category: any;
  setCategory: (cat: any) => void;
  parentCategories: FinancialCategory[];
  onSubmit: () => void;
  isEdit?: boolean;
  t: (key: string) => string;
}) {
  return (
    <div className="space-y-4 mt-4">
      <div>
        <Label>{t("ecosystem.name")}</Label>
        <Input
          placeholder="Ex: Alimentação, Transporte, Software"
          value={category.name}
          onChange={(e) => setCategory({ ...category, name: e.target.value })}
        />
      </div>
      
      <div>
        <Label>Categoria Pai (opcional)</Label>
        <Select 
          value={category.parent_id || "none"} 
          onValueChange={(v) => setCategory({ ...category, parent_id: v === "none" ? null : v })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Nenhuma (categoria principal)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Nenhuma (categoria principal)</SelectItem>
            {parentCategories.map(parent => (
              <SelectItem key={parent.id} value={parent.id}>
                {parent.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Ícone</Label>
        <div className="flex gap-2 flex-wrap mt-2">
          {CATEGORY_ICONS.map(({ name, icon: Icon, label }) => (
            <button
              key={name}
              className={cn(
                "p-2 rounded-lg border-2 transition-all",
                category.icon === name 
                  ? "border-primary bg-primary/10" 
                  : "border-transparent hover:border-muted"
              )}
              onClick={() => setCategory({ ...category, icon: name })}
              title={label}
            >
              <Icon className="w-5 h-5" />
            </button>
          ))}
        </div>
      </div>

      <div>
        <Label>Cor</Label>
        <div className="flex gap-2 flex-wrap mt-2">
          {COLORS.map(color => (
            <button
              key={color}
              className={cn(
                "w-8 h-8 rounded-full border-2 transition-all",
                category.color === color ? "border-foreground scale-110" : "border-transparent"
              )}
              style={{ backgroundColor: color }}
              onClick={() => setCategory({ ...category, color })}
            />
          ))}
        </div>
      </div>

      <Button onClick={onSubmit} className="w-full">
        {isEdit ? t("common.save") : t("common.add")}
      </Button>
    </div>
  );
}

// Category List Component
function CategoryList({
  categories,
  allCategories,
  getSubcategories,
  onEdit,
  onDelete,
  type,
  t
}: {
  categories: FinancialCategory[];
  allCategories: FinancialCategory[];
  getSubcategories: (parentId: string) => FinancialCategory[];
  onEdit: (cat: FinancialCategory) => void;
  onDelete: (id: string) => void;
  type: "income" | "expense";
  t: (key: string) => string;
}) {
  if (categories.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-8">
          {type === "income" ? (
            <TrendingUp className="w-12 h-12 text-muted-foreground mb-4" />
          ) : (
            <TrendingDown className="w-12 h-12 text-muted-foreground mb-4" />
          )}
          <p className="text-muted-foreground text-center">
            Nenhuma categoria de {type === "income" ? "receita" : "despesa"}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Crie categorias para organizar melhor suas finanças
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Accordion type="multiple" className="space-y-2">
      {categories.map((category) => {
        const subs = getSubcategories(category.id);
        const IconComponent = getIconComponent(category.icon);
        
        return (
          <AccordionItem key={category.id} value={category.id} className="border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline py-3">
              <div className="flex items-center gap-3 flex-1">
                <div 
                  className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${category.color || '#808080'}20` }}
                >
                  <IconComponent className="w-4 h-4" style={{ color: category.color || '#808080' }} />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium">{category.name}</p>
                  {subs.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {subs.length} subcategoria{subs.length > 1 ? 's' : ''}
                    </p>
                  )}
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="pb-3 space-y-3">
                {/* Subcategories */}
                {subs.length > 0 && (
                  <div className="pl-6 space-y-2">
                    {subs.map((sub) => {
                      const SubIcon = getIconComponent(sub.icon);
                      return (
                        <div key={sub.id} className="flex items-center gap-3 p-2 bg-muted/50 rounded-lg">
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                          <div 
                            className="w-7 h-7 rounded flex items-center justify-center shrink-0"
                            style={{ backgroundColor: `${sub.color || '#808080'}20` }}
                          >
                            <SubIcon className="w-3.5 h-3.5" style={{ color: sub.color || '#808080' }} />
                          </div>
                          <span className="flex-1 text-sm">{sub.name}</span>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(sub)}>
                            <Edit className="w-3.5 h-3.5" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            onClick={() => onDelete(sub.id)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
                
                {/* Category Actions */}
                <div className="flex items-center gap-2 pt-2 border-t">
                  <Button variant="outline" size="sm" onClick={() => onEdit(category)}>
                    <Edit className="w-4 h-4 mr-2" />
                    Editar
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-destructive hover:text-destructive"
                    onClick={() => onDelete(category.id)}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Excluir
                  </Button>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
}
