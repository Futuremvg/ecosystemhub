import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from "@/hooks/useAuth";
import { FloatingChat } from "@/components/god-mode/FloatingChat";
import { useGodMode } from "@/hooks/useGodMode";
import { useIsMobileOrTablet } from "@/hooks/use-mobile";
import { DesktopSidebar } from "@/components/layout/DesktopSidebar";
import { MobileHeader } from "@/components/layout/MobileNav";
import { useLocation } from 'react-router-dom';

interface AppLayoutProps {
  children: React.ReactNode;
}

// Routes that should NOT show the sidebar/nav (public pages)
const PUBLIC_ROUTES = ['/', '/auth'];

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const { user } = useAuth();
  const location = useLocation();
  const isMobileOrTablet = useIsMobileOrTablet();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
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

  // Check if current route is public (no nav needed)
  const isPublicRoute = PUBLIC_ROUTES.includes(location.pathname);
  const showNav = user && !isPublicRoute;

  return (
    <div className="relative h-screen w-full bg-background text-foreground overflow-hidden flex flex-col">
      {/* Background Overlay for depth */}
      <div className="fixed inset-0 bg-black/40 pointer-events-none z-0" />
      
      <div className="relative z-10 flex flex-1 min-h-0 w-full">
        {/* Desktop Sidebar - Only show on large screens when authenticated */}
        {showNav && !isMobileOrTablet && (
          <DesktopSidebar 
            collapsed={sidebarCollapsed} 
            onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} 
          />
        )}

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 min-h-0">
          {/* Mobile Header - Only show on mobile/tablet when authenticated */}
          {showNav && isMobileOrTablet && <MobileHeader />}

          {/* Page Content - Single scroll container */}
          <motion.main 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="flex-1 w-full overflow-y-auto overflow-x-hidden"
          >
            {children}
          </motion.main>
        </div>
      </div>

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
