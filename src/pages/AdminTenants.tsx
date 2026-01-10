import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import { useTenant } from "@/contexts/TenantContext";
import { useAppSettings } from "@/contexts/AppSettingsContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Loader2, Plus, Building2, Globe, Users, Trash2, Edit, 
  ExternalLink, Check, X, Search, Copy, Share2, Mail, MessageCircle,
  Rocket, CheckCircle2, ArrowRight, Phone, FileText
} from "lucide-react";
import { ClientPDFGenerator } from "@/components/admin/ClientPDFGenerator";
import { cn } from "@/lib/utils";
import { useIsMobile, useIsMobileOrTablet } from "@/hooks/use-mobile";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Tenant {
  id: string;
  name: string;
  slug: string;
  custom_domain: string | null;
  logo_url: string | null;
  primary_color: string | null;
  owner_name: string | null;
  owner_email: string | null;
  phone: string | null;
  business_type: string | null;
  is_active: boolean;
  created_at: string;
}

const getBusinessTypes = (t: (key: string) => string) => [
  { value: "cleaning", label: `🧹 ${t("admin.cleaning")}` },
  { value: "restaurant", label: `🍽️ ${t("admin.restaurant")}` },
  { value: "construction", label: `🏗️ ${t("admin.construction")}` },
  { value: "retail", label: `🛍️ ${t("admin.retail")}` },
  { value: "tech", label: `💻 ${t("admin.tech")}` },
  { value: "health", label: `🏥 ${t("admin.health")}` },
  { value: "education", label: `📚 ${t("admin.education")}` },
  { value: "other", label: `🏢 ${t("admin.other")}` },
];

