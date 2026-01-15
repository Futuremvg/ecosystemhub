import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Send, Mic, MicOff, X, Sparkles, Edit3, Plus, Paperclip, FileSpreadsheet, Image, File, History, MessageSquare, ChevronLeft, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { GodModeState } from "./GodEye";
import { useAppSettings } from "@/contexts/AppSettingsContext";
import { toast } from "@/hooks/use-toast";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface Conversation {
  id: string;
  title: string;
  lastMessage: Date;
  messageCount: number;
}

interface FloatingChatProps {
  messages: Message[];
  isLoading: boolean;
  godState: GodModeState;
  onSendMessage: (message: string) => void;
  onStartVoice: () => void;
  onStopVoice: () => void;
  isListening: boolean;
  transcription?: string;
  onClearTranscription?: () => void;
  onClearHistory?: () => void;
  conversations?: Conversation[];
  onSelectConversation?: (id: string) => void;
  onNewConversation?: () => void;
  currentConversationId?: string;
}

export function FloatingChat({
  messages,
  isLoading,
  godState,
  onSendMessage,
  onStartVoice,
  onStopVoice,
  isListening,
  transcription,
  onClearTranscription,
  onClearHistory,
  conversations = [],
  onSelectConversation,
  onNewConversation,
  currentConversationId,
}: FloatingChatProps) {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [input, setInput] = useState("");
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const lastTranscriptionRef = useRef<string>("");
  const { t } = useAppSettings();

  // When transcription arrives, put it in the input field (avoid duplicates)
  useEffect(() => {
    if (transcription && transcription !== lastTranscriptionRef.current) {
      lastTranscriptionRef.current = transcription;
      // Replace input entirely with new transcription (don't accumulate)
      setInput(transcription);
      onClearTranscription?.();
      // Open chat and focus textarea so user can review/edit
      setIsOpen(true);
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          textareaRef.current.selectionStart = textareaRef.current.value.length;
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

  useEffect(() => {
    if (isOpen && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isOpen]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (input.trim() && !isLoading) {
      let messageContent = input.trim();
      if (attachedFile) {
        messageContent = `[📎 ${attachedFile.name}]\n\n${messageContent}`;
      }
      onSendMessage(messageContent);
      setInput("");
      setAttachedFile(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleVoiceClick = () => {
    if (isListening) {
      onStopVoice();
    } else {
      onStartVoice();
    }
  };

  // Handle floating button click - just open chat, don't auto-start voice
  const handleFloatingButtonClick = () => {
    setIsOpen(!isOpen);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: t("common.error"),
          description: "File too large. Max 10MB.",
          variant: "destructive"
        });
        return;
      }
      setAttachedFile(file);
      toast({
        title: t("documents.fileUploaded") || "File attached",
        description: file.name
      });
    }
    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (['xlsx', 'xls', 'csv'].includes(ext || '')) return <FileSpreadsheet className="w-4 h-4" />;
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) return <Image className="w-4 h-4" />;
    return <File className="w-4 h-4" />;
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set dragging to false if we're leaving the drop zone entirely
    if (dropZoneRef.current && !dropZoneRef.current.contains(e.relatedTarget as Node)) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: t("common.error"),
          description: "File too large. Max 10MB.",
          variant: "destructive"
        });
        return;
      }
      setAttachedFile(file);
      toast({
        title: t("documents.fileUploaded") || "File attached",
        description: file.name
      });
    }
  };

  return (
    <>
      {/* Floating Button - positioned higher to avoid overlap */}
      <button
        onClick={handleFloatingButtonClick}
        className={cn(
          "fixed z-[60] w-12 h-12 sm:w-13 sm:h-13 rounded-full",
          "flex items-center justify-center transition-all duration-300",
          "hover:scale-105 active:scale-95",
          "bottom-20 right-4 sm:bottom-24 sm:right-6",
          "shadow-lg",
          isListening 
            ? "bg-primary animate-pulse" 
            : "bg-gradient-to-br from-primary to-primary/80 hover:shadow-glow",
          isOpen && "scale-0 opacity-0 pointer-events-none"
        )}
        style={{ boxShadow: isListening ? 'var(--shadow-god)' : undefined }}
      >
        {isListening ? (
          <Mic className="w-5 h-5 text-primary-foreground animate-pulse" />
        ) : (
          <Sparkles className="w-5 h-5 text-primary-foreground" />
        )}
      </button>

      {/* Chat Window */}
      <div
        ref={dropZoneRef}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={cn(
          "fixed z-[60] w-[380px] max-w-[calc(100vw-1.5rem)]",
          "bottom-20 right-3 sm:bottom-24 sm:right-6",
          "bg-card border border-border/60 rounded-xl shadow-xl",
          "flex flex-col overflow-hidden transition-all duration-300",
          isOpen ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none",
          isDragging && "ring-2 ring-primary ring-offset-2 ring-offset-background"
        )}
        style={{ maxHeight: "min(480px, calc(100vh - 6rem))" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className={cn(
                "w-10 h-10 rounded-full bg-primary",
                "flex items-center justify-center",
                godState === "processing" && "animate-pulse"
              )}>
                <Sparkles className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className={cn(
                "absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-card",
                godState === "idle" && "bg-financial-positive",
                godState === "listening" && "bg-primary animate-pulse",
                godState === "processing" && "bg-primary",
                godState === "error" && "bg-destructive"
              )} />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-foreground">God Mode</h3>
              <p className="text-xs text-muted-foreground">
                {godState === "idle" && "Online"}
                {godState === "listening" && t("assistant.listening").split("...")[0] + "..."}
                {godState === "processing" && t("common.loading")}
                {godState === "success" && "✓"}
                {godState === "error" && "Error"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {/* Fullscreen button */}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-primary"
              onClick={() => navigate("/godmode")}
              title="God Mode Fullscreen"
            >
              <Maximize2 className="w-4 h-4" />
            </Button>
            {/* History button */}
            {conversations.length > 0 && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                onClick={() => setShowHistory(!showHistory)}
                title={t("common.history") || "History"}
              >
                <History className="w-4 h-4" />
              </Button>
            )}
            {/* New conversation button */}
            {onNewConversation && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                onClick={() => {
                  onNewConversation();
                  setShowHistory(false);
                }}
                title={t("common.newConversation") || "New conversation"}
              >
                <Plus className="w-4 h-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={() => setIsOpen(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* History Panel - Slide-over style */}
        {showHistory && conversations.length > 0 && (
          <div className="absolute inset-0 z-40 bg-card flex flex-col animate-fade-in">
            <div className="flex items-center gap-2 p-4 border-b border-border">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setShowHistory(false)}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <h3 className="font-semibold text-sm">{t("common.history") || "Conversations"}</h3>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              {conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => {
                    onSelectConversation?.(conv.id);
                    setShowHistory(false);
                  }}
                  className={cn(
                    "w-full flex items-start gap-3 p-3 rounded-lg text-left transition-colors",
                    "hover:bg-muted/50",
                    currentConversationId === conv.id && "bg-muted"
                  )}
                >
                  <MessageSquare className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{conv.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {conv.messageCount} {t("common.messages") || "messages"} • {conv.lastMessage.toLocaleDateString()}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Drag overlay */}
        {isDragging && (
          <div className="absolute inset-0 z-50 bg-primary/10 backdrop-blur-sm flex items-center justify-center rounded-2xl">
            <div className="bg-card border-2 border-dashed border-primary rounded-xl p-8 text-center">
              <Paperclip className="w-10 h-10 text-primary mx-auto mb-2" />
              <p className="text-sm font-medium text-foreground">Drop file here</p>
              <p className="text-xs text-muted-foreground">Max 10MB</p>
            </div>
          </div>
        )}

        {/* Messages - use native scrollable div for reliable scrolling */}
        <div 
          ref={scrollRef}
          className="flex-1 p-4 overflow-y-auto"
          style={{ overscrollBehavior: 'contain' }}
        >
          <div className="space-y-4">
            {messages.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-primary" />
                </div>
                <p className="text-sm font-medium text-foreground">{t("assistant.hello")} 👋</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {t("assistant.howCanHelp")}
                </p>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex animate-fade-in",
                    message.role === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[85%] rounded-2xl px-4 py-2.5",
                      message.role === "user"
                        ? "bg-primary text-primary-foreground rounded-br-md"
                        : "bg-muted text-foreground rounded-bl-md"
                    )}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    <p className={cn(
                      "text-[10px] mt-1 opacity-60"
                    )}>
                      {message.timestamp.toLocaleTimeString([], {
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
                <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 rounded-full bg-primary animate-bounce" />
                    <div className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:0.2s]" />
                    <div className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Input Area - ChatGPT style with textarea */}
        <div className="p-3 border-t border-border bg-muted/20">
          {/* Show listening indicator */}
          {isListening && (
            <div className="flex items-center gap-2 mb-2 px-2 py-1 rounded-lg bg-primary/10">
              <div className="flex gap-0.5">
                <div className="w-1 h-3 bg-primary rounded-full animate-pulse" />
                <div className="w-1 h-4 bg-primary rounded-full animate-pulse [animation-delay:0.1s]" />
                <div className="w-1 h-2 bg-primary rounded-full animate-pulse [animation-delay:0.2s]" />
                <div className="w-1 h-5 bg-primary rounded-full animate-pulse [animation-delay:0.3s]" />
                <div className="w-1 h-3 bg-primary rounded-full animate-pulse [animation-delay:0.4s]" />
              </div>
              <span className="text-xs text-primary font-medium">{t("assistant.listening")}</span>
            </div>
          )}

          {/* Attached file indicator */}
          {attachedFile && (
            <div className="flex items-center gap-2 mb-2 px-2 py-1.5 rounded-lg bg-muted">
              {getFileIcon(attachedFile.name)}
              <span className="text-xs text-foreground flex-1 truncate">{attachedFile.name}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5"
                onClick={() => setAttachedFile(null)}
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          )}
          
          <div className="relative flex items-end gap-2 bg-background rounded-xl border border-border p-2">
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".csv,.xlsx,.xls,.pdf,.jpg,.jpeg,.png,.gif,.webp,.doc,.docx,.txt"
              onChange={handleFileSelect}
            />
            
            {/* Attach file button */}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              className="h-8 w-8 rounded-full shrink-0 text-muted-foreground hover:text-foreground"
              title={t("documents.upload") || "Attach file"}
            >
              <Paperclip className="w-4 h-4" />
            </Button>
            
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isListening ? t("assistant.speechHere") : t("assistant.typeOrMic")}
              disabled={isLoading}
              className="flex-1 min-h-[40px] max-h-[120px] resize-none border-0 bg-transparent focus-visible:ring-0 text-sm py-2 px-1 text-foreground placeholder:text-muted-foreground"
              rows={1}
            />
            
            <div className="flex items-center gap-1 shrink-0 pb-0.5">
              {/* Voice button */}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={handleVoiceClick}
                className={cn(
                  "h-8 w-8 rounded-full",
                  isListening && "bg-primary text-primary-foreground hover:bg-primary/90"
                )}
              >
                {isListening ? (
                  <MicOff className="w-4 h-4" />
                ) : (
                  <Mic className="w-4 h-4 text-muted-foreground" />
                )}
              </Button>

              {/* Send button */}
              <Button
                onClick={() => handleSubmit()}
                disabled={(!input.trim() && !attachedFile) || isLoading}
                size="icon"
                className="h-8 w-8 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          {(input.trim() || attachedFile) && (
            <p className="text-[10px] text-muted-foreground mt-1.5 px-1">
              <Edit3 className="w-3 h-3 inline mr-1" />
              {t("assistant.reviewSend")}
            </p>
          )}
        </div>
      </div>
    </>
  );
}
