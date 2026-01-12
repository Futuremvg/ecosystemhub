import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Building2, Plus, Search, ExternalLink, Link2, 
  DollarSign, Scale, Settings, Megaphone, Users, Layers,
  Loader2, Trash2, ChevronRight, Cog, GitBranch, Share2, Receipt, Briefcase, Star
} from "lucide-react";
import { CompanySettingsPanel } from "@/components/companies/CompanySettingsPanel";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAppSettings } from "@/contexts/AppSettingsContext";
import { CompanyCard } from "@/components/companies/CompanyCard";
import { CompanyDialog } from "@/components/companies/CompanyDialog";
import { CompanySelector } from "@/components/companies/CompanySelector";
import { CompanyDetailsSheet } from "@/components/companies/CompanyDetailsSheet";
import { CompanyTree } from "@/components/companies/CompanyTree";

interface Company {
  id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  company_type: string;
  parent_id: string | null;
}

interface EcosystemCategory {
  id: string;
  name: string;
  icon: string;
  sort_order: number;
  company_id: string | null;
}

interface EcosystemLink {
  id: string;
  category_id: string;
  name: string;
  url: string;
  description: string | null;
  priority: string;
  company_id: string | null;
}

const iconMap: Record<string, React.ComponentType<any>> = {
  DollarSign,
  Scale,
  Settings,
  Megaphone,
  Users,
  Layers,
  Share2,
  Receipt,
  Briefcase,
  Star,
};

const defaultCategories = [
  { name: "Finance & Accounting", icon: "DollarSign" },
  { name: "Legal & Compliance", icon: "Scale" },
  { name: "Admin & Control", icon: "Settings" },
  { name: "Marketing & Sales", icon: "Megaphone" },
  { name: "People & Partners", icon: "Users" },
  { name: "Resources & Support", icon: "Layers" },
];

const defaultLinksByCategory: Record<string, Array<{ name: string; url: string; description: string; priority: string }>> = {
  "Finance & Accounting": [
    { name: "CRA My Business Account", url: "https://www.canada.ca/en/revenue-agency/services/e-services/e-services-businesses/business-account.html", description: "Canada Revenue Agency business portal", priority: "critical" },
    { name: "QuickBooks Canada", url: "https://quickbooks.intuit.com/ca/", description: "Accounting software for Canadian businesses", priority: "critical" },
    { name: "Wave Accounting", url: "https://www.waveapps.com/", description: "Free accounting software (Canadian company)", priority: "high" },
  ],
  "Legal & Compliance": [
    { name: "Ontario Business Registry", url: "https://www.ontario.ca/page/ontario-business-registry", description: "Register and manage Ontario businesses", priority: "critical" },
    { name: "WSIB Ontario", url: "https://www.wsib.ca/", description: "Workplace Safety and Insurance Board", priority: "critical" },
  ],
  "Admin & Control": [
    { name: "Google Workspace", url: "https://workspace.google.com/intl/en_ca/", description: "Email, Drive, Docs, Meet for businesses", priority: "critical" },
    { name: "1Password Business", url: "https://1password.com/business/", description: "Password management (Canadian company)", priority: "high" },
  ],
  "Marketing & Sales": [
    { name: "Shopify", url: "https://www.shopify.com/ca", description: "E-commerce platform (Canadian company)", priority: "critical" },
    { name: "Google Ads", url: "https://ads.google.com/intl/en_ca/home/", description: "Google and YouTube advertising", priority: "high" },
  ],
  "People & Partners": [
    { name: "Indeed Canada", url: "https://ca.indeed.com/hire", description: "Job posting and recruitment", priority: "high" },
    { name: "Humi", url: "https://www.humi.ca/", description: "Canadian HR, payroll & benefits platform", priority: "medium" },
  ],
  "Resources & Support": [
    { name: "Canada Business Network", url: "https://www.canada.ca/en/services/business.html", description: "Federal business resources and support", priority: "high" },
    { name: "BDC", url: "https://www.bdc.ca/en", description: "Business Development Bank of Canada", priority: "high" },
  ],
};

