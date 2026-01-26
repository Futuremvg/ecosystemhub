import { useState, useCallback, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useAppSettings } from "@/contexts/AppSettingsContext";
import { GodModeState } from "@/components/god-mode/GodEye";
import { supabase } from "@/integrations/supabase/client";
// Web Speech API types
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onstart: (() => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
  }
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  actions?: ExecutedAction[];
  conversationId?: string;
}

interface ExecutedAction {
  type: string;
  data?: any;
  path?: string;
  name?: string;
}

interface Conversation {
  id: string;
  title: string;
  lastMessage: Date;
  messageCount: number;
}

export function useGodMode() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [godState, setGodState] = useState<GodModeState>("idle");
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [transcription, setTranscription] = useState("");
  const { toast } = useToast();
  const { user } = useAuth();
  const { language } = useAppSettings();
  const navigate = useNavigate();
  
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const speechSynthRef = useRef<SpeechSynthesisUtterance | null>(null);
  const sendMessageRef = useRef<(content: string) => void>(() => {});
  const userRef = useRef(user);
  const conversationIdRef = useRef<string | null>(null);
  const realtimeChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Keep refs updated
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  useEffect(() => {
    conversationIdRef.current = currentConversationId;
  }, [currentConversationId]);

  // Setup Supabase Realtime subscription for cross-device sync
  useEffect(() => {
    if (!user) return;

    // Subscribe to realtime changes on conversations table
    const channel = supabase
      .channel('god-mode-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'conversations',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log("Realtime message received:", payload);
          const newMsg = payload.new as any;
          
          // Check if this message already exists (prevent duplicates)
          setMessages(prev => {
            const exists = prev.some(m => m.id === newMsg.id);
            if (exists) return prev;
            
            const message: Message = {
              id: newMsg.id,
              role: newMsg.role,
              content: newMsg.content,
              timestamp: new Date(newMsg.created_at),
            };
            
            return [...prev, message];
          });
        }
      )
      .subscribe();

    realtimeChannelRef.current = channel;

    return () => {
      if (realtimeChannelRef.current) {
        supabase.removeChannel(realtimeChannelRef.current);
        realtimeChannelRef.current = null;
      }
    };
  }, [user]);

  // Clear transcription callback
  const clearTranscription = useCallback(() => {
    setTranscription("");
  }, []);

  // Load conversation list (not messages - start clean like ChatGPT)
  useEffect(() => {
    const loadConversationList = async () => {
      if (!user) {
        setIsLoadingHistory(false);
        return;
      }

      try {
        // Get all conversations grouped by date to create a list
        const { data, error } = await supabase
          .from("conversations")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (error) throw error;

        if (data && data.length > 0) {
          // Group messages by conversation session (messages within 30 minutes of each other)
          const groupedConversations: Map<string, { messages: any[], firstTimestamp: Date, lastTimestamp: Date }> = new Map();
          
          let currentGroupId = crypto.randomUUID();
          let lastTimestamp: Date | null = null;
          
          // Process in chronological order for grouping
          const sortedData = [...data].sort((a, b) => 
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          );
          
          for (const msg of sortedData) {
            const msgTimestamp = new Date(msg.created_at);
            
            // If more than 30 minutes since last message, start new conversation
            if (lastTimestamp && (msgTimestamp.getTime() - lastTimestamp.getTime()) > 30 * 60 * 1000) {
              currentGroupId = crypto.randomUUID();
            }
            
            if (!groupedConversations.has(currentGroupId)) {
              groupedConversations.set(currentGroupId, {
                messages: [],
                firstTimestamp: msgTimestamp,
                lastTimestamp: msgTimestamp
              });
            }
            
            const group = groupedConversations.get(currentGroupId)!;
            group.messages.push(msg);
            group.lastTimestamp = msgTimestamp;
            lastTimestamp = msgTimestamp;
          }
          
          // Convert to conversation list
          const convList: Conversation[] = [];
          groupedConversations.forEach((group, id) => {
            // Get first user message as title
            const firstUserMsg = group.messages.find(m => m.role === 'user');
            const title = firstUserMsg 
              ? firstUserMsg.content.substring(0, 40) + (firstUserMsg.content.length > 40 ? '...' : '')
              : 'Conversa';
            
            convList.push({
              id,
              title,
              lastMessage: group.lastTimestamp,
              messageCount: group.messages.length
            });
          });
          
          // Sort by most recent
          convList.sort((a, b) => b.lastMessage.getTime() - a.lastMessage.getTime());
          setConversations(convList);
        }
      } catch (error) {
        console.error("Erro ao carregar lista de conversas:", error);
      } finally {
        setIsLoadingHistory(false);
      }
    };

    loadConversationList();
  }, [user]);

  // Save message to database
  const saveMessage = useCallback(async (message: Message) => {
    if (!userRef.current) return;

    try {
      await supabase.from("conversations").insert({
        id: message.id,
        user_id: userRef.current.id,
        role: message.role,
        content: message.content,
      });
    } catch (error) {
      console.error("Erro ao salvar mensagem:", error);
    }
  }, []);

  // Keep sendMessageRef updated
  useEffect(() => {
    sendMessageRef.current = sendMessageInternal;
  });

  // Initialize Speech Recognition with dynamic language from settings
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognitionAPI) {
        const recognition = new SpeechRecognitionAPI();
        recognition.continuous = true;
        recognition.interimResults = true;
        // Use language from user settings
        recognition.lang = language;
        
        recognitionRef.current = recognition;

        let accumulatedTranscript = "";
        let finalTranscript = "";
        let lastResultTime = Date.now();
        let speechStartTime = Date.now();
        let hasStartedSpeaking = false;
        let pauseCheckInterval: ReturnType<typeof setInterval> | null = null;

        recognition.onresult = (event) => {
          let interimTranscript = "";
          let currentFinal = "";
          
          for (let i = 0; i < event.results.length; i++) {
            const result = event.results[i];
            if (result.isFinal) {
              currentFinal += result[0].transcript;
            } else {
              interimTranscript += result[0].transcript;
            }
          }
          
          // Track if user has started speaking
          if (!hasStartedSpeaking && (currentFinal || interimTranscript)) {
            hasStartedSpeaking = true;
            speechStartTime = Date.now();
            console.log("User started speaking:", interimTranscript || currentFinal);
          }
          
          // Update final transcript as we go
          if (currentFinal) {
            finalTranscript = currentFinal;
            console.log("Final transcript received:", currentFinal);
          }
          
          // Combined transcript for display
          accumulatedTranscript = (finalTranscript + " " + interimTranscript).trim();
          
          if (accumulatedTranscript) {
            lastResultTime = Date.now();
            // Show live transcript to user
            setTranscription(accumulatedTranscript);
          }
        };

        const isPt = language === 'pt-BR';
        recognition.onstart = () => {
          console.log(`🎤 Speech recognition started - listening in ${language}`);
          accumulatedTranscript = "";
          finalTranscript = "";
          lastResultTime = Date.now();
          speechStartTime = Date.now();
          hasStartedSpeaking = false;
          
          toast({
            title: isPt ? "🎤 Ouvindo..." : "🎤 Listening...",
            description: isPt 
              ? "Fale naturalmente. Vou entender quando você terminar."
              : "Speak naturally. I'll understand when you're done.",
          });
          
          // Smart pause detection - wait for natural pauses
          pauseCheckInterval = setInterval(() => {
            const timeSinceLastResult = Date.now() - lastResultTime;
            const totalSpeechTime = Date.now() - speechStartTime;
            
            // Adaptive pause threshold based on speech duration
            // Short utterances: wait 2.5 seconds
            // Longer speech: wait 3 seconds for more natural pauses
            const pauseThreshold = totalSpeechTime < 5000 ? 2500 : 3000;
            
            // Only stop if user has spoken AND has paused long enough
            if (hasStartedSpeaking && accumulatedTranscript && timeSinceLastResult > pauseThreshold) {
              console.log("✅ Natural pause detected - sending:", accumulatedTranscript);
              
              // Keep the final transcript for sending
              const messageToSend = accumulatedTranscript;
              accumulatedTranscript = "";
              finalTranscript = "";
              hasStartedSpeaking = false;
              
              recognition.stop();
              if (pauseCheckInterval) {
                clearInterval(pauseCheckInterval);
                pauseCheckInterval = null;
              }
              
              // Send the message after stopping
              if (messageToSend && sendMessageRef.current) {
                toast({
                  title: "📤 Enviando...",
                  description: messageToSend.substring(0, 50) + (messageToSend.length > 50 ? "..." : ""),
                });
                sendMessageRef.current(messageToSend);
              }
            }
            
            // Check for very long silence at start (user not speaking)
            if (!hasStartedSpeaking && timeSinceLastResult > 10000) {
              console.log("⏹️ No speech detected after 10s, stopping");
              recognition.stop();
              if (pauseCheckInterval) {
                clearInterval(pauseCheckInterval);
                pauseCheckInterval = null;
              }
              toast({
                title: isPt ? "Nenhuma fala detectada" : "No speech detected",
                description: isPt ? "Tente novamente e fale algo." : "Please try again and say something.",
              });
            }
          }, 200); // Check frequently for smooth detection
        };

        recognition.onerror = (event) => {
          console.error("Speech recognition error:", event.error);
          if (pauseCheckInterval) {
            clearInterval(pauseCheckInterval);
            pauseCheckInterval = null;
          }
          
          if (event.error === "not-allowed") {
            toast({
              title: isPt ? "Permissão negada" : "Permission denied",
              description: isPt 
                ? "Por favor, permita acesso ao microfone nas configurações do navegador."
                : "Please allow microphone access in your browser settings.",
              variant: "destructive",
            });
          } else if (event.error !== "no-speech" && event.error !== "aborted") {
            // If there's accumulated transcript, still send it
            if (accumulatedTranscript) {
              setTranscription(accumulatedTranscript);
              accumulatedTranscript = "";
              finalTranscript = "";
            }
          }
          setIsListening(false);
          setGodState("idle");
        };

        recognition.onend = () => {
          console.log("Speech recognition ended");
          if (pauseCheckInterval) {
            clearInterval(pauseCheckInterval);
            pauseCheckInterval = null;
          }
          // If we have accumulated transcript pending, send it now
          if (accumulatedTranscript) {
            console.log("Sending remaining transcript on end:", accumulatedTranscript);
            setTranscription(accumulatedTranscript);
            accumulatedTranscript = "";
            finalTranscript = "";
          }
          setIsListening(false);
          setGodState("idle");
        };
      } else {
        console.warn("Speech Recognition API not available");
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [toast, language]);

  // Speak response using Web Speech API with language detection
  const speakResponse = useCallback((text: string) => {
    if (!isSpeaking || typeof window === "undefined" || !window.speechSynthesis) return;
    
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Detect language from text content
    const hasPortuguese = /[àáâãéêíóôõúç]|você|é|não|está|são|têm|também/i.test(text);
    const detectedLang = hasPortuguese ? "pt-BR" : "en-US";
    
    utterance.lang = detectedLang;
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    
    // Find appropriate voice for detected language
    const voices = window.speechSynthesis.getVoices();
    const targetVoice = voices.find(v => v.lang.startsWith(detectedLang.split("-")[0]));
    if (targetVoice) {
      utterance.voice = targetVoice;
    }
    
    speechSynthRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [isSpeaking]);

  const toggleSpeech = useCallback(() => {
    setIsSpeaking(prev => !prev);
    if (isSpeaking) {
      window.speechSynthesis?.cancel();
    }
  }, [isSpeaking]);

  const startVoice = useCallback(() => {
    const isPt = language === 'pt-BR';
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
        setIsListening(true);
        setGodState("listening");
      } catch (error) {
        console.error("Error starting recognition:", error);
        toast({
          title: isPt ? "Erro ao iniciar microfone" : "Error starting microphone",
          description: isPt 
            ? "Verifique se seu navegador permite acesso ao microfone."
            : "Check if your browser allows microphone access.",
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: isPt ? "Reconhecimento de voz não suportado" : "Voice recognition not supported",
        description: isPt 
          ? "Seu navegador não suporta reconhecimento de voz. Use o chat de texto."
          : "Your browser doesn't support voice recognition. Use the text chat.",
        variant: "destructive",
      });
    }
  }, [toast, language]);

  const stopVoice = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
      setGodState("idle");
    }
  }, []);

  // Handle executed actions from the assistant
  const handleActions = useCallback((actions: ExecutedAction[]) => {
    for (const action of actions) {
      console.log("Executing action:", action);
      
      switch (action.type) {
        case "navigate":
          if (action.path) {
            navigate(action.path);
            toast({
              title: "Navegação",
              description: `Indo para ${action.path}...`,
            });
          }
          break;
          
        case "company_created":
        case "source_created":
        case "category_created":
        case "entry_created":
        case "ecosystem_category_created":
        case "ecosystem_link_created":
        case "document_created":
          // Trigger a refresh event that pages can listen to
          window.dispatchEvent(new CustomEvent("god-mode-data-changed", { 
            detail: { type: action.type, data: action.data } 
          }));
          break;
          
        case "company_deleted":
          window.dispatchEvent(new CustomEvent("god-mode-data-changed", { 
            detail: { type: action.type, name: action.name } 
          }));
          break;
      }
    }
  }, [navigate, toast]);

  const sendMessageInternal = useCallback(async (content: string) => {
    if (!userRef.current) {
      toast({
        title: "Não autenticado",
        description: "Faça login para usar o assistente.",
        variant: "destructive",
      });
      return;
    }

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setGodState("processing");

    // Save user message to database
    saveMessage(userMessage);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/god-mode-chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            messages: [...messages, userMessage].map(m => ({
              role: m.role,
              content: m.content,
            })),
            userId: userRef.current.id,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Falha ao obter resposta");
      }

      const data = await response.json();
      
      // Handle any actions the assistant executed
      if (data.actions && data.actions.length > 0) {
        handleActions(data.actions);
      }
      
      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.response,
        timestamp: new Date(),
        actions: data.actions,
      };

      setMessages(prev => [...prev, assistantMessage]);
      setGodState("success");
      
      // Save assistant message to database
      saveMessage(assistantMessage);
      
      // Speak the response
      speakResponse(data.response);
      
      setTimeout(() => setGodState("idle"), 2000);
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
      setGodState("error");
      toast({
        title: "Erro ao enviar mensagem",
        description: error instanceof Error ? error.message : "Não foi possível processar sua mensagem.",
        variant: "destructive",
      });
      setTimeout(() => setGodState("idle"), 2000);
    } finally {
      setIsLoading(false);
    }
  }, [messages, toast, handleActions, speakResponse, saveMessage]);

  // Start a new conversation (clear current messages but keep history)
  const newConversation = useCallback(() => {
    setMessages([]);
    setCurrentConversationId(null);
    toast({
      title: "Nova conversa",
      description: "Iniciando uma nova conversa.",
    });
  }, [toast]);

  // Select and load a past conversation
  const selectConversation = useCallback(async (conversationId: string) => {
    if (!userRef.current) return;

    try {
      const { data, error } = await supabase
        .from("conversations")
        .select("*")
        .eq("user_id", userRef.current.id)
        .order("created_at", { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        // Find messages belonging to this conversation group
        // Recreate the grouping logic to find the right messages
        let currentGroupId = crypto.randomUUID();
        let lastTimestamp: Date | null = null;
        const messageGroups: Map<string, any[]> = new Map();
        
        for (const msg of data) {
          const msgTimestamp = new Date(msg.created_at);
          
          if (lastTimestamp && (msgTimestamp.getTime() - lastTimestamp.getTime()) > 30 * 60 * 1000) {
            currentGroupId = crypto.randomUUID();
          }
          
          if (!messageGroups.has(currentGroupId)) {
            messageGroups.set(currentGroupId, []);
          }
          
          messageGroups.get(currentGroupId)!.push(msg);
          lastTimestamp = msgTimestamp;
        }
        
        // Find the group that matches
        let targetMessages: any[] = [];
        let groupIndex = 0;
        const groupIds = Array.from(messageGroups.keys());
        
        // Since we regenerate IDs, match by index from conversations list
        const conversationIndex = conversations.findIndex(c => c.id === conversationId);
        if (conversationIndex >= 0) {
          const targetGroupId = groupIds[groupIds.length - 1 - conversationIndex];
          targetMessages = messageGroups.get(targetGroupId) || [];
        }
        
        if (targetMessages.length > 0) {
          const loadedMessages: Message[] = targetMessages.map((conv) => ({
            id: conv.id,
            role: conv.role as "user" | "assistant",
            content: conv.content,
            timestamp: new Date(conv.created_at),
            conversationId
          }));
          setMessages(loadedMessages);
          setCurrentConversationId(conversationId);
        }
      }
    } catch (error) {
      console.error("Erro ao carregar conversa:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar a conversa.",
        variant: "destructive",
      });
    }
  }, [conversations, toast]);

  // Clear all conversation history
  const clearHistory = useCallback(async () => {
    if (!userRef.current) return;

    try {
      await supabase
        .from("conversations")
        .delete()
        .eq("user_id", userRef.current.id);
      
      setMessages([]);
      setConversations([]);
      setCurrentConversationId(null);
      toast({
        title: "Histórico limpo",
        description: "Todas as conversas foram removidas.",
      });
    } catch (error) {
      console.error("Erro ao limpar histórico:", error);
      toast({
        title: "Erro",
        description: "Não foi possível limpar o histórico.",
        variant: "destructive",
      });
    }
  }, [toast]);

  const sendMessage = useCallback((content: string) => {
    sendMessageInternal(content);
  }, [sendMessageInternal]);

  return {
    messages,
    conversations,
    currentConversationId,
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
    newConversation,
    selectConversation,
  };
}
