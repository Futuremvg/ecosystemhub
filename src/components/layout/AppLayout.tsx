import { ReactNode, useState, useEffect } from "react";
import { DesktopSidebar } from "./DesktopSidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { FloatingChat } from "@/components/god-mode/FloatingChat";
import { useGodMode } from "@/hooks/useGodMode";
import { useAuth } from "@/hooks/useAuth";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const isMobile = useIsMobile();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
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
  } = useGodMode();

  // Prevent body scroll when mobile sidebar is open
  useEffect(() => {
    if (mobileSidebarOpen && isMobile) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileSidebarOpen, isMobile]);

  const sidebarWidth = sidebarCollapsed ? 64 : 256;

  return (
    <div className="h-screen w-screen overflow-hidden bg-background">
      {/* Desktop Layout - CSS Grid for stable positioning */}
      {!isMobile && (
        <div 
          className="h-full w-full grid transition-all duration-300"
          style={{ gridTemplateColumns: `${sidebarWidth}px 1fr` }}
        >
          {/* Sidebar - Fixed position, stable width */}
          <aside className="h-full overflow-hidden">
            <DesktopSidebar 
              collapsed={sidebarCollapsed} 
              onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} 
            />
          </aside>
          
          {/* Main Content - Scrollable area */}
          <main className="h-full overflow-y-auto overflow-x-hidden">
            <div className="p-4 sm:p-6 lg:p-8 min-h-full">
              {children}
            </div>
          </main>
        </div>
      )}

      {/* Mobile Layout */}
      {isMobile && (
        <div className="h-full w-full flex flex-col">
          {/* Mobile Header */}
          <header className="shrink-0 h-14 px-4 flex items-center bg-background border-b border-border/40">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileSidebarOpen(true)}
              className="h-10 w-10 text-foreground"
            >
              <Menu className="w-5 h-5" />
            </Button>
          </header>
          
          {/* Mobile Content - Scrollable */}
          <main className="flex-1 overflow-y-auto overflow-x-hidden">
            <div className="p-4 min-h-full pb-24">
              {children}
            </div>
          </main>

          {/* Mobile Sidebar Overlay */}
          <div 
            className={cn(
              "fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300",
              mobileSidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
            )}
            onClick={() => setMobileSidebarOpen(false)}
          />
          
          {/* Mobile Sidebar Drawer */}
          <aside 
            className={cn(
              "fixed left-0 top-0 h-full w-72 z-50 bg-sidebar transform transition-transform duration-300 ease-out",
              mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
            )}
          >
            <DesktopSidebar 
              collapsed={false} 
              onToggle={() => setMobileSidebarOpen(false)}
              isMobileSheet
            />
          </aside>
        </div>
      )}
      
      {/* Global Floating Chat */}
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
        />
      )}
    </div>
  );
}