const priorityConfig = {
  critical: { label: "Crítico", color: "bg-red-500/10 text-red-500 border-red-500/20" },
  high: { label: "Alto", color: "bg-orange-500/10 text-orange-500 border-orange-500/20" },
  medium: { label: "Médio", color: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" },
  low: { label: "Baixo", color: "bg-green-500/10 text-green-500 border-green-500/20" },
};

export default function Empresas() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const { t } = useAppSettings();
  
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompanyState] = useState<Company | null>(null);
  
  const setSelectedCompany = (company: Company | null) => {
    setSelectedCompanyState(company);
  };
  const [categories, setCategories] = useState<EcosystemCategory[]>([]);
  const [links, setLinks] = useState<EcosystemLink[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("companies");
  
  // Dialogs
  const [isAddingLink, setIsAddingLink] = useState(false);
  const [isCompanyDialogOpen, setIsCompanyDialogOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [isCompanyDetailsOpen, setIsCompanyDetailsOpen] = useState(false);
  const [newCompanyParentId, setNewCompanyParentId] = useState<string | null>(null);
  
  const [newLink, setNewLink] = useState({
    name: "",
    url: "",
    description: "",
    priority: "medium" as const,
    category_id: "",
  });

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Load companies
      const { data: companiesData, error: companiesError } = await supabase
        .from("companies")
        .select("*")
        .order("created_at");
      
      if (companiesError) throw companiesError;
      setCompanies(companiesData || []);

      // Load categories
      let { data: cats, error: catsError } = await supabase
        .from("ecosystem_categories")
        .select("*")
        .order("sort_order");

      if (catsError) throw catsError;

      if (!cats || cats.length === 0) {
        const { data: newCats, error: createError } = await supabase
          .from("ecosystem_categories")
          .insert(
            defaultCategories.map((c, i) => ({
              user_id: user!.id,
              name: c.name,
              icon: c.icon,
              sort_order: i,
            }))
          )
          .select();

        if (createError) throw createError;
        cats = newCats || [];
        setCategories(cats);

        const linksToInsert: Array<{
          user_id: string;
          category_id: string;
          name: string;
          url: string;
          description: string;
          priority: string;
        }> = [];

        for (const cat of cats) {
          const categoryLinks = defaultLinksByCategory[cat.name];
          if (categoryLinks) {
            for (const link of categoryLinks) {
              linksToInsert.push({
                user_id: user!.id,
                category_id: cat.id,
                name: link.name,
                url: link.url,
                description: link.description,
                priority: link.priority,
              });
            }
          }
        }

        if (linksToInsert.length > 0) {
          const { data: newLinks, error: linksError } = await supabase
            .from("ecosystem_links")
            .insert(linksToInsert)
            .select();

          if (linksError) throw linksError;
          setLinks(newLinks || []);
        }
      } else {
        setCategories(cats);
        
        const { data: lnks, error: lnksError } = await supabase
          .from("ecosystem_links")
          .select("*");

        if (lnksError) throw lnksError;
        setLinks(lnks || []);
      }
    } catch (error) {
      console.error("Error loading data:", error);
      toast({
        title: t("common.loading") + " error",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveCompany = async (data: {
    name: string;
    description: string;
    logo_url: string;
    company_type: string;
    parent_id: string | null;
  }) => {
    try {
      if (editingCompany) {
        const { error } = await supabase
          .from("companies")
          .update(data)
          .eq("id", editingCompany.id);
        
        if (error) throw error;
        setCompanies(companies.map(c => 
          c.id === editingCompany.id ? { ...c, ...data } : c
        ));
        toast({ title: t("toast.companyUpdated") });
      } else {
        const { data: newCompany, error } = await supabase
          .from("companies")
          .insert({ user_id: user!.id, ...data })
          .select()
          .single();
        
        if (error) throw error;
        setCompanies([...companies, newCompany]);
        toast({ title: t("toast.companyCreated") });
      }
      
      setIsCompanyDialogOpen(false);
      setEditingCompany(null);
    } catch (error) {
      console.error("Error saving company:", error);
      toast({ title: t("toast.errorSaving"), variant: "destructive" });
    }
  };

  const handleDeleteCompany = async (company: Company) => {
    try {
      const { error } = await supabase
        .from("companies")
        .delete()
        .eq("id", company.id);
      
      if (error) throw error;
      setCompanies(companies.filter(c => c.id !== company.id));
      if (selectedCompany?.id === company.id) {
        setSelectedCompany(null);
      }
      toast({ title: t("toast.companyRemoved") });
    } catch (error) {
      console.error("Error deleting company:", error);
      toast({ title: t("toast.errorRemoving"), variant: "destructive" });
    }
  };

  const handleAddLink = async () => {
    if (!newLink.name || !newLink.url || !newLink.category_id) {
      toast({
        title: t("toast.fillRequired"),
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from("ecosystem_links")
        .insert({
          user_id: user!.id,
          ...newLink,
          company_id: selectedCompany?.id || null,
        })
        .select()
        .single();

      if (error) throw error;

      setLinks([...links, data]);
      setNewLink({ name: "", url: "", description: "", priority: "medium", category_id: "" });
      setIsAddingLink(false);
      toast({ title: t("toast.linkAdded") });
    } catch (error) {
      console.error("Error adding link:", error);
      toast({ title: t("toast.errorAdding"), variant: "destructive" });
    }
  };

  const handleDeleteLink = async (id: string) => {
    try {
      const { error } = await supabase
        .from("ecosystem_links")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setLinks(links.filter(l => l.id !== id));
      toast({ title: t("toast.linkRemoved") });
    } catch (error) {
      console.error("Error deleting link:", error);
      toast({ title: t("toast.errorRemoving"), variant: "destructive" });
    }
  };

  // Filter links - only show links that belong to the selected company OR have no company (global)
  // Avoid showing parent/child company links mixed together
  const filteredLinks = links.filter(link => {
    const matchesSearch = link.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      link.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Only show links that specifically belong to this company, or global links (no company_id)
    // Do NOT inherit links from parent companies to avoid duplication
    const matchesCompany = selectedCompany 
      ? link.company_id === selectedCompany.id || link.company_id === null
      : link.company_id === null; // When no company selected, only show global links
    
    return matchesSearch && matchesCompany;
  }).filter((link, index, self) => 
    // Remove duplicates based on URL (same URL = same link, regardless of category)
    index === self.findIndex(l => l.url === link.url)
  );

  const getLinksByCategory = (categoryId: string) =>
    filteredLinks
      .filter(link => link.category_id === categoryId)
      .sort((a, b) => {
        const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        return (priorityOrder[a.priority as keyof typeof priorityOrder] || 2) - 
               (priorityOrder[b.priority as keyof typeof priorityOrder] || 2);
      });

  const hubCompanies = companies.filter(c => c.company_type === "hub");
  const getSatelliteCount = (hubId: string) => 
    companies.filter(c => c.parent_id === hubId).length;

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  const totalLinks = links.length;
  const criticalLinks = links.filter(l => l.priority === "critical").length;

  return (
    <AppLayout>
      <div className="space-y-6 w-full">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Building2 className="w-5 h-5 text-primary" />
                </div>
                <span className="truncate">{t("ecosystem.title")}</span>
              </h1>
              <p className="text-xs text-muted-foreground mt-1">
                {companies.length} {t("ecosystem.companies").toLowerCase()} • {totalLinks} links
              </p>
            </div>
            <CompanySelector
              companies={companies}
              selectedCompany={selectedCompany}
              onSelect={setSelectedCompany}
              className="w-40 sm:w-48 shrink-0"
            />
          </div>
        </div>

        {/* Tabs - Stable layout */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full grid grid-cols-3 h-10">
            <TabsTrigger value="companies" className="text-xs sm:text-sm py-2 gap-1">
              <Building2 className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline truncate">{t("ecosystem.companies")}</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="text-xs sm:text-sm py-2 gap-1">
              <Cog className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline truncate">{t("common.settings")}</span>
            </TabsTrigger>
            <TabsTrigger value="links" className="text-xs sm:text-sm py-2 gap-1">
              <Link2 className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline truncate">Links</span>
            </TabsTrigger>
          </TabsList>

          {/* Companies Tab */}
          <TabsContent value="companies" className="mt-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <GitBranch className="w-4 h-4 sm:w-5 sm:h-5 text-primary shrink-0" />
                  <h2 className="text-sm sm:text-lg font-semibold truncate">{t("ecosystem.companies")}</h2>
                </div>
                <Button 
                  size="sm"
                  onClick={() => {
                    setEditingCompany(null);
                    setIsCompanyDialogOpen(true);
                  }}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 shrink-0 text-xs h-8 px-2.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline sm:ml-1">{t("common.add")}</span>
                </Button>
              </div>

              {companies.length === 0 ? (
                <Card className="p-4 sm:p-8 text-center">
                  <Building2 className="w-8 h-8 sm:w-12 sm:h-12 mx-auto text-muted-foreground mb-3" />
                  <h3 className="font-medium mb-2 text-sm">{t("common.noResults")}</h3>
                  <p className="text-xs text-muted-foreground mb-4">
                    {t("ecosystem.companies")}
                  </p>
                  <Button 
                    size="sm"
                    onClick={() => setIsCompanyDialogOpen(true)}
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    {t("common.add")}
                  </Button>
                </Card>
              ) : (
                <Card className="material-card p-4 sm:p-6">
                  <CompanyTree
                    companies={companies}
                    selectedCompanyId={selectedCompany?.id}
                    onSelect={(c) => {
                      setSelectedCompany(c);
                      setIsCompanyDetailsOpen(true);
                    }}
                    onAddChild={(parentId) => {
                      setEditingCompany(null);
                      // Pre-fill parent and type
                      setNewCompanyParentId(parentId);
                      setIsCompanyDialogOpen(true);
                    }}
                  />
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="mt-4">
            <CompanySettingsPanel 
              companyId={selectedCompany?.id || null}
              userId={user.id}
            />
          </TabsContent>

          {/* Links Tab */}
          <TabsContent value="links" className="mt-4">
            <div className="space-y-4">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder={t("common.search") + " links..."}
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                
                <Dialog open={isAddingLink} onOpenChange={setIsAddingLink}>
                  <DialogTrigger asChild>
                    <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                      <Plus className="w-4 h-4 mr-2" />
                      {t("common.add")}
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{t("common.add")} Link</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                      <div className="space-y-2">
                        <Label>{t("ecosystem.name")} *</Label>
                        <Input
                          placeholder="Ex: QuickBooks Canada"
                          value={newLink.name}
                          onChange={(e) => setNewLink({ ...newLink, name: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>URL *</Label>
                        <Input
                          placeholder="https://..."
                          value={newLink.url}
                          onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{t("documents.category")} *</Label>
                        <Select
                          value={newLink.category_id}
                          onValueChange={(v) => setNewLink({ ...newLink, category_id: v })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={t("common.search") + "..."} />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((cat) => (
                              <SelectItem key={cat.id} value={cat.id}>
                                {cat.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>{t("priority.medium")}</Label>
                        <Select
                          value={newLink.priority}
                          onValueChange={(v: any) => setNewLink({ ...newLink, priority: v })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="critical">🔴 {t("priority.critical")}</SelectItem>
                            <SelectItem value="high">🟠 {t("priority.high")}</SelectItem>
                            <SelectItem value="medium">🟡 {t("priority.medium")}</SelectItem>
                            <SelectItem value="low">🟢 {t("priority.low")}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>{t("company.about")}</Label>
                        <Textarea
                          placeholder={t("company.aboutPlaceholder")}
                          value={newLink.description}
                          onChange={(e) => setNewLink({ ...newLink, description: e.target.value })}
                        />
                      </div>
                      <Button onClick={handleAddLink} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                        {t("common.add")} Link
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Links List - Clean and compact */}
              <div className="space-y-2">
                {filteredLinks.length === 0 ? (
                  <div className="text-center py-8">
                    <Link2 className="w-10 h-10 mx-auto text-muted-foreground/30 mb-2" />
                    <p className="text-sm text-muted-foreground">{t("ecosystem.noLinks")}</p>
                  </div>
                ) : (
                  filteredLinks.map((link) => {
                    const category = categories.find(c => c.id === link.category_id);
                    const IconComponent = category ? iconMap[category.icon] || Link2 : Link2;
                    const priority = priorityConfig[link.priority as keyof typeof priorityConfig] || priorityConfig.medium;
                    
                    return (
                      <div
                        key={link.id}
                        className="flex items-center gap-3 p-3 rounded-lg border border-border/50 bg-card hover:bg-secondary/30 transition-colors group"
                      >
                        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <IconComponent className="w-4 h-4 text-primary" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <a
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-medium text-sm hover:text-primary transition-colors truncate"
                            >
                              {link.name}
                            </a>
                            <ExternalLink className="w-3 h-3 text-muted-foreground shrink-0" />
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            {category && (
                              <span className="text-xs text-muted-foreground truncate">
                                {category.name}
                              </span>
                            )}
                            {link.description && (
                              <>
                                <span className="text-muted-foreground/50">•</span>
                                <span className="text-xs text-muted-foreground truncate">
                                  {link.description}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                        
                        <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0.5 shrink-0", priority.color)}>
                          {t(`priority.${link.priority}`)}
                        </Badge>
                        
                        <Button
                          variant="ghost"
                          size="icon"
                          className="opacity-0 group-hover:opacity-100 h-7 w-7 shrink-0"
                          onClick={() => handleDeleteLink(link.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5 text-destructive" />
                        </Button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Company Dialog */}
        <CompanyDialog
          open={isCompanyDialogOpen}
          onOpenChange={(open) => {
            setIsCompanyDialogOpen(open);
            if (!open) setNewCompanyParentId(null);
          }}
          company={editingCompany}
          allCompanies={companies}
          defaultParentId={newCompanyParentId}
          onSave={handleSaveCompany}
        />

        {/* Company Details Sheet */}
        <CompanyDetailsSheet
          company={selectedCompany}
          isOpen={isCompanyDetailsOpen}
          onClose={() => setIsCompanyDetailsOpen(false)}
          onSave={handleSaveCompany}
          onDelete={handleDeleteCompany}
          userId={user.id}
        />
      </div>
    </AppLayout>
  );
}
