import { useState, useEffect, useRef } from "react";
import { Building2, Edit2, X, Save, Trash2, Users, Briefcase, FileText, DollarSign, Lightbulb, ExternalLink, Link2, Image, Upload, Camera, Loader2 } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { CompanySettingsPanel } from "./CompanySettingsPanel";
import { CompanyLinksManager } from "./CompanyLinksManager";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAppSettings } from "@/contexts/AppSettingsContext";
import { toast } from "sonner";

interface Company {
  id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  company_type: string;
  parent_id: string | null;
}

interface CompanyDetailsSheetProps {
  company: Company | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    name: string;
    description: string;
    logo_url: string;
    company_type: string;
    parent_id: string | null;
  }) => void;
  onDelete: (company: Company) => void;
  userId: string;
}

interface CompanyStats {
  employees: number;
  clients: number;
  providers: number;
  documents: number;
}

export function CompanyDetailsSheet({
  company,
  isOpen,
  onClose,
  onSave,
  onDelete,
  userId,
}: CompanyDetailsSheetProps) {
  const { t } = useAppSettings();
  const [isEditing, setIsEditing] = useState(false);
  const [stats, setStats] = useState<CompanyStats>({ employees: 0, clients: 0, providers: 0, documents: 0 });
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [editData, setEditData] = useState({
    name: "",
    description: "",
    logo_url: "",
    website: "",
    email: "",
    phone: "",
    address: "",
    cover_image: "",
    services: "",
  });

  useEffect(() => {
    if (company && isOpen) {
      loadStats();
    }
  }, [company, isOpen]);

  const loadStats = async () => {
    if (!company) return;
    
    const [employeesRes, clientsRes, providersRes, documentsRes] = await Promise.all([
      supabase.from("company_employees").select("id", { count: "exact" }).eq("company_id", company.id),
      supabase.from("company_clients").select("id", { count: "exact" }).eq("company_id", company.id),
      supabase.from("company_providers").select("id", { count: "exact" }).eq("company_id", company.id),
      supabase.from("documents").select("id", { count: "exact" }).eq("company_id", company.id),
    ]);

    setStats({
      employees: employeesRes.count || 0,
      clients: clientsRes.count || 0,
      providers: providersRes.count || 0,
      documents: documentsRes.count || 0,
    });
  };

  const handleEdit = () => {
    if (company) {
      setEditData({
        name: company.name,
        description: company.description || "",
        logo_url: company.logo_url || "",
        website: "",
        email: "",
        phone: "",
        address: "",
        cover_image: "",
        services: "",
      });
      setIsEditing(true);
    }
  };

  const handleSave = () => {
    if (company) {
      onSave({
        name: editData.name,
        description: editData.description,
        logo_url: editData.logo_url,
        company_type: company.company_type,
        parent_id: company.parent_id,
      });
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const handleImageUpload = async (file: File, type: 'cover' | 'logo') => {
    if (!company) return;
    
    const setUploading = type === 'cover' ? setUploadingCover : setUploadingLogo;
    setUploading(true);
    
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${company.id}/${type}_${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('company-assets')
        .upload(fileName, file, { upsert: true });
      
      if (uploadError) throw uploadError;
      
      const { data: { publicUrl } } = supabase.storage
        .from('company-assets')
        .getPublicUrl(fileName);
      
      if (type === 'logo') {
        // Update logo_url in database
        const { error: updateError } = await supabase
          .from('companies')
          .update({ logo_url: publicUrl })
          .eq('id', company.id);
        
        if (updateError) throw updateError;
        
        setEditData(prev => ({ ...prev, logo_url: publicUrl }));
        // Trigger parent refresh
        onSave({
          name: company.name,
          description: company.description || '',
          logo_url: publicUrl,
          company_type: company.company_type,
          parent_id: company.parent_id,
        });
      } else {
        setEditData(prev => ({ ...prev, cover_image: publicUrl }));
      }
      
      toast.success(t("company.imageUploaded"));
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(t("company.uploadError"));
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: 'cover' | 'logo') => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(t("company.fileTooLarge"));
        return;
      }
      handleImageUpload(file, type);
    }
  };

  if (!company) return null;

  const isHub = company.company_type === "hub";

  const tips = [
    { icon: Users, text: t("company.tipEmployees"), color: "text-blue-500" },
    { icon: Briefcase, text: t("company.tipClients"), color: "text-green-500" },
    { icon: FileText, text: t("company.tipDocuments"), color: "text-purple-500" },
    { icon: DollarSign, text: t("company.tipFinances"), color: "text-amber-500" },
  ];

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent 
        side="right" 
        className="w-full sm:max-w-xl md:max-w-2xl overflow-y-auto p-0"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-card border-b border-border">
          <div className="p-4 sm:p-6">
            <div className="flex items-start gap-4">
              {/* Logo */}
              <div className={cn(
                "shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-xl flex items-center justify-center",
                isHub ? "bg-primary/20" : "bg-muted"
              )}>
                {company.logo_url ? (
                  <img
                    src={company.logo_url}
                    alt={company.name}
                    className="w-full h-full rounded-xl object-cover"
                  />
                ) : (
                  <Building2 className={cn(
                    "w-8 h-8 sm:w-10 sm:h-10",
                    isHub ? "text-primary" : "text-muted-foreground"
                  )} />
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                {isEditing ? (
                  <Input
                    value={editData.name}
                    onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                    className="text-lg font-bold mb-2"
                    placeholder={t("company.name")}
                  />
                ) : (
                  <h2 className="text-xl sm:text-2xl font-bold truncate">{company.name}</h2>
                )}
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <Badge variant={isHub ? "default" : "secondary"}>
                    {isHub ? "Hub" : t("company.satellite")}
                  </Badge>
                </div>
              </div>

              {/* Actions */}
              <div className="shrink-0 flex gap-2">
                {isEditing ? (
                  <>
                    <Button size="sm" variant="ghost" onClick={handleCancel}>
                      <X className="w-4 h-4" />
                    </Button>
                    <Button size="sm" onClick={handleSave} className="bg-primary text-primary-foreground">
                      <Save className="w-4 h-4 sm:mr-2" />
                      <span className="hidden sm:inline">{t("common.save")}</span>
                    </Button>
                  </>
                ) : (
                  <>
                    <Button size="sm" variant="ghost" onClick={handleEdit}>
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      onClick={() => {
                        onDelete(company);
                        onClose();
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Description */}
            {isEditing ? (
              <div className="mt-4">
                <Label className="text-xs text-muted-foreground">{t("company.about")}</Label>
                <Textarea
                  value={editData.description}
                  onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                  placeholder={t("company.aboutPlaceholder")}
                  className="mt-1 resize-none"
                  rows={3}
                />
              </div>
            ) : company.description ? (
              <p className="text-sm text-muted-foreground mt-4 line-clamp-3">
                {company.description}
              </p>
            ) : null}

            {isEditing && (
              <div className="mt-4">
                <Label className="text-xs text-muted-foreground">{t("company.logoUrl")}</Label>
                <Input
                  value={editData.logo_url}
                  onChange={(e) => setEditData({ ...editData, logo_url: e.target.value })}
                  placeholder="https://..."
                  className="mt-1"
                />
              </div>
            )}
          </div>
        </div>

        {/* Content Tabs */}
        <div className="p-4 sm:p-6">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="w-full grid grid-cols-3 mb-4">
              <TabsTrigger value="overview" className="text-xs sm:text-sm">
                {t("company.overview")}
              </TabsTrigger>
              <TabsTrigger value="manage" className="text-xs sm:text-sm">
                {t("company.manage")}
              </TabsTrigger>
              <TabsTrigger value="tips" className="text-xs sm:text-sm">
                {t("company.tips")}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-0 space-y-4">
              {/* Hidden file inputs */}
              <input
                ref={coverInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFileSelect(e, 'cover')}
              />
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFileSelect(e, 'logo')}
              />
              
              {/* Cover Image / Hero Section */}
              <div className="relative rounded-xl overflow-hidden h-32 sm:h-40 bg-gradient-to-br from-primary/30 via-primary/10 to-accent/20 group">
                {editData.cover_image ? (
                  <img 
                    src={editData.cover_image} 
                    alt="Cover" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <Image className="w-8 h-8 mx-auto text-muted-foreground/50 mb-2" />
                      <p className="text-xs text-muted-foreground/70">{t("company.coverImage")}</p>
                    </div>
                  </div>
                )}
                
                {/* Cover upload button */}
                <Button
                  size="sm"
                  variant="secondary"
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity gap-2"
                  onClick={() => coverInputRef.current?.click()}
                  disabled={uploadingCover}
                >
                  {uploadingCover ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Camera className="w-4 h-4" />
                  )}
                  <span className="hidden sm:inline">{t("company.changeCover")}</span>
                </Button>
                
                {/* Floating Logo */}
                <div className="absolute -bottom-6 left-4 sm:left-6">
                  <div 
                    className={cn(
                      "w-16 h-16 sm:w-20 sm:h-20 rounded-xl border-4 border-background flex items-center justify-center shadow-lg cursor-pointer group/logo relative",
                      isHub ? "bg-gradient-to-br from-god-gold to-amber-600" : "bg-card"
                    )}
                    onClick={() => logoInputRef.current?.click()}
                  >
                    {uploadingLogo ? (
                      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                    ) : company.logo_url || editData.logo_url ? (
                      <img
                        src={editData.logo_url || company.logo_url || ''}
                        alt={company.name}
                        className="w-full h-full rounded-lg object-cover"
                      />
                    ) : (
                      <Building2 className={cn(
                        "w-8 h-8",
                        isHub ? "text-white" : "text-muted-foreground"
                      )} />
                    )}
                    {/* Logo upload overlay */}
                    <div className="absolute inset-0 rounded-lg bg-black/50 opacity-0 group-hover/logo:opacity-100 transition-opacity flex items-center justify-center">
                      <Upload className="w-5 h-5 text-white" />
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Company Info with spacing for logo */}
              <div className="pt-8 px-1">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-bold">{company.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={isHub ? "default" : "secondary"} className="text-xs">
                        {isHub ? "Hub" : t("company.satellite")}
                      </Badge>
                      <Badge variant="outline" className="text-xs bg-green-500/10 text-green-600 border-green-500/20">
                        {t("company.active")}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                {/* Bio / Description */}
                <Card className="mt-4 bg-muted/30">
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {company.description || t("company.noDescription")}
                    </p>
                  </CardContent>
                </Card>
                
                {/* Quick Stats - Compact */}
                <div className="grid grid-cols-4 gap-2 mt-4">
                  <div className="text-center p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                    <Users className="w-5 h-5 mx-auto text-blue-500 mb-1" />
                    <p className="text-lg font-bold">{stats.employees}</p>
                    <p className="text-[10px] text-muted-foreground">{t("company.employees")}</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                    <Briefcase className="w-5 h-5 mx-auto text-green-500 mb-1" />
                    <p className="text-lg font-bold">{stats.clients}</p>
                    <p className="text-[10px] text-muted-foreground">{t("company.clients")}</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                    <FileText className="w-5 h-5 mx-auto text-purple-500 mb-1" />
                    <p className="text-lg font-bold">{stats.documents}</p>
                    <p className="text-[10px] text-muted-foreground">{t("documents.title")}</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                    <Building2 className="w-5 h-5 mx-auto text-amber-500 mb-1" />
                    <p className="text-lg font-bold">{stats.providers}</p>
                    <p className="text-[10px] text-muted-foreground">{t("company.providers")}</p>
                  </div>
                </div>
                
                {/* Links Section */}
                <Card className="mt-4 border-primary/20">
                  <CardContent className="p-4">
                    <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                      <Link2 className="w-4 h-4 text-primary" />
                      {t("company.socialLinks")}
                    </h4>
                    <CompanyLinksManager 
                      companyId={company.id} 
                      userId={userId} 
                      viewMode={true} 
                    />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="manage" className="mt-0 space-y-6">
              {/* Links Management */}
              <Card>
                <CardContent className="p-4">
                  <h4 className="font-semibold text-sm mb-4 flex items-center gap-2">
                    <Link2 className="w-4 h-4 text-primary" />
                    {t("company.manageLinks") || "Gerenciar Links"}
                  </h4>
                  <CompanyLinksManager 
                    companyId={company.id}
                    userId={userId}
                    viewMode={false}
                  />
                </CardContent>
              </Card>
              
              {/* Other Settings */}
              <CompanySettingsPanel 
                companyId={company.id}
                userId={userId}
              />
            </TabsContent>

            <TabsContent value="tips" className="mt-0 space-y-4">
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 mb-4">
                <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-primary" />
                  {t("company.tipsTitle")}
                </h4>
                <p className="text-xs text-muted-foreground">
                  {t("company.tipsDesc")}
                </p>
              </div>

              <div className="space-y-3">
                {tips.map((tip, index) => (
                  <Card key={index} className="hover:bg-accent/50 transition-colors cursor-pointer">
                    <CardContent className="p-4 flex items-start gap-3">
                      <tip.icon className={cn("w-5 h-5 mt-0.5 shrink-0", tip.color)} />
                      <p className="text-sm">{tip.text}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Card className="bg-god-gold/10 border-god-gold/20">
                <CardContent className="p-4">
                  <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                    <ExternalLink className="w-4 h-4 text-god-gold" />
                    {t("company.quickActions")}
                  </h4>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <Badge className="bg-god-gold text-god-gold-dark cursor-pointer hover:bg-god-gold-glow">
                      {t("company.addEmployee")}
                    </Badge>
                    <Badge className="bg-god-gold text-god-gold-dark cursor-pointer hover:bg-god-gold-glow">
                      {t("company.addClient")}
                    </Badge>
                    <Badge className="bg-god-gold text-god-gold-dark cursor-pointer hover:bg-god-gold-glow">
                      {t("company.addDocument")}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
}
