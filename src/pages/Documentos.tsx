import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  FileText, Plus, Search, Upload, File, Image, FileSpreadsheet, 
  FileType, Trash2, ExternalLink, Loader2, FolderOpen, Settings
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { FileUpload } from "@/components/documents/FileUpload";
import { useAppSettings } from "@/contexts/AppSettingsContext";

interface Document {
  id: string;
  name: string;
  file_url: string | null;
  file_type: string | null;
  category: string | null;
  created_at: string;
}

interface CustomCategory {
  value: string;
  label: string;
}

const getFileIcon = (type: string | null) => {
  if (!type) return File;
  if (type.includes("image")) return Image;
  if (type.includes("spreadsheet") || type.includes("excel")) return FileSpreadsheet;
  if (type.includes("pdf")) return FileType;
  return File;
};

const DEFAULT_CATEGORIES = [
  { value: "contracts", labelKey: "documents.contracts" },
  { value: "invoices", labelKey: "documents.invoices" },
  { value: "receipts", labelKey: "documents.receipts" },
  { value: "legal", labelKey: "documents.legal" },
  { value: "financial", labelKey: "documents.financial" },
  { value: "other", labelKey: "documents.other" },
];

export default function Documentos() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const { t, language } = useAppSettings();
  
  const [documents, setDocuments] = useState<Document[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [activeTab, setActiveTab] = useState("upload");
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [customCategories, setCustomCategories] = useState<CustomCategory[]>([]);
  const [newCategoryName, setNewCategoryName] = useState("");
  
  const [newDoc, setNewDoc] = useState({
    name: "",
    file_url: "",
    file_type: "",
    category: "other",
  });

  // Combine default and custom categories
  const categories = [
    ...DEFAULT_CATEGORIES.map(cat => ({
      value: cat.value,
      label: t(cat.labelKey),
      icon: FileText,
      isCustom: false,
    })),
    ...customCategories.map(cat => ({
      value: cat.value,
      label: cat.label,
      icon: File,
      isCustom: true,
    })),
  ];

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      loadDocuments();
      loadCustomCategories();
    }
  }, [user]);

  const loadCustomCategories = () => {
    const saved = localStorage.getItem("document_custom_categories");
    if (saved) {
      setCustomCategories(JSON.parse(saved));
    }
  };

  const saveCustomCategories = (cats: CustomCategory[]) => {
    localStorage.setItem("document_custom_categories", JSON.stringify(cats));
    setCustomCategories(cats);
  };

  const handleAddCategory = () => {
    if (!newCategoryName.trim()) return;
    
    const value = newCategoryName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    if (categories.some(c => c.value === value)) {
      toast({ title: t("documents.categoryExists"), variant: "destructive" });
      return;
    }
    
    const newCat: CustomCategory = {
      value,
      label: newCategoryName.trim(),
    };
    
    saveCustomCategories([...customCategories, newCat]);
    setNewCategoryName("");
    toast({ title: t("documents.categoryAdded") });
  };

  const handleDeleteCategory = (value: string) => {
    saveCustomCategories(customCategories.filter(c => c.value !== value));
    toast({ title: t("common.delete") + " ✓" });
  };

  const loadDocuments = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error("Error loading documents:", error);
      toast({ title: t("common.loading") + " error", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddDocument = async () => {
    if (!newDoc.name) {
      toast({ title: t("documents.name") + " required", variant: "destructive" });
      return;
    }

    try {
      const { data, error } = await supabase
        .from("documents")
        .insert({
          user_id: user!.id,
          name: newDoc.name,
          file_url: newDoc.file_url || null,
          file_type: newDoc.file_type || null,
          category: newDoc.category,
        })
        .select()
        .single();

      if (error) throw error;

      setDocuments([data, ...documents]);
      setNewDoc({ name: "", file_url: "", file_type: "", category: "other" });
      setIsAdding(false);
      toast({ title: t("common.save") + " ✓" });
    } catch (error) {
      console.error("Error adding document:", error);
      toast({ title: "Error", variant: "destructive" });
    }
  };

  const handleUploadComplete = async (filePath: string, fileName: string, fileType: string) => {
    try {
      const { data, error } = await supabase
        .from("documents")
        .insert({
          user_id: user!.id,
          name: fileName,
          file_url: filePath,
          file_type: fileType,
          category: newDoc.category,
        })
        .select()
        .single();

      if (error) throw error;

      setDocuments([data, ...documents]);
      setIsAdding(false);
      toast({ title: t("common.save") + " ✓" });
    } catch (error) {
      console.error("Error saving document:", error);
      toast({ title: "Error", variant: "destructive" });
    }
  };

  const handleOpenDocument = async (filePath: string) => {
    if (filePath.startsWith('http')) {
      window.open(filePath, '_blank');
      return;
    }

    try {
      const { data, error } = await supabase.storage
        .from('documents')
        .createSignedUrl(filePath, 3600);

      if (error) throw error;
      if (data?.signedUrl) {
        window.open(data.signedUrl, '_blank');
      }
    } catch (error) {
      console.error('Error generating signed URL:', error);
      toast({ title: "Error", variant: "destructive" });
    }
  };

  const handleDeleteDocument = async (id: string) => {
    try {
      const { error } = await supabase
        .from("documents")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setDocuments(documents.filter(d => d.id !== id));
      toast({ title: t("common.delete") + " ✓" });
    } catch (error) {
      console.error("Error deleting document:", error);
      toast({ title: "Error", variant: "destructive" });
    }
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === "all" || doc.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const groupedDocuments = categories.reduce((acc, cat) => {
    acc[cat.value] = filteredDocuments.filter(d => d.category === cat.value);
    return acc;
  }, {} as Record<string, Document[]>);

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <AppLayout>
      <div className="space-y-6 w-full max-w-full overflow-hidden box-border">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <span className="truncate">{t("documents.title")}</span>
              </h1>
              <p className="text-xs text-muted-foreground mt-1">
                {documents.length} {t("documents.saved")}
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              {/* Category Manager Button */}
              <Dialog open={showCategoryManager} onOpenChange={setShowCategoryManager}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 px-2.5">
                    <Settings className="w-4 h-4" />
                    <span className="hidden sm:inline sm:ml-1">{t("documents.categories")}</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>{t("documents.manageCategories")}</DialogTitle>
                  </DialogHeader>
                  
                  <div className="space-y-4 mt-4">
                    {/* Add New Category */}
                    <div className="flex gap-2">
                      <Input
                        placeholder={t("documents.newCategoryName")}
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleAddCategory()}
                        className="flex-1"
                      />
                      <Button onClick={handleAddCategory} size="sm">
                        <Plus className="w-4 h-4 mr-1" />
                        {t("common.add")}
                      </Button>
                    </div>
                    
                    {/* Custom Categories List */}
                    <div className="space-y-2">
                      <Label className="text-sm text-muted-foreground">{t("documents.customCategories")}</Label>
                      {customCategories.length === 0 ? (
                        <p className="text-sm text-muted-foreground py-4 text-center">
                          {t("documents.noCustomCategories")}
                        </p>
                      ) : (
                        customCategories.map((cat) => (
                          <div key={cat.value} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                            <div className="flex items-center gap-2">
                              <File className="w-4 h-4 text-muted-foreground" />
                              <span>{cat.label}</span>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleDeleteCategory(cat.value)}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        ))
                      )}
                    </div>
                    
                    {/* Default Categories (read-only) */}
                    <div className="space-y-2">
                      <Label className="text-sm text-muted-foreground">{t("documents.defaultCategories")}</Label>
                      {DEFAULT_CATEGORIES.map((cat) => (
                        <div key={cat.value} className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg opacity-70">
                          <FileText className="w-4 h-4 text-muted-foreground" />
                          <span>{t(cat.labelKey)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              
              {/* Add Document Button */}
              <Dialog open={isAdding} onOpenChange={setIsAdding}>
                <DialogTrigger asChild>
                  <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 shrink-0 h-8 px-2.5">
                    <Plus className="w-4 h-4" />
                    <span className="hidden sm:inline sm:ml-1">{t("documents.add")}</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>{t("documents.addDocument")}</DialogTitle>
                  </DialogHeader>
                  
                  <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="upload" className="gap-2">
                        <Upload className="w-4 h-4" />
                        {t("documents.upload")}
                      </TabsTrigger>
                      <TabsTrigger value="link" className="gap-2">
                        <ExternalLink className="w-4 h-4" />
                        {t("documents.link")}
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="upload" className="space-y-4 mt-4">
                      <div className="space-y-2">
                        <Label>{t("documents.category")}</Label>
                        <Select
                          value={newDoc.category}
                          onValueChange={(v) => setNewDoc({ ...newDoc, category: v })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((cat) => (
                              <SelectItem key={cat.value} value={cat.value}>
                                {cat.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <FileUpload 
                        onUploadComplete={handleUploadComplete}
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                      />
                    </TabsContent>

                    <TabsContent value="link" className="space-y-4 mt-4">
                      <div className="space-y-2">
                        <Label>{t("documents.name")} *</Label>
                        <Input
                          placeholder={t("documents.name")}
                          value={newDoc.name}
                          onChange={(e) => setNewDoc({ ...newDoc, name: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{t("documents.fileUrl")}</Label>
                        <Input
                          placeholder="https://..."
                          value={newDoc.file_url}
                          onChange={(e) => setNewDoc({ ...newDoc, file_url: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{t("documents.category")}</Label>
                        <Select
                          value={newDoc.category}
                          onValueChange={(v) => setNewDoc({ ...newDoc, category: v })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((cat) => (
                              <SelectItem key={cat.value} value={cat.value}>
                                {cat.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Button onClick={handleAddDocument} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                        {t("common.save")}
                      </Button>
                    </TabsContent>
                  </Tabs>
                </DialogContent>
              </Dialog>
            </div>
          </div>
          
          {/* Search and Filter Row */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={t("documents.search")}
                className="pl-10 h-9 text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-full sm:w-[140px] h-9 text-sm">
                <SelectValue placeholder={t("documents.category")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("documents.all")}</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Documents Grid */}
        {filteredDocuments.length === 0 ? (
          <Card className="material-card">
            <CardContent className="py-12 text-center">
              <FolderOpen className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium">{t("documents.noDocuments")}</h3>
              <p className="text-muted-foreground text-sm mt-1">
                {t("documents.clickToAdd")}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((cat) => {
              const catDocs = groupedDocuments[cat.value] || [];
              if (filterCategory !== "all" && filterCategory !== cat.value) return null;
              if (catDocs.length === 0 && filterCategory !== "all") return null;

              const CategoryIcon = cat.icon;

              return (
                <Card key={cat.value} className="material-card">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-blue-500/10">
                        <CategoryIcon className="w-5 h-5 text-blue-500" />
                      </div>
                      <CardTitle className="text-base">{cat.label}</CardTitle>
                      <span className="ml-auto text-sm text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                        {catDocs.length}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {catDocs.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        {t("documents.noDocCategory")}
                      </p>
                    ) : (
                      catDocs.map((doc) => {
                        const IconComponent = getFileIcon(doc.file_type);
                        return (
                          <div
                            key={doc.id}
                            className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors group"
                          >
                            <div className="p-2 rounded-lg bg-background">
                              <IconComponent className="w-4 h-4 text-muted-foreground" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{doc.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(doc.created_at).toLocaleDateString(language)}
                              </p>
                            </div>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              {doc.file_url && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => handleOpenDocument(doc.file_url!)}
                                >
                                  <ExternalLink className="w-4 h-4" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleDeleteDocument(doc.id)}
                              >
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}