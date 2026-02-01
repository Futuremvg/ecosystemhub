import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAppSettings } from "@/contexts/AppSettingsContext";
import { Clock, ArrowLeft } from "lucide-react";

export default function ComingSoon() {
  const navigate = useNavigate();
  const { language } = useAppSettings();
  const isPt = language === 'pt-BR';

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center space-y-6 max-w-md">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
          <Clock className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-2xl font-light">
          {isPt ? "Em breve" : "Coming Soon"}
        </h1>
        <p className="text-muted-foreground text-sm">
          {isPt 
            ? "Esta funcionalidade está sendo desenvolvida e estará disponível em breve."
            : "This feature is being developed and will be available soon."}
        </p>
        <Button
          variant="outline"
          onClick={() => navigate(-1)}
          className="gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          {isPt ? "Voltar" : "Go Back"}
        </Button>
      </div>
    </div>
  );
}
