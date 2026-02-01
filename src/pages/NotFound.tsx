import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useAppSettings } from "@/contexts/AppSettingsContext";
import { Home, AlertCircle } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { language } = useAppSettings();
  const isPt = language === 'pt-BR';

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-full items-center justify-center p-4">
      <div className="text-center space-y-6 max-w-md">
        <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
          <AlertCircle className="w-8 h-8 text-destructive" />
        </div>
        <h1 className="text-5xl font-extralight">404</h1>
        <p className="text-lg text-muted-foreground">
          {isPt ? "Página não encontrada" : "Page not found"}
        </p>
        <p className="text-sm text-muted-foreground/70">
          {isPt 
            ? `A rota "${location.pathname}" não existe.`
            : `The route "${location.pathname}" doesn't exist.`}
        </p>
        <Button onClick={() => navigate("/dashboard")} className="gap-2">
          <Home className="w-4 h-4" />
          {isPt ? "Voltar ao Início" : "Go Home"}
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
