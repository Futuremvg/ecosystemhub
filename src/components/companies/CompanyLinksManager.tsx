import { useState, useEffect } from "react";
import { Plus, Trash2, ExternalLink, Globe, Linkedin, Instagram, Twitter, Facebook, Youtube, Github, Mail, Phone, MapPin, Link2, Loader2, Edit2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAppSettings } from "@/contexts/AppSettingsContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface CompanyLink {
  id: string;
  name: string;
  url: string;
  category: string;
  company_id: string;
}

interface CompanyLinksManagerProps {
  companyId: string;
  userId: string;
  viewMode?: boolean;
}

const LINK_CATEGORIES = [
  { value: "website", label: "Website", icon: Globe, color: "text-primary" },
  { value: "linkedin", label: "LinkedIn", icon: Linkedin, color: "text-blue-600" },
  { value: "instagram", label: "Instagram", icon: Instagram, color: "text-pink-500" },
  { value: "twitter", label: "X / Twitter", icon: Twitter, color: "text-sky-500" },
  { value: "facebook", label: "Facebook", icon: Facebook, color: "text-blue-700" },
  { value: "youtube", label: "YouTube", icon: Youtube, color: "text-red-600" },
  { value: "github", label: "GitHub", icon: Github, color: "text-foreground" },
  { value: "email", label: "Email", icon: Mail, color: "text-amber-600" },
  { value: "phone", label: "Telefone", icon: Phone, color: "text-green-600" },
  { value: "address", label: "Endereço", icon: MapPin, color: "text-red-500" },
  { value: "other", label: "Outro", icon: Link2, color: "text-muted-foreground" },
];

