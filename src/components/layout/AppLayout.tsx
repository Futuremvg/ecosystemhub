import { ReactNode, useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence, PanInfo, useMotionValue, useTransform, animate } from "framer-motion";
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

// Constants for swipe gesture
const SIDEBAR_WIDTH = 288; // 72 in tailwind = 288px
const SWIPE_THRESHOLD = 50;
const EDGE_ZONE = 30; // px from left edge to trigger swipe open

export function AppLayout({ children }: AppLayoutProps) {
  const isMobile = useIsMobile();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const sidebarRef = useRef<HTMLElement>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Swipe gesture state
  const sidebarX = useMotionValue(-SIDEBAR_WIDTH);
  const overlayOpacity = useTransform(sidebarX, [-SIDEBAR_WIDTH, 0], [0, 0.6]);
  const isDragging = useRef(false);
  const swipeStartX = useRef(0);

  // Handle swipe open from edge
  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (!isMobile) return;
    const touch = e.touches[0];
    if (touch.clientX < EDGE_ZONE && !mobileSidebarOpen) {
      swipeStartX.current = touch.clientX;
      isDragging.current = true;
    }
  }, [isMobile, mobileSidebarOpen]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isDragging.current || !isMobile) return;
    const touch = e.touches[0];
    const delta = touch.clientX - swipeStartX.current;
    const newX = Math.min(0, Math.max(-SIDEBAR_WIDTH, -SIDEBAR_WIDTH + delta));
    sidebarX.set(newX);
  }, [isMobile, sidebarX]);

  const handleTouchEnd = useCallback(() => {
    if (!isDragging.current || !isMobile) return;
    isDragging.current = false;
    const currentX = sidebarX.get();
    
    if (currentX > -SIDEBAR_WIDTH + SWIPE_THRESHOLD) {
      // Open sidebar
      animate(sidebarX, 0, { type: "spring", stiffness: 300, damping: 30 });
      setMobileSidebarOpen(true);
    } else {
      // Close sidebar
      animate(sidebarX, -SIDEBAR_WIDTH, { type: "spring", stiffness: 300, damping: 30 });
    }
  }, [isMobile, sidebarX]);

  // Handle swipe close on sidebar
  const handleSidebarPanEnd = useCallback((e: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.x < -SWIPE_THRESHOLD || info.velocity.x < -500) {
      animate(sidebarX, -SIDEBAR_WIDTH, { type: "spring", stiffness: 300, damping: 30 });
      setMobileSidebarOpen(false);
    } else {
      animate(sidebarX, 0, { type: "spring", stiffness: 300, damping: 30 });
    }
  }, [sidebarX]);

  // Edge swipe listeners
  useEffect(() => {
    if (!isMobile) return;
    
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: true });
    document.addEventListener('touchend', handleTouchEnd);
    
    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isMobile, handleTouchStart, handleTouchMove, handleTouchEnd]);

  // Sync sidebar position when opening via button
  useEffect(() => {
    if (mobileSidebarOpen) {
      animate(sidebarX, 0, { type: "spring", stiffness: 300, damping: 30 });
    } else {
      animate(sidebarX, -SIDEBAR_WIDTH, { type: "spring", stiffness: 300, damping: 30 });
    }
  }, [mobileSidebarOpen, sidebarX]);

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

          {/* Swipe Zone Indicator - Visual hint for swipe gesture */}
          {!mobileSidebarOpen && (
            <motion.div
              className="fixed left-0 top-1/2 -translate-y-1/2 z-30 pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1, duration: 0.5 }}
            >
              <motion.div
                className="flex items-center gap-1 pl-1 pr-2 py-3 rounded-r-full bg-primary/10 backdrop-blur-sm border border-l-0 border-primary/20"
                animate={{ 
                  x: [0, 8, 0],
                  opacity: [0.6, 1, 0.6]
                }}
                transition={{ 
                  repeat: Infinity, 
                  duration: 2,
                  ease: "easeInOut",
                  repeatDelay: 3
                }}
              >
                <svg 
                  width="16" 
                  height="16" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                  className="text-primary/70"
                >
                  <path d="m9 18 6-6-6-6"/>
                </svg>
              </motion.div>
            </motion.div>
          )}

          {/* Mobile Sidebar - Swipe Gesture Enabled */}
          <motion.div
            className="fixed inset-0 z-40 bg-black pointer-events-none"
            style={{ opacity: overlayOpacity }}
          />
          
          {mobileSidebarOpen && (
            <motion.div
              className="fixed inset-0 z-40"
              onClick={() => setMobileSidebarOpen(false)}
            />
          )}
          
          <motion.aside
            ref={sidebarRef}
            style={{ x: sidebarX }}
            drag="x"
            dragConstraints={{ left: -SIDEBAR_WIDTH, right: 0 }}
            dragElastic={0.1}
            onDragEnd={handleSidebarPanEnd}
            className="fixed left-0 top-0 h-full w-72 z-50 bg-sidebar shadow-2xl touch-pan-y"
            onMouseEnter={handleSidebarHoverStart}
            onMouseLeave={handleSidebarHoverEnd}
          >
            <DesktopSidebar 
              collapsed={false} 
              onToggle={() => setMobileSidebarOpen(false)}
              isMobileSheet
            />
          </motion.aside>
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

