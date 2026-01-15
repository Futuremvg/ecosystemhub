import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import { useGodMode } from "@/hooks/useGodMode";
import { useSubscriptionLimits } from "@/hooks/useSubscriptionLimits";
import { Loader2, Sparkles, Zap, MessageCircle, Mic, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UpgradeModal } from "@/components/ui/UpgradeModal";

export default function Assistente() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { canUseFeature, isSubscribed, loading: limitsLoading } = useSubscriptionLimits();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  
  const canUseGodMode = canUseFeature('godMode');
  
  const {
    messages,
    isLoading,
    isLoadingHistory,
    godState,
    isListening,
    isSpeaking,
    transcription,
    sendMessage,
    startVoice,
    stopVoice,
    toggleSpeech,
    clearHistory,
    clearTranscription,
  } = useGodMode();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  if (loading || isLoadingHistory || limitsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-god-gold mx-auto" />
          <p className="text-sm text-muted-foreground mt-2">
            {isLoadingHistory ? "Carregando histórico..." : "Carregando..."}
          </p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  // If user is not subscribed, show upgrade prompt
  if (!canUseGodMode) {
    return (
      <AppLayout>
        <div className="space-y-6 animate-fade-in max-w-full overflow-x-hidden">
          {/* Header */}
          <div className="text-center py-8">
            <div className="relative inline-block">
              <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-muted via-muted to-muted-foreground/20 flex items-center justify-center opacity-50">
                <Sparkles className="w-12 h-12 text-muted-foreground" />
              </div>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold mt-6">God Mode</h1>
            <p className="text-muted-foreground mt-2">
              Recurso Premium
            </p>
          </div>

          {/* Locked Card */}
          <Card className="material-card max-w-lg mx-auto border-primary/20">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Sparkles className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">GodMode é um recurso Premium</h3>
              <p className="text-muted-foreground mb-6">
                Desbloqueie o assistente de voz com IA para comandar suas finanças por texto ou voz.
              </p>
              <Button onClick={() => navigate('/billing')} className="w-full">
                <Sparkles className="w-4 h-4 mr-2" />
                Fazer Upgrade • 7 dias grátis
              </Button>
            </CardContent>
          </Card>

          {/* Features Preview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto px-2 opacity-50">
            <Card className="material-card text-center">
              <CardContent className="pt-6">
                <div className="w-12 h-12 mx-auto rounded-full bg-muted flex items-center justify-center mb-3">
                  <MessageCircle className="w-6 h-6 text-muted-foreground" />
                </div>
                <h3 className="font-medium text-sm">Chat por Texto</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Digite suas perguntas e comandos
                </p>
              </CardContent>
            </Card>

            <Card className="material-card text-center">
              <CardContent className="pt-6">
                <div className="w-12 h-12 mx-auto rounded-full bg-muted flex items-center justify-center mb-3">
                  <Mic className="w-6 h-6 text-muted-foreground" />
                </div>
                <h3 className="font-medium text-sm">Comando de Voz</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Fale diretamente com o assistente
                </p>
              </CardContent>
            </Card>

            <Card className="material-card text-center">
              <CardContent className="pt-6">
                <div className="w-12 h-12 mx-auto rounded-full bg-muted flex items-center justify-center mb-3">
                  <Zap className="w-6 h-6 text-muted-foreground" />
                </div>
                <h3 className="font-medium text-sm">Respostas Rápidas</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Insights instantâneos do seu negócio
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
        <UpgradeModal 
          open={showUpgradeModal} 
          onOpenChange={setShowUpgradeModal}
          feature="godMode"
        />
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in max-w-full overflow-x-hidden">
        {/* Header */}
        <div className="text-center py-8">
          <div className="relative inline-block">
            <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-god-gold via-god-gold-glow to-god-gold-dark flex items-center justify-center shadow-god-glow animate-pulse-gold">
              <Sparkles className="w-12 h-12 text-sidebar" />
            </div>
            <span className="absolute bottom-1 right-1 w-6 h-6 bg-financial-positive rounded-full border-4 border-background" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold mt-6">God Mode</h1>
          <p className="text-muted-foreground mt-2">
            Sua segunda mente está pronta para ajudar
          </p>
          {messages.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearHistory}
              className="mt-4 text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Limpar histórico
            </Button>
          )}
        </div>

        {/* Quick Tips */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto px-2">
          <Card className="material-card text-center">
            <CardContent className="pt-6">
              <div className="w-12 h-12 mx-auto rounded-full bg-god-gold/10 flex items-center justify-center mb-3">
                <MessageCircle className="w-6 h-6 text-god-gold" />
              </div>
              <h3 className="font-medium text-sm">Chat por Texto</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Digite suas perguntas e comandos
              </p>
            </CardContent>
          </Card>

          <Card className="material-card text-center">
            <CardContent className="pt-6">
              <div className="w-12 h-12 mx-auto rounded-full bg-god-gold/10 flex items-center justify-center mb-3">
                <Mic className="w-6 h-6 text-god-gold" />
              </div>
              <h3 className="font-medium text-sm">Comando de Voz</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Fale diretamente com o assistente
              </p>
            </CardContent>
          </Card>

          <Card className="material-card text-center">
            <CardContent className="pt-6">
              <div className="w-12 h-12 mx-auto rounded-full bg-god-gold/10 flex items-center justify-center mb-3">
                <Zap className="w-6 h-6 text-god-gold" />
              </div>
              <h3 className="font-medium text-sm">Respostas Rápidas</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Insights instantâneos do seu negócio
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Example Commands */}
        <Card className="material-card max-w-3xl mx-auto">
          <CardContent className="p-6">
            <h3 className="font-medium mb-4 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-god-gold" />
              Experimente comandar:
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                "Cria uma empresa chamada Tech Corp",
                "Adiciona uma despesa de 200 reais de Internet",
                "Adiciona uma receita de 5000 do Cliente ABC",
                "Qual é meu resumo financeiro do mês?",
                "Adiciona link do Figma na categoria Design",
                "Lista meus documentos",
              ].map((command, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(command)}
                  className="text-left p-3 rounded-lg bg-muted/50 hover:bg-muted text-sm transition-colors group"
                >
                  <span className="text-muted-foreground group-hover:text-foreground">
                    "{command}"
                  </span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="material-card border-god-gold/20 bg-god-gold/5 max-w-3xl mx-auto">
          <CardContent className="p-4 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-god-gold/10 shrink-0">
              <Sparkles className="w-5 h-5 text-god-gold" />
            </div>
            <div>
              <h4 className="font-medium text-foreground">Autonomia Total</h4>
              <p className="text-sm text-muted-foreground">
                O God Mode pode criar empresas, adicionar transações, gerenciar links do ecossistema, registrar documentos e muito mais.
                Basta pedir por texto ou voz - ele executa automaticamente!
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
      {/* FloatingChat is now rendered globally in AppLayout - no need for duplicate here */}
    </AppLayout>
  );
}
