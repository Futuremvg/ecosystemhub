import { useEffect, useRef, useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ChevronLeft, 
  Plus, 
  History, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Send,
  Radio
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useGodMode } from "@/hooks/useGodMode";
import { useAudioAnalyzer } from "@/hooks/useAudioAnalyzer";
import { RadioWaves } from "@/components/god-mode/RadioWaves";
import { AudioWaveform } from "@/components/god-mode/AudioWaveform";
import { useAppSettings } from "@/contexts/AppSettingsContext";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

export default function GodModeFullscreen() {
  const navigate = useNavigate();
  const { t, language } = useAppSettings();
  const [input, setInput] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const {
    messages,
    conversations,
    isLoading,
    godState,
    isListening,
    isSpeaking,
    transcription,
    sendMessage,
    startVoice,
    stopVoice,
    toggleSpeech,
    clearTranscription,
    newConversation,
    selectConversation,
    isLoadingHistory,
  } = useGodMode();

  const { frequencies, volume, isAnalyzing, startAnalyzing, stopAnalyzing } = useAudioAnalyzer();

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoading]);

  // Start/stop audio analyzer based on listening state
  useEffect(() => {
    if (isListening && !isAnalyzing) {
      startAnalyzing();
    } else if (!isListening && isAnalyzing) {
      stopAnalyzing();
    }
  }, [isListening, isAnalyzing, startAnalyzing, stopAnalyzing]);

  // Handle transcription
  useEffect(() => {
    if (transcription) {
      setInput(transcription);
      clearTranscription();
    }
  }, [transcription, clearTranscription]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      sendMessage(input.trim());
      setInput("");
    }
  }, [input, isLoading, sendMessage]);

  const handleVoiceToggle = useCallback(() => {
    if (isListening) {
      stopVoice();
    } else {
      startVoice();
    }
  }, [isListening, startVoice, stopVoice]);

  const handleNewConversation = useCallback(() => {
    newConversation();
    setShowHistory(false);
  }, [newConversation]);

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-background/80" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-primary/3 rounded-full blur-[100px]" />
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-4 py-3 border-b border-border/30 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="h-9 w-9"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium tracking-wide uppercase opacity-80">
              God Mode
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Live Indicator */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-[10px] uppercase tracking-widest text-primary font-medium">
              Live
            </span>
          </div>

          {/* New Conversation */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleNewConversation}
            className="h-9 w-9"
            title="Nova conversa"
          >
            <Plus className="w-4 h-4" />
          </Button>

          {/* History */}
          <Sheet open={showHistory} onOpenChange={setShowHistory}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9"
                title="Histórico"
              >
                <History className="w-4 h-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80">
              <SheetHeader>
                <SheetTitle>Histórico de Conversas</SheetTitle>
              </SheetHeader>
              <div className="mt-4 space-y-2">
                {isLoadingHistory ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    Carregando...
                  </div>
                ) : conversations.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    Nenhuma conversa anterior
                  </div>
                ) : (
                  conversations.map((conv) => (
                    <button
                      key={conv.id}
                      onClick={() => {
                        selectConversation(conv.id);
                        setShowHistory(false);
                      }}
                      className="w-full text-left p-3 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <p className="text-sm font-medium truncate">{conv.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {conv.messageCount} mensagens • {conv.lastMessage.toLocaleDateString()}
                      </p>
                    </button>
                  ))
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 flex flex-col min-h-0">
        {/* Radio Waves Visualizer */}
        <div className="relative h-64 md:h-80 flex items-center justify-center shrink-0">
          <RadioWaves state={godState} className="scale-75 md:scale-100" />
          
          {/* Audio Waveform Overlay */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
            <AudioWaveform
              frequencies={frequencies}
              volume={volume}
              isActive={isListening}
              className="h-12"
            />
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 min-h-0 overflow-y-auto px-4">
          <div className="max-w-2xl mx-auto space-y-4 pb-4">
            {messages.length === 0 && !isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-8"
              >
                <p className="text-muted-foreground text-sm">
                  {language.startsWith("pt") 
                    ? "Olá! Sou seu conselheiro executivo. Como posso ajudar?" 
                    : "Hello! I'm your executive advisor. How can I help?"}
                </p>
              </motion.div>
            )}

            <AnimatePresence mode="popLayout">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={cn(
                    "flex gap-3",
                    message.role === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[85%] rounded-2xl px-4 py-3",
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted/50 backdrop-blur-sm border border-border/30"
                    )}
                  >
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">
                      {message.content}
                    </p>
                    <p className="text-[10px] opacity-50 mt-2">
                      {message.timestamp.toLocaleTimeString(language, {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Loading indicator */}
            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-start"
              >
                <div className="bg-muted/50 backdrop-blur-sm rounded-2xl px-4 py-3 border border-border/30">
                  <div className="flex gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-primary animate-bounce" />
                    <div className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:0.2s]" />
                    <div className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>
      </main>

      {/* Input Area */}
      <div className="relative z-10 p-4 border-t border-border/30 backdrop-blur-md bg-background/80 shrink-0">
        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto flex gap-3">
          {/* Voice Button */}
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleVoiceToggle}
            className={cn(
              "h-12 w-12 shrink-0 rounded-full transition-all",
              isListening && "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/25"
            )}
          >
            {isListening ? (
              <MicOff className="w-5 h-5" />
            ) : (
              <Mic className="w-5 h-5" />
            )}
          </Button>

          {/* Text Input */}
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isListening 
              ? (language.startsWith("pt") ? "Ouvindo..." : "Listening...") 
              : (language.startsWith("pt") ? "Digite ou use o microfone..." : "Type or use the microphone...")}
            disabled={isLoading}
            className="h-12 flex-1 rounded-full px-5 bg-muted/50 border-border/30"
          />

          {/* Speech Toggle */}
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={toggleSpeech}
            className="h-12 w-12 shrink-0 rounded-full"
          >
            {isSpeaking ? (
              <VolumeX className="w-5 h-5" />
            ) : (
              <Volume2 className="w-5 h-5" />
            )}
          </Button>

          {/* Send Button */}
          <Button
            type="submit"
            disabled={!input.trim() || isLoading}
            size="icon"
            className="h-12 w-12 shrink-0 rounded-full bg-primary hover:bg-primary/90"
          >
            <Send className="w-5 h-5" />
          </Button>
        </form>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes siri-orbit-0 {
          from { transform: rotate(0deg) translateX(100px) rotate(0deg); }
          to { transform: rotate(360deg) translateX(100px) rotate(-360deg); }
        }
        @keyframes siri-orbit-1 {
          from { transform: rotate(90deg) translateX(120px) rotate(-90deg); }
          to { transform: rotate(450deg) translateX(120px) rotate(-450deg); }
        }
        @keyframes siri-orbit-2 {
          from { transform: rotate(180deg) translateX(140px) rotate(-180deg); }
          to { transform: rotate(540deg) translateX(140px) rotate(-540deg); }
        }
        @keyframes siri-orbit-3 {
          from { transform: rotate(270deg) translateX(160px) rotate(-270deg); }
          to { transform: rotate(630deg) translateX(160px) rotate(-630deg); }
        }
        @keyframes siri-float {
          0%, 100% { transform: translateY(0) scale(1); opacity: 0.6; }
          50% { transform: translateY(-20px) scale(1.1); opacity: 1; }
        }
        @keyframes siri-morph {
          0%, 100% { border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%; }
          25% { border-radius: 30% 60% 70% 40% / 50% 60% 30% 60%; }
          50% { border-radius: 50% 60% 30% 60% / 30% 60% 70% 40%; }
          75% { border-radius: 60% 40% 60% 30% / 70% 30% 50% 60%; }
        }
        @keyframes siri-pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        @keyframes siri-breathe {
          0%, 100% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.1); opacity: 0.8; }
        }
        @keyframes ping-slow {
          0% { transform: scale(1); opacity: 0.8; }
          50% { transform: scale(1.05); opacity: 0.4; }
          100% { transform: scale(1.1); opacity: 0; }
        }
        .animate-ping-slow {
          animation: ping-slow 2s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
      `}</style>
    </div>
  );
}