export function CompanyLinksManager({ companyId, userId, viewMode = false }: CompanyLinksManagerProps) {
  const { t } = useAppSettings();
  const [links, setLinks] = useState<CompanyLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newLink, setNewLink] = useState({
    name: "",
    url: "",
    category: "website",
  });

  useEffect(() => {
    loadLinks();
  }, [companyId]);

  const loadLinks = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("ecosystem_links")
        .select("id, name, url, priority")
        .eq("company_id", companyId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      // Map priority field to category (we're repurposing priority for category)
      setLinks(data?.map(link => ({
        id: link.id,
        name: link.name,
        url: link.url,
        category: link.priority || "other",
        company_id: companyId,
      })) || []);
    } catch (error) {
      console.error("Error loading links:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddLink = async () => {
    if (!newLink.name.trim() || !newLink.url.trim()) {
      toast.error(t("company.linkNameUrlRequired") || "Nome e URL são obrigatórios");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from("ecosystem_links")
        .insert({
          company_id: companyId,
          user_id: userId,
          name: newLink.name,
          url: newLink.url,
          priority: newLink.category, // Using priority field for category
        });

      if (error) throw error;

      toast.success(t("company.linkAdded") || "Link adicionado!");
      setNewLink({ name: "", url: "", category: "website" });
      setDialogOpen(false);
      loadLinks();
    } catch (error) {
      console.error("Error adding link:", error);
      toast.error(t("company.linkError") || "Erro ao adicionar link");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateLink = async (link: CompanyLink) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("ecosystem_links")
        .update({
          name: link.name,
          url: link.url,
          priority: link.category,
        })
        .eq("id", link.id);

      if (error) throw error;

      toast.success(t("company.linkUpdated") || "Link atualizado!");
      setEditingId(null);
      loadLinks();
    } catch (error) {
      console.error("Error updating link:", error);
      toast.error(t("company.linkError") || "Erro ao atualizar link");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteLink = async (id: string) => {
    try {
      const { error } = await supabase
        .from("ecosystem_links")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast.success(t("company.linkDeleted") || "Link removido!");
      loadLinks();
    } catch (error) {
      console.error("Error deleting link:", error);
      toast.error(t("company.linkError") || "Erro ao remover link");
    }
  };

  const getCategoryInfo = (category: string) => {
    return LINK_CATEGORIES.find(c => c.value === category) || LINK_CATEGORIES[LINK_CATEGORIES.length - 1];
  };

  const openLink = (url: string, category: string) => {
    let finalUrl = url;
    
    // Handle special cases
    if (category === "email" && !url.startsWith("mailto:")) {
      finalUrl = `mailto:${url}`;
    } else if (category === "phone" && !url.startsWith("tel:")) {
      finalUrl = `tel:${url}`;
    } else if (!url.startsWith("http://") && !url.startsWith("https://") && !url.startsWith("mailto:") && !url.startsWith("tel:")) {
      finalUrl = `https://${url}`;
    }
    
    window.open(finalUrl, "_blank", "noopener,noreferrer");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // View mode - just show clickable links
  if (viewMode) {
    if (links.length === 0) {
      return (
        <p className="text-xs text-muted-foreground italic">
          {t("company.noLinks") || "Nenhum link cadastrado"}
        </p>
      );
    }

    return (
      <div className="flex flex-wrap gap-2">
        {links.map((link) => {
          const categoryInfo = getCategoryInfo(link.category);
          const Icon = categoryInfo.icon;
          
          return (
            <Button
              key={link.id}
              size="sm"
              variant="outline"
              className={cn(
                "h-9 px-3 gap-2 transition-all",
                `hover:bg-${categoryInfo.color.replace('text-', '')}/10`
              )}
              onClick={() => openLink(link.url, link.category)}
            >
              <Icon className={cn("w-4 h-4", categoryInfo.color)} />
              <span className="text-xs">{link.name}</span>
              <ExternalLink className="w-3 h-3 opacity-50" />
            </Button>
          );
        })}
      </div>
    );
  }

  // Edit mode - show management interface
  return (
    <div className="space-y-4">
      {/* Links list */}
      <div className="space-y-2">
        {links.map((link) => {
          const categoryInfo = getCategoryInfo(link.category);
          const Icon = categoryInfo.icon;
          const isEditing = editingId === link.id;

          if (isEditing) {
            return (
              <Card key={link.id} className="border-primary/30">
                <CardContent className="p-3 space-y-3">
                  <div className="flex gap-2">
                    <Select
                      value={link.category}
                      onValueChange={(value) => setLinks(prev => 
                        prev.map(l => l.id === link.id ? { ...l, category: value } : l)
                      )}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {LINK_CATEGORIES.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>
                            <div className="flex items-center gap-2">
                              <cat.icon className={cn("w-4 h-4", cat.color)} />
                              <span>{cat.label}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      value={link.name}
                      onChange={(e) => setLinks(prev => 
                        prev.map(l => l.id === link.id ? { ...l, name: e.target.value } : l)
                      )}
                      placeholder="Nome"
                      className="flex-1"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={link.url}
                      onChange={(e) => setLinks(prev => 
                        prev.map(l => l.id === link.id ? { ...l, url: e.target.value } : l)
                      )}
                      placeholder="URL"
                      className="flex-1"
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-green-600"
                      onClick={() => handleUpdateLink(link)}
                      disabled={saving}
                    >
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        setEditingId(null);
                        loadLinks();
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          }

          return (
            <Card key={link.id} className="group hover:border-primary/30 transition-colors">
              <CardContent className="p-3 flex items-center gap-3">
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center",
                  `bg-${categoryInfo.color.replace('text-', '')}/10`
                )}>
                  <Icon className={cn("w-4 h-4", categoryInfo.color)} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{link.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{link.url}</p>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    onClick={() => openLink(link.url, link.category)}
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    onClick={() => setEditingId(link.id)}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => handleDeleteLink(link.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {links.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Link2 className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">{t("company.noLinks") || "Nenhum link cadastrado"}</p>
            <p className="text-xs">{t("company.addLinkHint") || "Adicione links úteis para sua empresa"}</p>
          </div>
        )}
      </div>

      {/* Add link dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="w-full gap-2">
            <Plus className="w-4 h-4" />
            {t("company.addLink") || "Adicionar Link"}
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("company.addLink") || "Adicionar Link"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>{t("company.linkCategory") || "Categoria"}</Label>
              <Select
                value={newLink.category}
                onValueChange={(value) => setNewLink(prev => ({ ...prev, category: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LINK_CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      <div className="flex items-center gap-2">
                        <cat.icon className={cn("w-4 h-4", cat.color)} />
                        <span>{cat.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t("company.linkName") || "Nome"}</Label>
              <Input
                value={newLink.name}
                onChange={(e) => setNewLink(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ex: Site Oficial, Perfil LinkedIn..."
              />
            </div>
            <div className="space-y-2">
              <Label>{t("company.linkUrl") || "URL"}</Label>
              <Input
                value={newLink.url}
                onChange={(e) => setNewLink(prev => ({ ...prev, url: e.target.value }))}
                placeholder="https://..."
              />
            </div>
            <Button 
              className="w-full" 
              onClick={handleAddLink}
              disabled={saving}
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Plus className="w-4 h-4 mr-2" />
              )}
              {t("company.addLink") || "Adicionar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