export default function AdminTenants() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isSuperAdmin, isLoading: tenantLoading } = useTenant();
  const { t } = useAppSettings();
  const isMobile = useIsMobile();
  const isMobileOrTablet = useIsMobileOrTablet();
  const businessTypes = getBusinessTypes(t);
  
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [remixGuide, setRemixGuide] = useState<Tenant | null>(null);
  const [pdfTenant, setPdfTenant] = useState<Tenant | null>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    custom_domain: "",
    owner_name: "",
    owner_email: "",
    phone: "",
    business_type: "",
    primary_color: "#d4af37",
    logo_url: "",
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!tenantLoading && !isSuperAdmin && user) {
      toast.error(t("admin.accessDenied"));
      navigate("/");
    }
  }, [isSuperAdmin, tenantLoading, navigate, user, t]);

  useEffect(() => {
    if (isSuperAdmin) {
      loadTenants();
    }
  }, [isSuperAdmin]);

  const loadTenants = async () => {
    try {
      const { data, error } = await supabase
        .from("tenants")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      setTenants(data || []);
    } catch (error) {
      console.error("Error loading tenants:", error);
      toast.error(t("admin.errorLoading"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenDialog = (tenant?: Tenant) => {
    if (tenant) {
      setEditingTenant(tenant);
      setFormData({
        name: tenant.name,
        slug: tenant.slug,
        custom_domain: tenant.custom_domain || "",
        owner_name: tenant.owner_name || "",
        owner_email: tenant.owner_email || "",
        phone: tenant.phone || "",
        business_type: tenant.business_type || "",
        primary_color: tenant.primary_color || "#d4af37",
        logo_url: tenant.logo_url || "",
      });
    } else {
      setEditingTenant(null);
      setFormData({
        name: "",
        slug: "",
        custom_domain: "",
        owner_name: "",
        owner_email: "",
        phone: "",
        business_type: "",
        primary_color: "#d4af37",
        logo_url: "",
      });
    }
    setShowDialog(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.slug) {
      toast.error(t("admin.requiredFields"));
      return;
    }

    setIsSaving(true);
    try {
      const tenantData = {
        name: formData.name,
        slug: formData.slug.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
        custom_domain: formData.custom_domain || null,
        owner_name: formData.owner_name || null,
        owner_email: formData.owner_email || null,
        phone: formData.phone || null,
        business_type: formData.business_type || null,
        primary_color: formData.primary_color,
        logo_url: formData.logo_url || null,
      };

      if (editingTenant) {
        const { error } = await supabase
          .from("tenants")
          .update(tenantData)
          .eq("id", editingTenant.id);
        
        if (error) throw error;
        toast.success(t("admin.tenantUpdated"));
      } else {
        const { error } = await supabase
          .from("tenants")
          .insert(tenantData);
        
        if (error) throw error;
        toast.success(t("admin.tenantCreated"));
      }

      setShowDialog(false);
      loadTenants();
    } catch (error: any) {
      console.error("Error saving tenant:", error);
      if (error.code === "23505") {
        toast.error(t("admin.slugExists"));
      } else {
        toast.error(t("admin.errorSaving"));
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("tenants")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
      toast.success(t("admin.tenantRemoved"));
      setDeleteConfirm(null);
      loadTenants();
    } catch (error) {
      console.error("Error deleting tenant:", error);
      toast.error(t("admin.errorDeleting"));
    }
  };

  const handleToggleActive = async (tenant: Tenant) => {
    try {
      const { error } = await supabase
        .from("tenants")
        .update({ is_active: !tenant.is_active })
        .eq("id", tenant.id);
      
      if (error) throw error;
      toast.success(tenant.is_active ? t("admin.tenantDeactivated") : t("admin.tenantActivated"));
      loadTenants();
    } catch (error) {
      console.error("Error toggling tenant:", error);
      toast.error(t("admin.errorUpdating"));
    }
  };

  // Generate invite link for a tenant
  const getInviteLink = (tenant: Tenant) => {
    const baseUrl = window.location.origin;
    if (tenant.custom_domain) {
      return `https://${tenant.custom_domain}/auth?invite=${tenant.slug}`;
    }
    return `${baseUrl}/auth?tenant=${tenant.slug}`;
  };

  const handleCopyLink = async (tenant: Tenant) => {
    const link = getInviteLink(tenant);
    await navigator.clipboard.writeText(link);
    toast.success(t("admin.linkCopied"));
  };

  const handleShareWhatsApp = (tenant: Tenant) => {
    const link = getInviteLink(tenant);
    const message = encodeURIComponent(
      `Olá ${tenant.owner_name || ""}! 👋\n\nSeu acesso ao sistema de gestão está pronto:\n\n🔗 ${link}\n\nQualquer dúvida, estou à disposição!`
    );
    const phoneNumber = tenant.phone?.replace(/\D/g, "") || "";
    window.open(`https://wa.me/${phoneNumber}?text=${message}`, "_blank");
  };

  // Copy remix guide info to clipboard
  const handleCopyRemixInfo = async (tenant: Tenant) => {
    const info = `📋 DADOS PARA REMIX - ${tenant.name}

👤 Cliente: ${tenant.owner_name || "N/A"}
📧 Email: ${tenant.owner_email || "N/A"}
📱 Telefone: ${tenant.phone || "N/A"}
🌐 Domínio: ${tenant.custom_domain || "N/A"}
🏷️ Slug: ${tenant.slug}
🎨 Cor: ${tenant.primary_color || "#d4af37"}

📝 CHECKLIST:
□ 1. Fazer Remix do projeto
□ 2. Ativar Lovable Cloud
□ 3. Personalizar cores/logo
□ 4. Configurar domínio: ${tenant.custom_domain || tenant.slug + ".lovable.app"}
□ 5. Transferir para: ${tenant.owner_email || "email do cliente"}`;
    
    await navigator.clipboard.writeText(info);
    toast.success(t("admin.infoCopied"));
  };

  const handleShareEmail = (tenant: Tenant) => {
    const link = getInviteLink(tenant);
    const subject = encodeURIComponent(`Acesso ao Sistema - ${tenant.name}`);
    const body = encodeURIComponent(
      `Olá ${tenant.owner_name || ""}!\n\nSeu acesso ao sistema de gestão está pronto.\n\nAcesse através do link:\n${link}\n\nQualquer dúvida, estou à disposição!`
    );
    window.open(`mailto:${tenant.owner_email || ""}?subject=${subject}&body=${body}`, "_blank");
  };

  const filteredTenants = tenants.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.owner_email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (authLoading || tenantLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isSuperAdmin) return null;

  return (
    <AppLayout>
      <div className="space-y-6 w-full max-w-full overflow-hidden box-border">
        {/* Header */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">{t("admin.tenants")}</h1>
            <p className="text-muted-foreground text-sm truncate">
              {t("admin.tenantsDesc")}
            </p>
          </div>
          <Button onClick={() => handleOpenDialog()} size="sm" className="gap-2 shrink-0">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">{t("admin.newTenant")}</span>
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={t("admin.searchTenants")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="material-card">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-primary">{tenants.length}</p>
              <p className="text-xs text-muted-foreground">{t("admin.totalTenants")}</p>
            </CardContent>
          </Card>
          <Card className="material-card">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-financial-positive">
                {tenants.filter(tn => tn.is_active).length}
              </p>
              <p className="text-xs text-muted-foreground">{t("admin.active")}</p>
            </CardContent>
          </Card>
          <Card className="material-card">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-muted-foreground">
                {tenants.filter(tn => !tn.is_active).length}
              </p>
              <p className="text-xs text-muted-foreground">{t("admin.inactive")}</p>
            </CardContent>
          </Card>
        </div>

        {/* Tenants List - Cards for Mobile/Tablet, Table for Desktop */}
        {isMobileOrTablet ? (
          /* Mobile/Tablet: Card-based layout */
          <div className="space-y-3">
            {filteredTenants.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">
                  {searchTerm ? t("admin.noTenantFound") : t("admin.noTenantRegistered")}
                </p>
              </Card>
            ) : (
              filteredTenants.map((tenant) => (
                <Card key={tenant.id} className="material-card p-4">
                  <div className="space-y-3">
                    {/* Header: Logo + Name */}
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm shrink-0"
                        style={{ backgroundColor: tenant.primary_color || "#d4af37" }}
                      >
                        {tenant.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{tenant.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{tenant.slug}</p>
                      </div>
                      <Badge 
                        variant={tenant.is_active ? "default" : "secondary"}
                        className={cn(
                          "text-xs shrink-0",
                          tenant.is_active 
                            ? "bg-financial-positive/20 text-financial-positive border-financial-positive/30" 
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        {tenant.is_active ? t("admin.activeStatus") : t("admin.inactiveStatus")}
                      </Badge>
                    </div>

                    {/* Info */}
                    <div className="text-xs space-y-1 text-muted-foreground">
                      {tenant.owner_name && (
                        <p className="flex items-center gap-1.5">
                          <Users className="w-3 h-3" />
                          {tenant.owner_name}
                        </p>
                      )}
                      {tenant.owner_email && (
                        <p className="flex items-center gap-1.5">
                          <Mail className="w-3 h-3" />
                          {tenant.owner_email}
                        </p>
                      )}
                      {tenant.custom_domain && (
                        <p className="flex items-center gap-1.5">
                          <Globe className="w-3 h-3" />
                          {tenant.custom_domain}
                        </p>
                      )}
                    </div>

                    {/* Share Actions - grid layout */}
                    <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-border">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCopyLink(tenant)}
                        className="h-8 gap-1.5 text-xs"
                      >
                        <Copy className="w-3 h-3" />
                        <span className="hidden sm:inline">Link</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleShareWhatsApp(tenant)}
                        className="h-8 gap-1.5 text-xs text-green-600"
                      >
                        <MessageCircle className="w-3 h-3" />
                        <span className="hidden sm:inline">WhatsApp</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleShareEmail(tenant)}
                        className="h-8 gap-1.5 text-xs text-blue-600"
                      >
                        <Mail className="w-3 h-3" />
                        <span className="hidden sm:inline">Email</span>
                      </Button>
                    </div>

                    {/* Actions - grid layout for better responsiveness */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setRemixGuide(tenant)}
                        className="h-8 gap-1.5 text-xs text-primary"
                      >
                        <Rocket className="w-3 h-3" />
                        Remix
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPdfTenant(tenant)}
                        className="h-8 gap-1.5 text-xs text-orange-600"
                      >
                        <FileText className="w-3 h-3" />
                        PDF
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenDialog(tenant)}
                        className="h-8 gap-1.5 text-xs"
                      >
                        <Edit className="w-3 h-3" />
                        {t("common.edit")}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleActive(tenant)}
                        className="h-8 gap-1.5 text-xs"
                      >
                        {tenant.is_active ? (
                          <>
                            <X className="w-3 h-3 text-financial-negative" />
                            <span className="truncate">{t("admin.deactivate")}</span>
                          </>
                        ) : (
                          <>
                            <Check className="w-3 h-3 text-financial-positive" />
                            <span className="truncate">{t("admin.activate")}</span>
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDeleteConfirm(tenant.id)}
                        className="h-8 gap-1.5 text-xs text-financial-negative col-span-2 sm:col-span-1"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span className="sm:hidden">{t("common.delete")}</span>
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        ) : (
          /* Desktop: Table layout */
          <Card className="material-card overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("admin.tenant")}</TableHead>
                  <TableHead>{t("admin.domain")}</TableHead>
                  <TableHead>{t("admin.owner")}</TableHead>
                  <TableHead>{t("admin.status")}</TableHead>
                  <TableHead>{t("admin.share")}</TableHead>
                  <TableHead className="text-right">{t("admin.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTenants.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      {searchTerm ? t("admin.noTenantFound") : t("admin.noTenantRegistered")}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTenants.map((tenant) => (
                    <TableRow key={tenant.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm shrink-0"
                            style={{ backgroundColor: tenant.primary_color || "#d4af37" }}
                          >
                            {tenant.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{tenant.name}</p>
                            <p className="text-xs text-muted-foreground">{tenant.slug}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {tenant.custom_domain ? (
                          <div className="flex items-center gap-1">
                            <Globe className="w-3 h-3" />
                            <span className="text-sm">{tenant.custom_domain}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm">{tenant.owner_name || "-"}</p>
                          <p className="text-xs text-muted-foreground">{tenant.owner_email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={tenant.is_active ? "default" : "secondary"}
                          className={cn(
                            "text-xs",
                            tenant.is_active 
                              ? "bg-financial-positive/20 text-financial-positive border-financial-positive/30" 
                              : "bg-muted text-muted-foreground"
                          )}
                        >
                          {tenant.is_active ? t("admin.activeStatus") : t("admin.inactiveStatus")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleCopyLink(tenant)}
                            className="h-8 w-8"
                            title="Copiar link"
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleShareWhatsApp(tenant)}
                            className="h-8 w-8 text-green-500"
                            title="Enviar por WhatsApp"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleShareEmail(tenant)}
                            className="h-8 w-8 text-blue-500"
                            title="Enviar por Email"
                          >
                            <Mail className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setPdfTenant(tenant)}
                            className="h-8 w-8 text-orange-500"
                            title="Gerar PDF"
                          >
                            <FileText className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setRemixGuide(tenant)}
                            className="h-8 gap-1.5 text-primary border-primary/30 bg-primary/10 hover:bg-primary/20"
                            title="Guia Remix"
                          >
                            <Rocket className="w-3.5 h-3.5" />
                            <span className="text-xs">Remix</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleToggleActive(tenant)}
                            className="h-8 w-8"
                          >
                            {tenant.is_active ? (
                              <X className="w-4 h-4 text-financial-negative" />
                            ) : (
                              <Check className="w-4 h-4 text-financial-positive" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenDialog(tenant)}
                            className="h-8 w-8"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteConfirm(tenant.id)}
                            className="h-8 w-8 text-financial-negative"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="bg-card border-border max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingTenant ? t("admin.editTenant") : t("admin.createTenant")}
            </DialogTitle>
            <DialogDescription>
              {editingTenant 
                ? t("admin.updateInfo") 
                : t("admin.fillData")}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">{t("admin.name")} *</Label>
                <Input
                  id="name"
                  placeholder="Empresa ABC"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">{t("admin.slug")} *</Label>
                <Input
                  id="slug"
                  placeholder="empresa-abc"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="custom_domain">{t("admin.customDomain")}</Label>
              <Input
                id="custom_domain"
                placeholder="empresa.com (opcional)"
                value={formData.custom_domain}
                onChange={(e) => setFormData({ ...formData, custom_domain: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="owner_name">{t("admin.ownerName")}</Label>
                <Input
                  id="owner_name"
                  placeholder="João Silva"
                  value={formData.owner_name}
                  onChange={(e) => setFormData({ ...formData, owner_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="owner_email">{t("admin.email")}</Label>
                <Input
                  id="owner_email"
                  type="email"
                  placeholder="joao@empresa.com"
                  value={formData.owner_email}
                  onChange={(e) => setFormData({ ...formData, owner_email: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">{t("admin.phoneWhatsApp")}</Label>
              <Input
                id="phone"
                placeholder="+55 11 99999-9999"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="business_type">{t("admin.businessType")}</Label>
                <Select 
                  value={formData.business_type} 
                  onValueChange={(value) => setFormData({ ...formData, business_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("settings.selectPlaceholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    {businessTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="primary_color">{t("admin.primaryColor")}</Label>
                <div className="flex gap-2">
                  <Input
                    id="primary_color"
                    type="color"
                    value={formData.primary_color}
                    onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                    className="w-12 h-10 p-1 cursor-pointer"
                  />
                  <Input
                    value={formData.primary_color}
                    onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                    className="flex-1"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="logo_url">{t("admin.logoUrl")}</Label>
              <Input
                id="logo_url"
                placeholder="https://..."
                value={formData.logo_url}
                onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              {t("common.cancel")}
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editingTenant ? t("common.save") : t("admin.createTenant")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>{t("admin.confirmDelete")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("admin.deleteWarning")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
              className="bg-financial-negative text-white hover:bg-financial-negative/90"
            >
              {t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Remix Guide Modal */}
      <Dialog open={!!remixGuide} onOpenChange={() => setRemixGuide(null)}>
        <DialogContent className="bg-card border-border max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Rocket className="w-5 h-5 text-primary" />
              {t("admin.remixGuideTitle")} - {remixGuide?.name}
            </DialogTitle>
            <DialogDescription>
              {t("admin.remixGuideDesc")}
            </DialogDescription>
          </DialogHeader>
          
          {remixGuide && (
            <div className="space-y-6">
              {/* Client Info Card */}
              <Card className="bg-muted/50 border-border">
                <CardContent className="p-4 space-y-3">
                  <h4 className="font-semibold text-sm text-muted-foreground">{t("admin.clientData")}</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-primary" />
                      <span>{remixGuide.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-primary" />
                      <span>{remixGuide.owner_email || "N/A"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-primary" />
                      <span>{remixGuide.phone || "N/A"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-primary" />
                      <span>{remixGuide.custom_domain || remixGuide.slug + ".lovable.app"}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Steps */}
              <div className="space-y-3">
                <h4 className="font-semibold text-sm text-muted-foreground">{t("admin.stepByStep")}</h4>
                
                <div className="space-y-2">
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0">1</div>
                    <div className="flex-1">
                      <p className="font-medium">{t("admin.step1Title")}</p>
                      <p className="text-sm text-muted-foreground">{t("admin.step1Desc")}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0">2</div>
                    <div className="flex-1">
                      <p className="font-medium">{t("admin.step2Title")}</p>
                      <p className="text-sm text-muted-foreground">{t("admin.step2Desc")}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0">3</div>
                    <div className="flex-1">
                      <p className="font-medium">{t("admin.step3Title")}</p>
                      <p className="text-sm text-muted-foreground">
                        {t("admin.step3Desc")}{" "}
                        <span 
                          className="inline-block w-4 h-4 rounded align-middle mx-1" 
                          style={{ backgroundColor: remixGuide.primary_color || "#d4af37" }}
                        />
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0">4</div>
                    <div className="flex-1">
                      <p className="font-medium">{t("admin.step4Title")}</p>
                      <p className="text-sm text-muted-foreground">
                        {t("admin.step4Desc")}: <code className="bg-muted px-1 rounded">{remixGuide.custom_domain || remixGuide.slug + ".lovable.app"}</code>
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0">5</div>
                    <div className="flex-1">
                      <p className="font-medium">{t("admin.step5Title")}</p>
                      <p className="text-sm text-muted-foreground">
                        {t("admin.step5Desc")}: <code className="bg-muted px-1 rounded">{remixGuide.owner_email || "email"}</code>
                      </p>
                    </div>
                    <CheckCircle2 className="w-4 h-4 text-financial-positive" />
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button 
              variant="outline" 
              onClick={() => remixGuide && handleCopyRemixInfo(remixGuide)}
              className="gap-2"
            >
              <Copy className="w-4 h-4" />
              {t("admin.copyChecklist")}
            </Button>
            <Button onClick={() => setRemixGuide(null)}>
              {t("admin.close")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* PDF Generator Modal */}
      {pdfTenant && (
        <ClientPDFGenerator
          tenant={pdfTenant}
          open={!!pdfTenant}
          onOpenChange={(open) => !open && setPdfTenant(null)}
        />
      )}
    </AppLayout>
  );
}
