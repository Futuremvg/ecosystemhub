import { useState, useRef, useEffect, useCallback, useLayoutEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useGodMode } from "@/hooks/useGodMode";
import { useAudioAnalyzer } from "@/hooks/useAudioAnalyzer";
import { useSubscriptionLimits } from "@/hooks/useSubscriptionLimits";
import { useAppSettings } from "@/contexts/AppSettingsContext";
import { RadioWaves } from "@/components/god-mode/RadioWaves";
import { AudioWaveform } from "@/components/god-mode/AudioWaveform";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  ArrowLeft, 
  Send, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX,
  Loader2,
  Sparkles,
  Trash2,
  History,
  Plus,
  Wifi
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export default function GodModeFullscreen() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { canUseFeature, loading: limitsLoading } = useSubscriptionLimits();
  const { language, t } = useAppSettings();
  const isPt = language.startsWith('pt');
  
  const [input, setInput] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastTranscriptionRef = useRef<string>("");
  
  const canUseGodMode = canUseFeature('godMode');
  
  // Audio analyzer for reactive waveform
  const { 
    volume, 
    frequencies, 
    isAnalyzing, 
    startAnalyzing, 
    stopAnalyzing 
  } = useAudioAnalyzer();
  
  const {
    messages,
    conversations,
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
    newConversation,
    selectConversation,
    clearHistory,
    clearTranscription,
  } = useGodMode();

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  // Redirect if not premium
  useEffect(() => {
    if (!limitsLoading && !canUseGodMode) {
      navigate("/assistente");
    }
  }, [canUseGodMode, limitsLoading, navigate]);

  // Handle transcription
  useEffect(() => {
    if (transcription && transcription !== lastTranscriptionRef.current) {
      lastTranscriptionRef.current = transcription;
      setInput(transcription);
      clearTranscription?.();
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [transcription, clearTranscription]);

  // Auto-scroll function - more reliable approach
  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    // Use requestAnimationFrame to ensure DOM is updated before scrolling
    requestAnimationFrame(() => {
      if (scrollRef.current) {
        const scrollElement = scrollRef.current;
        scrollElement.scrollTo({
          top: scrollElement.scrollHeight,
          behavior
        });
      }
    });
  }, []);

  // Auto-scroll when messages change
  useLayoutEffect(() => {
    if (messages.length > 0) {
      // Small delay to account for framer-motion animation
      const timer = setTimeout(() => scrollToBottom('smooth'), 150);
      return () => clearTimeout(timer);
    }
  }, [messages.length, scrollToBottom]);

  // Also scroll when loading state changes (for typing indicator)
  useEffect(() => {
    if (isLoading) {
      scrollToBottom('smooth');
    }
  }, [isLoading, scrollToBottom]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      sendMessage(input.trim());
      setInput("");
    }
  };

  const handleVoiceClick = () => {
    if (isListening) {
      stopVoice();
      stopAnalyzing();
    } else {
      startVoice();
      startAnalyzing();
    }
  };

  if (loading || isLoadingHistory || limitsLoading) {
    return (
      <div className="fixed inset-0 bg-sidebar flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          <p className="text-sm text-white/60 mt-2">
            {isLoadingHistory ? (isPt ? "Carregando histórico..." : "Loading history...") : (isPt ? "Carregando..." : "Loading...")}
          </p>
        </div>
      </div>
    );
  }

  if (!user || !canUseGodMode) return null;

  return (
    <div className="fixed inset-0 bg-sidebar flex flex-col overflow-hidden">
      {/* Ambient Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute top-1/4 left-1/4 w-[300px] h-[300px] bg-primary/3 rounded-full blur-2xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-white/2 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between p-4 border-b border-white/10">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
          className="text-white/70 hover:text-white hover:bg-white/10"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <span className="font-semibold text-white">God Mode AI</span>
          {/* Realtime sync indicator */}
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/20 text-primary text-[10px] font-medium">
            <Wifi className="w-3 h-3" />
            <span>LIVE</span>
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowHistory(!showHistory)}
            className="text-white/70 hover:text-white hover:bg-white/10"
          >
            <History className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={newConversation}
            className="text-white/70 hover:text-white hover:bg-white/10"
          >
            <Plus className="w-5 h-5" />
          </Button>
        </div>
      </header>

      {/* History Sidebar */}
      <AnimatePresence>
        {showHistory && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 bottom-0 w-80 max-w-[85vw] bg-sidebar-accent z-50 border-l border-white/10 flex flex-col"
          >
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <h3 className="font-semibold text-white">{isPt ? 'Histórico' : 'History'}</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowHistory(false)}
                className="text-white/70"
              >
                ✕
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              {conversations.length === 0 ? (
                <p className="text-white/50 text-sm text-center py-4">
                  {isPt ? 'Nenhuma conversa ainda' : 'No conversations yet'}
                </p>
              ) : (
                conversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => {
                      selectConversation(conv.id);
                      setShowHistory(false);
                    }}
                    className="w-full text-left p-3 rounded-lg hover:bg-white/10 transition-colors mb-1"
                  >
                    <p className="text-white text-sm font-medium truncate">{conv.title}</p>
                    <p className="text-white/50 text-xs truncate mt-1">
                      {new Date(conv.lastMessage).toLocaleDateString(language)}
                    </p>
                  </button>
                ))
              )}
            </div>
            {conversations.length > 0 && (
              <div className="p-4 border-t border-white/10">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearHistory}
                  className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {isPt ? 'Limpar tudo' : 'Clear all'}
                </Button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content - min-h-0 allows flex children to scroll properly */}
      <div className="relative z-10 flex-1 flex flex-col min-h-0">
        {/* Radio Waves Visual - Center when no messages */}
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center">
            <button
              onClick={handleVoiceClick}
              className="relative cursor-pointer transition-transform hover:scale-105 active:scale-95"
            >
              <RadioWaves state={godState} className="w-80 h-80" />
              {/* Audio reactive waveform overlay */}
              {isAnalyzing && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <AudioWaveform 
                    frequencies={frequencies} 
                    volume={volume} 
                    isActive={isAnalyzing}
                    className="absolute bottom-1/4"
                  />
                </div>
              )}
            </button>
            
            <div className="mt-8 text-center">
              <h2 className="text-2xl font-bold text-white mb-2">
                {isPt ? 'Conselheiro Executivo' : 'Executive Advisor'}
              </h2>
              <p className="text-white/60 text-sm max-w-xs mx-auto">
                {godState === "listening" 
                  ? (isPt ? "Estou ouvindo..." : "I'm listening...") 
                  : godState === "processing"
                  ? (isPt ? "Processando..." : "Processing...")
                  : (isPt ? "Toque no centro para falar ou digite abaixo" : "Tap the center to speak or type below")}
              </p>
              {isAnalyzing && (
                <div className="mt-4 flex items-center justify-center gap-2">
                  <div 
                    className="w-2 h-2 rounded-full bg-primary animate-pulse"
                    style={{ transform: `scale(${0.8 + volume * 1.5})` }}
                  />
                  <span className="text-xs text-primary font-medium">
                    {isPt ? 'Volume detectado' : 'Volume detected'}: {Math.round(volume * 100)}%
                  </span>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Chat Messages */
          <div className="flex-1 flex flex-col min-h-0">
            {/* Compact Radio Waves Header - shrink-0 to prevent it from growing */}
            <div className="flex flex-col items-center py-4 shrink-0">
              <button
                onClick={handleVoiceClick}
                className="relative cursor-pointer transition-transform hover:scale-105 active:scale-95"
              >
                <RadioWaves state={godState} className="w-32 h-32" />
              </button>
              {/* Compact waveform when in chat mode */}
              {isAnalyzing && (
                <AudioWaveform 
                  frequencies={frequencies} 
                  volume={volume} 
                  isActive={isAnalyzing}
                  className="mt-2 h-8"
                />
              )}
            </div>

            {/* Messages - min-h-0 is critical for flex scroll to work */}
            <div 
              ref={scrollRef}
              className="flex-1 min-h-0 overflow-y-auto px-4 scroll-smooth"
              style={{ 
                overscrollBehavior: 'contain',
                WebkitOverflowScrolling: 'touch'
              }}
            >
              <div className="max-w-2xl mx-auto space-y-4 pb-6 pt-2">
                {messages.map((message, index) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ 
                      duration: 0.25,
                      delay: index === messages.length - 1 ? 0.05 : 0
                    }}
                    onAnimationComplete={() => {
                      // Ensure scroll after animation completes for the last message
                      if (index === messages.length - 1) {
                        scrollToBottom('smooth');
                      }
                    }}
                    className={cn(
                      "flex gap-3",
                      message.role === "user" ? "justify-end" : "justify-start"
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-[85%] rounded-2xl px-4 py-3 shadow-sm",
                        message.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-white/10 text-white backdrop-blur-sm"
                      )}
                    >
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                      <p className="text-[10px] opacity-50 mt-1.5">
                        {new Date(message.timestamp).toLocaleTimeString(language, {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </motion.div>
                ))}

                {isLoading && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-start"
                  >
                    <div className="bg-white/10 rounded-2xl px-4 py-3 backdrop-blur-sm">
                      <div className="flex gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-primary animate-bounce" />
                        <div className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:0.15s]" />
                        <div className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:0.3s]" />
                      </div>
                    </div>
                  </motion.div>
                )}
                
                {/* Invisible anchor element for reliable scroll-to-bottom */}
                <div aria-hidden="true" className="h-1" />
              </div>
            </div>
          </div>
        )}

        {/* Input Area - shrink-0 prevents compression */}
        <div className="shrink-0 p-4 border-t border-white/10 bg-sidebar/80 backdrop-blur-xl">
          <form onSubmit={handleSubmit} className="flex gap-2 max-w-2xl mx-auto">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleVoiceClick}
              className={cn(
                "shrink-0 text-white/70 hover:text-white hover:bg-white/10",
                isListening && "bg-primary text-primary-foreground hover:bg-primary/90"
              )}
            >
              {isListening ? (
                <MicOff className="w-5 h-5" />
              ) : (
                <Mic className="w-5 h-5" />
              )}
            </Button>

            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={isListening 
                ? (isPt ? "Ouvindo..." : "Listening...") 
                : (isPt ? "Digite ou fale seu comando..." : "Type or speak your command...")}
              disabled={isLoading}
              className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-primary"
            />

            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={toggleSpeech}
              className="shrink-0 text-white/70 hover:text-white hover:bg-white/10"
            >
              {isSpeaking ? (
                <VolumeX className="w-5 h-5" />
              ) : (
                <Volume2 className="w-5 h-5" />
              )}
            </Button>

            <Button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="shrink-0 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Send className="w-5 h-5" />
            </Button>
          </form>
        </div>
      </div>

      {/* Custom Styles */}
      <style>{`
        @keyframes morph {
          0%, 100% {
            border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%;
          }
          50% {
            border-radius: 30% 60% 70% 40% / 50% 60% 30% 60%;
          }
        }
        
        @keyframes ping-slow {
          0% {
            transform: scale(1);
            opacity: 0.6;
          }
          75%, 100% {
            transform: scale(1.8);
            opacity: 0;
          }
        }
        
        .animate-ping-slow {
          animation: ping-slow 2s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
      `}</style>
    </div>
  );
}
