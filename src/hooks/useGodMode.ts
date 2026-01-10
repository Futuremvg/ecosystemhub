import { useState, useCallback, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
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
}

interface ExecutedAction {
  type: string;
  data?: any;
  path?: string;
  name?: string;
}

export function useGodMode() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [godState, setGodState] = useState<GodModeState>("idle");
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [transcription, setTranscription] = useState("");
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const speechSynthRef = useRef<SpeechSynthesisUtterance | null>(null);
  const sendMessageRef = useRef<(content: string) => void>(() => {});
  const userRef = useRef(user);

  // Keep userRef updated
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  // Clear transcription callback
  const clearTranscription = useCallback(() => {
    setTranscription("");
  }, []);

  // Load conversation history from database
  useEffect(() => {
    const loadHistory = async () => {
      if (!user) {
        setIsLoadingHistory(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("conversations")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: true })
          .limit(50);

        if (error) throw error;

        if (data && data.length > 0) {
          const loadedMessages: Message[] = data.map((conv) => ({
            id: conv.id,
            role: conv.role as "user" | "assistant",
            content: conv.content,
            timestamp: new Date(conv.created_at),
          }));
          setMessages(loadedMessages);
        }
      } catch (error) {
        console.error("Erro ao carregar histórico:", error);
      } finally {
        setIsLoadingHistory(false);
      }
    };

    loadHistory();
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

  // Initialize Speech Recognition with multi-language support and natural pause detection
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognitionAPI) {
        const recognition = new SpeechRecognitionAPI();
        recognition.continuous = true;
        recognition.interimResults = true;
        // Use Portuguese as primary language with multi-language support
        // Most browsers support multiple languages - pt-BR will also pick up English
        recognition.lang = "pt-BR";
        
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

        recognition.onstart = () => {
          console.log("🎤 Speech recognition started - listening in Portuguese/English");
          accumulatedTranscript = "";
          finalTranscript = "";
          lastResultTime = Date.now();
          speechStartTime = Date.now();
          hasStartedSpeaking = false;
          
          toast({
            title: "🎤 Ouvindo...",
            description: "Fale naturalmente. Vou entender quando você terminar.",
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
                title: "Nenhuma fala detectada",
                description: "Tente novamente e fale algo.",
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
              title: "Permissão negada",
              description: "Por favor, permita acesso ao microfone nas configurações do navegador.",
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
  }, [toast]);

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
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
        setIsListening(true);
        setGodState("listening");
      } catch (error) {
        console.error("Error starting recognition:", error);
        toast({
          title: "Erro ao iniciar microfone",
          description: "Verifique se seu navegador permite acesso ao microfone.",
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "Reconhecimento de voz não suportado",
        description: "Seu navegador não suporta reconhecimento de voz. Use o chat de texto.",
        variant: "destructive",
      });
    }
  }, [toast]);

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

  // Clear conversation history
  const clearHistory = useCallback(async () => {
    if (!userRef.current) return;

    try {
      await supabase
        .from("conversations")
        .delete()
        .eq("user_id", userRef.current.id);
      
      setMessages([]);
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
  };
}
