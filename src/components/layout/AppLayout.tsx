import React from 'react';
import { motion } from 'framer-motion';
import { useAuth } from "@/hooks/useAuth";
import { FloatingChat } from "@/components/god-mode/FloatingChat";
import { useGodMode } from "@/hooks/useGodMode";

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const { user } = useAuth();
  const {
    messages,
    isLoading,
    godState,
    isListening,
    transcription,
    sendMessage,
    startVoice,
    stopVoice,
    clearTranscription,
    clearHistory,
    conversations,
    selectConversation,
    newConversation,
    currentConversationId,
  } = useGodMode();

  return (
    <div className="relative min-h-screen w-full bg-background text-foreground overflow-x-hidden">
      {/* Background Overlay for depth */}
      <div className="fixed inset-0 bg-black/40 pointer-events-none z-0" />
      
      {/* Main Content Area */}
      <motion.main 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full min-h-screen"
      >
        {children}
      </motion.main>

      {/* Global Floating Chat - Kept for accessibility but minimal */}
      {user && (
        <FloatingChat
          messages={messages}
          isLoading={isLoading}
          godState={godState}
          onSendMessage={sendMessage}
          onStartVoice={startVoice}
          onStopVoice={stopVoice}
          isListening={isListening}
          transcription={transcription}
          onClearTranscription={clearTranscription}
          onClearHistory={clearHistory}
          conversations={conversations}
          onSelectConversation={selectConversation}
          onNewConversation={newConversation}
          currentConversationId={currentConversationId || undefined}
        />
      )}

      {/* Global Background Accents */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-[-1] overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px]" />
      </div>
    </div>
  );
};
