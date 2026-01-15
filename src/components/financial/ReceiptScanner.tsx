import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Camera, Upload, Loader2, Check, X, ImageIcon, Crown } from "lucide-react";
import { useAppSettings } from "@/contexts/AppSettingsContext";
import { useSubscriptionLimits } from "@/hooks/useSubscriptionLimits";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface ExtractedData {
  total: number;
  date: string | null;
  merchant: string;
  type: "income" | "expense";
  suggested_category: string;
  items: { name: string; amount: number }[];
}

interface ReceiptScannerProps {
  onDataExtracted: (data: ExtractedData) => void;
  onCancel: () => void;
}

export function ReceiptScanner({ onDataExtracted, onCancel }: ReceiptScannerProps) {
  const { t, language } = useAppSettings();
  const { canUseFeature } = useSubscriptionLimits();
  const navigate = useNavigate();
  const isPt = language.startsWith('pt');
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check if user can use this feature
  if (!canUseFeature('receiptScanner')) {
    return (
      <div className="space-y-4 text-center py-6">
        <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
          <Crown className="w-8 h-8 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold">{isPt ? 'Scanner de Recibos Premium' : 'Premium Receipt Scanner'}</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {isPt ? 'Faça upgrade para escanear recibos automaticamente com IA.' : 'Upgrade to automatically scan receipts with AI.'}
          </p>
        </div>
        <Button onClick={() => navigate('/billing')} className="w-full">
          <Crown className="w-4 h-4 mr-2" />
          {isPt ? 'Fazer Upgrade • 7 dias grátis' : 'Upgrade • 7 days free'}
        </Button>
        <Button variant="ghost" onClick={onCancel} className="w-full">
          {isPt ? 'Voltar' : 'Back'}
        </Button>
      </div>
    );
  }

  const compressImage = (file: File, maxWidth = 1024): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
          
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          const base64 = canvas.toDataURL('image/jpeg', 0.8);
          resolve(base64);
        };
        img.onerror = reject;
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 4 * 1024 * 1024) {
      toast.error(t("money.fileTooLarge") || "File too large (max 4MB)");
      return;
    }

    try {
      const base64 = await compressImage(file);
      setPreviewUrl(base64);
      await analyzeReceipt(base64);
    } catch (error) {
      console.error('Error processing image:', error);
      toast.error(t("money.errorProcessing") || "Error processing image");
    }
  };

  const analyzeReceipt = async (imageBase64: string) => {
    setIsAnalyzing(true);
    setExtractedData(null);

    try {
      const { data, error } = await supabase.functions.invoke('scan-receipt', {
        body: { imageBase64 }
      });

      if (error) throw error;

      if (data?.success && data?.data) {
        setExtractedData(data.data);
        toast.success(t("money.receiptAnalyzed") || "Receipt analyzed successfully!");
      } else {
        throw new Error(data?.error || "Failed to analyze receipt");
      }
    } catch (error: any) {
      console.error('Error analyzing receipt:', error);
      toast.error(error.message || t("money.errorAnalyzing") || "Error analyzing receipt");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleConfirm = () => {
    if (extractedData) {
      onDataExtracted(extractedData);
    }
  };

  const handleRetry = () => {
    setPreviewUrl(null);
    setExtractedData(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      {/* Hidden input for upload (no capture - opens file picker) */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        id="receipt-upload-input"
      />
      
      {/* Hidden input for camera (with capture) */}
      <input
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
        id="receipt-camera-input"
      />

      {!previewUrl ? (
        <div className="space-y-3">
          <Label className="text-sm text-muted-foreground">
            {t("money.scanReceiptDesc") || "Take a photo or upload an image of your receipt"}
          </Label>
          
          <div className="grid grid-cols-2 gap-3">
            <Button
              type="button"
              variant="outline"
              className="h-24 flex-col gap-2"
              onClick={() => document.getElementById('receipt-camera-input')?.click()}
            >
              <Camera className="w-6 h-6" />
              <span className="text-xs">{t("money.takePhoto") || "Take Photo"}</span>
            </Button>
            
            <Button
              type="button"
              variant="outline"
              className="h-24 flex-col gap-2"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-6 h-6" />
              <span className="text-xs">{t("money.uploadImage") || "Upload Image"}</span>
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Image Preview */}
          <div className="relative rounded-lg overflow-hidden border border-border">
            <img 
              src={previewUrl} 
              alt="Receipt preview" 
              className="w-full max-h-48 object-contain bg-muted"
            />
            {isAnalyzing && (
              <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                <div className="text-center">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-god-gold" />
                  <p className="text-sm text-muted-foreground">
                    {t("money.analyzing") || "Analyzing..."}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Extracted Data */}
          {extractedData && !isAnalyzing && (
            <div className="space-y-3 p-4 rounded-lg bg-muted/50 border border-border">
              <h4 className="font-medium flex items-center gap-2">
                <Check className="w-4 h-4 text-financial-positive" />
                {t("money.extractedData") || "Extracted Data"}
              </h4>
              
              <div className="grid gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("money.amount")}:</span>
                  <span className="font-medium">{extractedData.total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("money.merchant") || "Merchant"}:</span>
                  <span className="font-medium">{extractedData.merchant}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("money.type") || "Type"}:</span>
                  <span className={`font-medium ${extractedData.type === 'income' ? 'text-financial-positive' : 'text-financial-negative'}`}>
                    {extractedData.type === 'income' ? t("money.income") : t("money.expenses")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("money.category") || "Category"}:</span>
                  <span className="font-medium">{extractedData.suggested_category}</span>
                </div>
                {extractedData.date && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("money.date") || "Date"}:</span>
                    <span className="font-medium">{extractedData.date}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={handleRetry}
              disabled={isAnalyzing}
            >
              <X className="w-4 h-4 mr-2" />
              {t("money.retry") || "Retry"}
            </Button>
            
            {extractedData && (
              <Button
                type="button"
                className="flex-1 bg-god-gold text-god-gold-dark hover:bg-god-gold-glow"
                onClick={handleConfirm}
                disabled={isAnalyzing}
              >
                <Check className="w-4 h-4 mr-2" />
                {t("money.useData") || "Use This Data"}
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
