import { ReactNode, useState, useEffect, useRef, useCallback } from "react";
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
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const sidebarRef = useRef<HTMLElement>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Handle hover/touch interaction for mobile menu
  const handleMenuHoverStart = useCallback(() => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    setMobileSidebarOpen(true);
  }, []);

  const handleSidebarHoverEnd = useCallback(() => {
    hoverTimeoutRef.current = setTimeout(() => {
      setMobileSidebarOpen(false);
    }, 300); // Small delay to prevent flickering
  }, []);

  const handleSidebarHoverStart = useCallback(() => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);
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
              ref={menuButtonRef}
              variant="ghost"
              size="icon"
              onClick={() => setMobileSidebarOpen(true)}
              onMouseEnter={handleMenuHoverStart}
              onMouseLeave={handleSidebarHoverEnd}
              onTouchStart={handleMenuHoverStart}
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
            onMouseEnter={handleSidebarHoverEnd}
          />
          
          {/* Mobile Sidebar Drawer */}
          <aside 
            ref={sidebarRef}
            className={cn(
              "fixed left-0 top-0 h-full w-72 z-50 bg-sidebar transform transition-transform duration-300 ease-out",
              mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
            )}
            onMouseEnter={handleSidebarHoverStart}
            onMouseLeave={handleSidebarHoverEnd}
            onTouchEnd={(e) => {
              // Don't close if touch ended on a link/button inside sidebar
              const target = e.target as HTMLElement;
              if (!target.closest('a, button')) {
                handleSidebarHoverEnd();
              }
            }}
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
