import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Camera, Upload, Loader2, X, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAppSettings } from "@/contexts/AppSettingsContext";
import { useSubscriptionLimits } from "@/hooks/useSubscriptionLimits";
import { UpgradeModal } from "@/components/ui/UpgradeModal";

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
  const { t } = useAppSettings();
  const { toast } = useToast();
  const { isSubscribed, canUseFeature } = useSubscriptionLimits();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const canScan = canUseFeature('receiptScanner');

  const handleFileSelect = async (file: File) => {
    if (!canScan) {
      setShowUpgradeModal(true);
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Process the receipt
    setIsProcessing(true);
    try {
      const base64 = await fileToBase64(file);
      
      const { data, error } = await supabase.functions.invoke('scan-receipt', {
        body: { image: base64, mimeType: file.type }
      });

      if (error) throw error;

      if (data?.extracted) {
        onDataExtracted(data.extracted);
        toast({ title: t("money.receiptProcessed") || "Receipt processed successfully" });
      } else {
        toast({ 
          title: t("money.receiptError") || "Could not extract data from receipt", 
          variant: "destructive" 
        });
      }
    } catch (error) {
      console.error("Error scanning receipt:", error);
      toast({ 
        title: t("money.receiptError") || "Error processing receipt", 
        variant: "destructive" 
      });
    } finally {
      setIsProcessing(false);
      setPreviewUrl(null);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data URL prefix to get just the base64
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleCameraCapture = () => {
    if (!canScan) {
      setShowUpgradeModal(true);
      return;
    }
    if (fileInputRef.current) {
      fileInputRef.current.setAttribute('capture', 'environment');
      fileInputRef.current.click();
    }
  };

  const handleFileUpload = () => {
    if (!canScan) {
      setShowUpgradeModal(true);
      return;
    }
    if (fileInputRef.current) {
      fileInputRef.current.removeAttribute('capture');
      fileInputRef.current.click();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  if (!canScan) {
    return (
      <>
        <Card className="border-dashed border-2 border-muted">
          <CardContent className="p-6 text-center space-y-4">
            <div className="w-12 h-12 mx-auto rounded-full bg-muted flex items-center justify-center">
              <Lock className="w-6 h-6 text-muted-foreground" />
            </div>
            <div>
              <h3 className="font-medium text-foreground">
                {t("money.premiumFeature") || "Premium Feature"}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                {t("money.scanReceiptPremium") || "Receipt scanning is available for subscribers"}
              </p>
            </div>
            <Button onClick={() => setShowUpgradeModal(true)}>
              {t("common.upgrade") || "Upgrade"}
            </Button>
          </CardContent>
        </Card>
        <UpgradeModal 
          open={showUpgradeModal} 
          onOpenChange={setShowUpgradeModal}
        feature="receiptScanner"
        />
      </>
    );
  }

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleInputChange}
      />

      {isProcessing ? (
        <Card className="border-dashed border-2 border-primary/50">
          <CardContent className="p-6 text-center space-y-4">
            {previewUrl && (
              <img 
                src={previewUrl} 
                alt="Receipt preview" 
                className="max-h-48 mx-auto rounded-lg object-contain"
              />
            )}
            <div className="flex items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
              <span className="text-sm text-muted-foreground">
                {t("money.processingReceipt") || "Processing receipt..."}
              </span>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-dashed border-2 border-muted hover:border-primary/50 transition-colors">
          <CardContent className="p-6 space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={handleCameraCapture}
              >
                <Camera className="w-4 h-4 mr-2" />
                {t("money.takePhoto") || "Take Photo"}
              </Button>
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={handleFileUpload}
              >
                <Upload className="w-4 h-4 mr-2" />
                {t("money.uploadImage") || "Upload Image"}
              </Button>
            </div>
            <p className="text-xs text-center text-muted-foreground">
              {t("money.scanReceiptHint") || "Take a photo or upload an image of your receipt"}
            </p>
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full text-muted-foreground"
              onClick={onCancel}
            >
              <X className="w-4 h-4 mr-2" />
              {t("common.cancel") || "Cancel"}
            </Button>
          </CardContent>
        </Card>
      )}

      <UpgradeModal 
        open={showUpgradeModal} 
        onOpenChange={setShowUpgradeModal}
        feature="receiptScanner"
      />
    </>
  );
}
