import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAppSettings } from "@/contexts/AppSettingsContext";

interface Company {
  id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  company_type: string;
  parent_id: string | null;
}

interface CompanyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  company?: Company | null;
  allCompanies: Company[];
  defaultParentId?: string | null;
  onSave: (data: {
    name: string;
    description: string;
    logo_url: string;
    company_type: string;
    parent_id: string | null;
  }) => void;
}

export function CompanyDialog({
  open,
  onOpenChange,
  company,
  allCompanies,
  defaultParentId,
  onSave,
}: CompanyDialogProps) {
  const { t } = useAppSettings();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [companyType, setCompanyType] = useState<"hub" | "satellite">("hub");
  const [parentId, setParentId] = useState<string | null>(null);

  useEffect(() => {
    if (company) {
      setName(company.name);
      setDescription(company.description || "");
      setLogoUrl(company.logo_url || "");
      setCompanyType(company.company_type as "hub" | "satellite");
      setParentId(company.parent_id);
    } else {
      setName("");
      setDescription("");
      setLogoUrl("");
      // If defaultParentId is provided, set as satellite
      if (defaultParentId) {
        setCompanyType("satellite");
        setParentId(defaultParentId);
      } else {
        setCompanyType("hub");
        setParentId(null);
      }
    }
  }, [company, open, defaultParentId]);

  const handleSave = () => {
    if (!name.trim()) return;
    
    onSave({
      name: name.trim(),
      description: description.trim(),
      logo_url: logoUrl.trim(),
      company_type: companyType,
      parent_id: companyType === "satellite" ? parentId : null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {company ? t("common.edit") : t("common.add")} {t("ecosystem.companies")}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label>{t("company.name")} *</Label>
            <Input
              placeholder="Ex: My Company"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>{t("company.type")}</Label>
            <Select
              value={companyType}
              onValueChange={(v: "hub" | "satellite") => setCompanyType(v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hub">🏢 Hub ({t("company.mainCompany")})</SelectItem>
                <SelectItem value="satellite">🛰️ {t("company.satellite")} ({t("company.subsidiary")})</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {companyType === "satellite" && allCompanies.length > 0 && (
            <div className="space-y-2">
              <Label>{t("company.parentCompany")}</Label>
              <Select
                value={parentId || ""}
                onValueChange={(v) => setParentId(v || null)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("company.selectParent")} />
                </SelectTrigger>
                <SelectContent>
                  {allCompanies.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.company_type === "hub" ? "🏢 " : "🛰️ "}{c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label>{t("company.logoUrl")} ({t("common.optional")})</Label>
            <Input
              placeholder="https://..."
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>{t("company.about")}</Label>
            <Textarea
              placeholder={t("company.aboutPlaceholder")}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <Button onClick={handleSave} className="w-full" disabled={!name.trim()}>
            {t("common.save")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
