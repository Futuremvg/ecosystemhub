import { useState, useRef, useEffect } from "react";
import { Send, Mic, MicOff, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { GodEye, GodModeState } from "./GodEye";
import { useAppSettings } from "@/contexts/AppSettingsContext";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface GodChatProps {
  messages: Message[];
  isLoading: boolean;
  godState: GodModeState;
  onSendMessage: (message: string) => void;
  onStartVoice: () => void;
  onStopVoice: () => void;
  isListening: boolean;
  isSpeaking: boolean;
  onToggleSpeech: () => void;
  transcription?: string;
  onClearTranscription?: () => void;
}

export function GodChat({
  messages,
  isLoading,
  godState,
  onSendMessage,
  onStartVoice,
  onStopVoice,
  isListening,
  isSpeaking,
  onToggleSpeech,
  transcription,
  onClearTranscription,
}: GodChatProps) {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastTranscriptionRef = useRef<string>("");
  const { language, t } = useAppSettings();
  
  // When transcription arrives, put it in the input field (avoid duplicates)
  useEffect(() => {
    if (transcription && transcription !== lastTranscriptionRef.current) {
      lastTranscriptionRef.current = transcription;
      // Replace input entirely with new transcription (don't accumulate)
      setInput(transcription);
      onClearTranscription?.();
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 100);
    }
  }, [transcription, onClearTranscription]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTo({
          top: scrollRef.current.scrollHeight,
          behavior: 'smooth'
        });
      }
    }, 100);
  }, [messages, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSendMessage(input.trim());
      setInput("");
    }
  };

  const handleVoiceClick = () => {
    if (isListening) {
      onStopVoice();
    } else {
      onStartVoice();
    }
  };

  return (
    <div className="flex flex-col h-full max-h-[calc(100vh-12rem)]">
      {/* God Eye Header */}
      <div className="flex justify-center py-6">
        <GodEye
          state={godState}
          size="md"
          onClick={handleVoiceClick}
        />
      </div>

      {/* Messages - use native scrollable div for reliable scrolling */}
      <div 
        ref={scrollRef}
        className="flex-1 px-4 overflow-y-auto"
        style={{ overscrollBehavior: 'contain' }}
      >
        <div className="space-y-4 pb-4">
          {messages.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground text-sm">
                {t("assistant.hello")} {t("assistant.howCanHelp")}
              </p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex gap-3 animate-fade-in",
                  message.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "max-w-[80%] rounded-2xl px-4 py-3",
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  <p className="text-[10px] opacity-50 mt-1">
                    {message.timestamp.toLocaleTimeString(language, {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            ))
          )}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-2xl px-4 py-3">
                <div className="flex gap-1">
                  <div className="w-2 h-2 rounded-full bg-god-gold animate-bounce" />
                  <div className="w-2 h-2 rounded-full bg-god-gold animate-bounce [animation-delay:0.2s]" />
                  <div className="w-2 h-2 rounded-full bg-god-gold animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-border">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleVoiceClick}
            className={cn(
              "shrink-0",
              isListening && "bg-god-gold text-god-gold-dark border-god-gold"
            )}
          >
            {isListening ? (
              <MicOff className="w-4 h-4" />
            ) : (
              <Mic className="w-4 h-4" />
            )}
          </Button>

          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isListening ? t("assistant.listening") : t("assistant.typeOrMic")}
            disabled={isLoading}
            className="flex-1"
          />

          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={onToggleSpeech}
            className="shrink-0"
          >
            {isSpeaking ? (
              <VolumeX className="w-4 h-4" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </Button>

          <Button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="shrink-0 bg-god-gold text-god-gold-dark hover:bg-god-gold-glow"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}