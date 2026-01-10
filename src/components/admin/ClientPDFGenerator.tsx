import { useState } from "react";
import { jsPDF } from "jspdf";
import QRCode from "qrcode";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { FileText, Loader2, Download, Eye, Globe } from "lucide-react";
import { toast } from "sonner";
import { useAppSettings } from "@/contexts/AppSettingsContext";

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
}

interface ClientPDFGeneratorProps {
  tenant: Tenant;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Translations for PDF content
const pdfTranslations: Record<string, Record<string, string>> = {
  "en-CA": {
    welcome: "Welcome to your Management System!",
    greeting: "Hello",
    accessReady: "Your personalized access is ready.",
    scanQR: "Scan the QR Code",
    pointCamera: "Point your phone camera at the code above",
    orAccessLink: "Or access via link:",
    gettingStarted: "Getting Started",
    step1: "1. Access the link above or scan the QR Code",
    step2: "2. Click \"Create Account\" and fill in your details",
    step3: "3. Confirm your email (check spam folder)",
    step4: "4. You're all set! Start using the system",
    whatYouCanDo: "What you can do:",
    feature1: "✓ Manage your companies and organizational structure",
    feature2: "✓ Control finances with complete income and expense view",
    feature3: "✓ Store and organize important documents",
    feature4: "✓ Access an intelligent assistant for decision-making",
    developedFor: "System developed exclusively for",
    questions: "Questions? Contact our support team.",
    yourAccess: "YOUR ACCESS",
    quickAccess: "Quick Access",
    personalizedFor: "Personalized for",
  },
  "en-US": {
    welcome: "Welcome to your Management System!",
    greeting: "Hello",
    accessReady: "Your personalized access is ready.",
    scanQR: "Scan the QR Code",
    pointCamera: "Point your phone camera at the code above",
    orAccessLink: "Or access via link:",
    gettingStarted: "Getting Started",
    step1: "1. Access the link above or scan the QR Code",
    step2: "2. Click \"Create Account\" and fill in your details",
    step3: "3. Confirm your email (check spam folder)",
    step4: "4. You're all set! Start using the system",
    whatYouCanDo: "What you can do:",
    feature1: "✓ Manage your companies and organizational structure",
    feature2: "✓ Control finances with complete income and expense view",
    feature3: "✓ Store and organize important documents",
    feature4: "✓ Access an intelligent assistant for decision-making",
    developedFor: "System developed exclusively for",
    questions: "Questions? Contact our support team.",
    yourAccess: "YOUR ACCESS",
    quickAccess: "Quick Access",
    personalizedFor: "Personalized for",
  },
  "fr-CA": {
    welcome: "Bienvenue dans votre système de gestion!",
    greeting: "Bonjour",
    accessReady: "Votre accès personnalisé est prêt.",
    scanQR: "Scannez le code QR",
    pointCamera: "Pointez la caméra de votre téléphone vers le code ci-dessus",
    orAccessLink: "Ou accédez via le lien:",
    gettingStarted: "Pour commencer",
    step1: "1. Accédez au lien ci-dessus ou scannez le code QR",
    step2: "2. Cliquez sur \"Créer un compte\" et remplissez vos informations",
    step3: "3. Confirmez votre email (vérifiez le spam)",
    step4: "4. C'est prêt! Commencez à utiliser le système",
    whatYouCanDo: "Ce que vous pouvez faire:",
    feature1: "✓ Gérer vos entreprises et votre structure organisationnelle",
    feature2: "✓ Contrôler les finances avec une vue complète des revenus et dépenses",
    feature3: "✓ Stocker et organiser des documents importants",
    feature4: "✓ Accéder à un assistant intelligent pour la prise de décision",
    developedFor: "Système développé exclusivement pour",
    questions: "Questions? Contactez notre équipe de support.",
    yourAccess: "VOTRE ACCÈS",
    quickAccess: "Accès Rapide",
    personalizedFor: "Personnalisé pour",
  },
  "pt-BR": {
    welcome: "Bem-vindo ao seu Sistema de Gestão!",
    greeting: "Olá",
    accessReady: "Seu acesso personalizado está pronto.",
    scanQR: "Escaneie o QR Code",
    pointCamera: "Aponte a câmera do celular para o código acima",
    orAccessLink: "Ou acesse pelo link:",
    gettingStarted: "Primeiros Passos",
    step1: "1. Acesse o link acima ou escaneie o QR Code",
    step2: "2. Clique em \"Criar Conta\" e preencha seus dados",
    step3: "3. Confirme seu email (verifique a caixa de spam)",
    step4: "4. Pronto! Comece a usar o sistema",
    whatYouCanDo: "O que você pode fazer:",
    feature1: "✓ Gerenciar suas empresas e estrutura organizacional",
    feature2: "✓ Controlar finanças com visão completa de receitas e despesas",
    feature3: "✓ Armazenar e organizar documentos importantes",
    feature4: "✓ Acessar assistente inteligente para ajudar nas decisões",
    developedFor: "Sistema desenvolvido exclusivamente para",
    questions: "Dúvidas? Entre em contato com o suporte.",
    yourAccess: "SEU ACESSO",
    quickAccess: "Acesso Rápido",
    personalizedFor: "Personalizado para",
  },
  "es-ES": {
    welcome: "¡Bienvenido a su sistema de gestión!",
    greeting: "Hola",
    accessReady: "Su acceso personalizado está listo.",
    scanQR: "Escanea el código QR",
    pointCamera: "Apunte la cámara de su teléfono hacia el código de arriba",
    orAccessLink: "O acceda a través del enlace:",
    gettingStarted: "Primeros Pasos",
    step1: "1. Acceda al enlace de arriba o escanee el código QR",
    step2: "2. Haga clic en \"Crear cuenta\" y complete sus datos",
    step3: "3. Confirme su email (revise la carpeta de spam)",
    step4: "4. ¡Listo! Comience a usar el sistema",
    whatYouCanDo: "Lo que puedes hacer:",
    feature1: "✓ Gestionar sus empresas y estructura organizacional",
    feature2: "✓ Controlar finanzas con vista completa de ingresos y gastos",
    feature3: "✓ Almacenar y organizar documentos importantes",
    feature4: "✓ Acceder a un asistente inteligente para tomar decisiones",
    developedFor: "Sistema desarrollado exclusivamente para",
    questions: "¿Preguntas? Contacte a nuestro equipo de soporte.",
    yourAccess: "SU ACCESO",
    quickAccess: "Acceso Rápido",
    personalizedFor: "Personalizado para",
  },
};

export function ClientPDFGenerator({ tenant, open, onOpenChange }: ClientPDFGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const { language } = useAppSettings();

  // Get translations based on current language
  const t = pdfTranslations[language] || pdfTranslations["en-CA"];

  const getAccessLink = () => {
    if (tenant.custom_domain) {
      return `https://${tenant.custom_domain}`;
    }
    return `${window.location.origin}/auth?tenant=${tenant.slug}`;
  };

  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 212, g: 175, b: 55 };
  };

  // Lighten a color
  const lightenColor = (rgb: { r: number; g: number; b: number }, percent: number) => {
    return {
      r: Math.min(255, rgb.r + (255 - rgb.r) * percent),
      g: Math.min(255, rgb.g + (255 - rgb.g) * percent),
      b: Math.min(255, rgb.b + (255 - rgb.b) * percent),
    };
  };

  const generatePDF = async () => {
    setIsGenerating(true);
    
    try {
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 15;
      const primaryColor = hexToRgb(tenant.primary_color || "#d4af37");
      const lightPrimary = lightenColor(primaryColor, 0.85);
      const accessLink = getAccessLink();

      // Generate QR Code
      const qrCodeDataUrl = await QRCode.toDataURL(accessLink, {
        width: 400,
        margin: 1,
        color: {
          dark: `rgb(${primaryColor.r},${primaryColor.g},${primaryColor.b})`,
          light: "#ffffff"
        }
      });

      // ===== DECORATIVE BACKGROUND ELEMENTS =====
      // Top gradient area
      doc.setFillColor(primaryColor.r, primaryColor.g, primaryColor.b);
      doc.rect(0, 0, pageWidth, 85, "F");

      // Decorative pattern (email marketing style) - lighter color for subtle effect
      doc.setFillColor(255, 255, 255);
      doc.circle(pageWidth - 20, 30, 60, "F");
      doc.circle(20, 60, 40, "F");

      // ===== HEADER SECTION =====
      // Company badge/logo area
      doc.setFillColor(255, 255, 255);
      doc.roundedRect((pageWidth - 60) / 2, 15, 60, 60, 8, 8, "F");
      
      // Company initial in the badge
      doc.setFillColor(primaryColor.r, primaryColor.g, primaryColor.b);
      doc.setFontSize(36);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(primaryColor.r, primaryColor.g, primaryColor.b);
      doc.text(tenant.name.charAt(0).toUpperCase(), pageWidth / 2, 52, { align: "center" });

      // Company name below logo
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(t.yourAccess, pageWidth / 2, 82, { align: "center" });

      // ===== WELCOME SECTION =====
      let yPos = 100;

      doc.setTextColor(30, 30, 30);
      doc.setFontSize(24);
      doc.setFont("helvetica", "bold");
      doc.text(t.welcome, pageWidth / 2, yPos, { align: "center" });

      yPos += 12;
      doc.setFontSize(13);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(80, 80, 80);
      const welcomeText = `${t.greeting}${tenant.owner_name ? ` ${tenant.owner_name}` : ""}! ${t.accessReady}`;
      doc.text(welcomeText, pageWidth / 2, yPos, { align: "center" });

      // ===== MAIN CONTENT - TWO COLUMNS =====
      yPos += 20;
      const colWidth = (pageWidth - margin * 3) / 2;
      const leftCol = margin;
      const rightCol = margin * 2 + colWidth;

      // LEFT COLUMN - QR Code Card
      doc.setFillColor(lightPrimary.r, lightPrimary.g, lightPrimary.b);
      doc.roundedRect(leftCol, yPos, colWidth, 85, 5, 5, "F");
      
      // QR Code title
      doc.setTextColor(primaryColor.r, primaryColor.g, primaryColor.b);
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text(t.quickAccess, leftCol + colWidth / 2, yPos + 12, { align: "center" });

      // QR Code
      const qrSize = 50;
      doc.addImage(qrCodeDataUrl, "PNG", leftCol + (colWidth - qrSize) / 2, yPos + 18, qrSize, qrSize);

      // QR instruction
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 100, 100);
      doc.text(t.pointCamera, leftCol + colWidth / 2, yPos + 78, { align: "center" });

      // RIGHT COLUMN - Getting Started Card
      doc.setFillColor(245, 245, 245);
      doc.roundedRect(rightCol, yPos, colWidth, 85, 5, 5, "F");

      // Getting started title
      doc.setTextColor(30, 30, 30);
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text(t.gettingStarted, rightCol + 10, yPos + 12);

      // Steps
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(60, 60, 60);
      const steps = [t.step1, t.step2, t.step3, t.step4];
      steps.forEach((step, index) => {
        doc.text(step, rightCol + 10, yPos + 25 + (index * 14), { maxWidth: colWidth - 20 });
      });

      // ===== LINK SECTION =====
      yPos += 95;
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(primaryColor.r, primaryColor.g, primaryColor.b);
      doc.setLineWidth(1);
      doc.roundedRect(margin, yPos, pageWidth - margin * 2, 25, 5, 5, "FD");

      doc.setTextColor(80, 80, 80);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text(t.orAccessLink, margin + 10, yPos + 10);

      doc.setTextColor(primaryColor.r, primaryColor.g, primaryColor.b);
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.textWithLink(accessLink, margin + 10, yPos + 18, { 
        url: accessLink 
      });

      // ===== FEATURES SECTION =====
      yPos += 35;
      doc.setTextColor(30, 30, 30);
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text(t.whatYouCanDo, margin, yPos);

      yPos += 8;
      doc.setFillColor(250, 250, 250);
      doc.roundedRect(margin, yPos, pageWidth - margin * 2, 38, 5, 5, "F");

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(60, 60, 60);
      const features = [t.feature1, t.feature2, t.feature3, t.feature4];
      features.forEach((feature, index) => {
        doc.text(feature, margin + 10, yPos + 10 + (index * 8));
      });

      // ===== FOOTER =====
      // Bottom decorative bar
      doc.setFillColor(primaryColor.r, primaryColor.g, primaryColor.b);
      doc.rect(0, pageHeight - 30, pageWidth, 30, "F");

      // Personalized for text
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`${t.personalizedFor} ${tenant.name}`, pageWidth / 2, pageHeight - 18, { align: "center" });
      
      doc.setFontSize(8);
      doc.setTextColor(220, 220, 220);
      doc.text(t.questions, pageWidth / 2, pageHeight - 10, { align: "center" });

      // Generate blob URL for preview
      const pdfBlob = doc.output("blob");
      const url = URL.createObjectURL(pdfBlob);
      setPdfUrl(url);

      toast.success(language.startsWith("pt") ? "PDF gerado com sucesso!" : "PDF generated successfully!");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error(language.startsWith("pt") ? "Erro ao gerar PDF" : "Error generating PDF");
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadPDF = async () => {
    if (pdfUrl) {
      const link = document.createElement("a");
      link.href = pdfUrl;
      link.download = `Access-${tenant.name.replace(/\s+/g, "-")}.pdf`;
      link.click();
    } else {
      await generatePDF();
      // After generating, trigger download
      setTimeout(() => {
        if (pdfUrl) {
          const link = document.createElement("a");
          link.href = pdfUrl;
          link.download = `Access-${tenant.name.replace(/\s+/g, "-")}.pdf`;
          link.click();
        }
      }, 500);
    }
  };

  const handleClose = () => {
    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl);
      setPdfUrl(null);
    }
    onOpenChange(false);
  };

  const langLabels: Record<string, string> = {
    "en-CA": "English (CA)",
    "en-US": "English (US)",
    "fr-CA": "Français (CA)",
    "pt-BR": "Português (BR)",
    "es-ES": "Español",
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-card border-border max-w-2xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            {language.startsWith("pt") ? "Gerar PDF de Apresentação" : "Generate Presentation PDF"}
          </DialogTitle>
          <DialogDescription>
            {language.startsWith("pt") 
              ? "Crie um PDF profissional com QR Code e instruções para enviar ao cliente"
              : "Create a professional PDF with QR Code and instructions to send to the client"
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Language indicator */}
          <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 text-sm">
            <Globe className="w-4 h-4 text-primary" />
            <span className="text-muted-foreground">
              {language.startsWith("pt") ? "Idioma do PDF:" : "PDF Language:"}
            </span>
            <span className="font-medium">{langLabels[language] || language}</span>
          </div>

          {/* Preview info */}
          <div className="p-4 rounded-lg bg-muted/50 border border-border space-y-2">
            <h4 className="font-semibold text-sm">
              {language.startsWith("pt") ? "Informações do PDF:" : "PDF Information:"}
            </h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">
                  {language.startsWith("pt") ? "Cliente:" : "Client:"}
                </span>{" "}
                {tenant.name}
              </div>
              <div>
                <span className="text-muted-foreground">
                  {language.startsWith("pt") ? "Proprietário:" : "Owner:"}
                </span>{" "}
                {tenant.owner_name || "N/A"}
              </div>
              <div className="col-span-2">
                <span className="text-muted-foreground">
                  {language.startsWith("pt") ? "Link de acesso:" : "Access link:"}
                </span>{" "}
                <code className="bg-muted px-1 rounded text-xs">{getAccessLink()}</code>
              </div>
            </div>
          </div>

          {/* PDF Preview */}
          {pdfUrl && (
            <div className="border border-border rounded-lg overflow-hidden">
              <iframe 
                src={pdfUrl} 
                className="w-full h-[400px]"
                title="PDF Preview"
              />
            </div>
          )}

          {!pdfUrl && (
            <div className="border border-dashed border-border rounded-lg p-8 text-center">
              <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {language.startsWith("pt") 
                  ? 'Clique em "Gerar Preview" para visualizar o PDF'
                  : 'Click "Generate Preview" to view the PDF'
                }
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={generatePDF}
            disabled={isGenerating}
            className="gap-2"
          >
            {isGenerating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
            {pdfUrl 
              ? (language.startsWith("pt") ? "Regenerar" : "Regenerate")
              : (language.startsWith("pt") ? "Gerar Preview" : "Generate Preview")
            }
          </Button>
          <Button
            onClick={downloadPDF}
            disabled={isGenerating}
            className="gap-2"
          >
            <Download className="w-4 h-4" />
            {language.startsWith("pt") ? "Baixar PDF" : "Download PDF"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}