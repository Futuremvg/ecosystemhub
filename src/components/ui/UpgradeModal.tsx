import { useNavigate } from 'react-router-dom';
import { Crown, Zap, FileText, Building2, Receipt, FileSpreadsheet, Sparkles, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useAppSettings } from '@/contexts/AppSettingsContext';
import type { RestrictedFeature } from '@/hooks/useSubscriptionLimits';

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  feature: RestrictedFeature;
  currentCount?: number;
  limit?: number;
}

const featureConfig: Record<RestrictedFeature, {
  icon: React.ReactNode;
  titlePt: string;
  titleEn: string;
  descriptionPt: string;
  descriptionEn: string;
}> = {
  godMode: {
    icon: <Crown className="h-8 w-8 text-amber-500" />,
    titlePt: 'GodMode é Premium',
    titleEn: 'GodMode is Premium',
    descriptionPt: 'O assistente de voz com IA está disponível apenas para assinantes. Faça upgrade para ter acesso ilimitado ao GodMode.',
    descriptionEn: 'The AI voice assistant is only available for subscribers. Upgrade to get unlimited access to GodMode.',
  },
  companies: {
    icon: <Building2 className="h-8 w-8 text-blue-500" />,
    titlePt: 'Limite de Empresas Atingido',
    titleEn: 'Company Limit Reached',
    descriptionPt: 'O plano gratuito permite apenas 1 empresa. Faça upgrade para adicionar empresas ilimitadas.',
    descriptionEn: 'The free plan allows only 1 company. Upgrade to add unlimited companies.',
  },
  documents: {
    icon: <FileText className="h-8 w-8 text-green-500" />,
    titlePt: 'Limite de Documentos Atingido',
    titleEn: 'Document Limit Reached',
    descriptionPt: 'O plano gratuito permite apenas 5 documentos. Faça upgrade para armazenar documentos ilimitados.',
    descriptionEn: 'The free plan allows only 5 documents. Upgrade to store unlimited documents.',
  },
  transactions: {
    icon: <Zap className="h-8 w-8 text-purple-500" />,
    titlePt: 'Limite de Transações Atingido',
    titleEn: 'Transaction Limit Reached',
    descriptionPt: 'O plano gratuito permite apenas 20 transações por mês. Faça upgrade para transações ilimitadas.',
    descriptionEn: 'The free plan allows only 20 transactions per month. Upgrade for unlimited transactions.',
  },
  receiptScanner: {
    icon: <Receipt className="h-8 w-8 text-orange-500" />,
    titlePt: 'Scanner de Recibos é Premium',
    titleEn: 'Receipt Scanner is Premium',
    descriptionPt: 'O scanner de recibos com IA está disponível apenas para assinantes. Faça upgrade para digitalizar recibos automaticamente.',
    descriptionEn: 'The AI receipt scanner is only available for subscribers. Upgrade to automatically scan receipts.',
  },
  bankStatementImport: {
    icon: <FileSpreadsheet className="h-8 w-8 text-teal-500" />,
    titlePt: 'Importação de Extratos é Premium',
    titleEn: 'Bank Statement Import is Premium',
    descriptionPt: 'A importação de extratos bancários está disponível apenas para assinantes. Faça upgrade para importar extratos automaticamente.',
    descriptionEn: 'Bank statement import is only available for subscribers. Upgrade to import statements automatically.',
  },
};

export function UpgradeModal({ open, onOpenChange, feature, currentCount, limit }: UpgradeModalProps) {
  const navigate = useNavigate();
  const { language } = useAppSettings();
  const isPt = language.startsWith('pt');
  
  const config = featureConfig[feature];

  const handleUpgrade = () => {
    onOpenChange(false);
    navigate('/billing');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 p-4 rounded-full bg-primary/10">
            {config.icon}
          </div>
          <DialogTitle className="text-xl">
            {isPt ? config.titlePt : config.titleEn}
          </DialogTitle>
          <DialogDescription className="text-center">
            {isPt ? config.descriptionPt : config.descriptionEn}
            {currentCount !== undefined && limit !== undefined && (
              <span className="block mt-2 font-medium text-foreground">
                {isPt 
                  ? `Você está usando ${currentCount} de ${limit} disponíveis.`
                  : `You're using ${currentCount} of ${limit} available.`}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Benefits */}
          <div className="bg-muted/50 rounded-lg p-4">
            <p className="text-sm font-medium mb-2">
              {isPt ? 'Com o plano Premium você tem:' : 'With Premium plan you get:'}
            </p>
            <ul className="space-y-1.5 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                {isPt ? 'Empresas ilimitadas' : 'Unlimited companies'}
              </li>
              <li className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                {isPt ? 'Documentos ilimitados' : 'Unlimited documents'}
              </li>
              <li className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                {isPt ? 'Transações ilimitadas' : 'Unlimited transactions'}
              </li>
              <li className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                {isPt ? 'GodMode (Assistente IA)' : 'GodMode (AI Assistant)'}
              </li>
              <li className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                {isPt ? 'Scanner de recibos' : 'Receipt scanner'}
              </li>
              <li className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                {isPt ? 'Importação de extratos' : 'Bank statement import'}
              </li>
            </ul>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              {isPt ? 'Depois' : 'Later'}
            </Button>
            <Button onClick={handleUpgrade} className="flex-1">
              <Crown className="h-4 w-4 mr-2" />
              {isPt ? 'Fazer Upgrade' : 'Upgrade Now'}
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            {isPt ? '✨ 7 dias grátis em qualquer plano!' : '✨ 7 days free on any plan!'}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
