import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Zap, 
  AlertTriangle, 
  Activity, 
  CheckSquare, 
  TrendingUp, 
  Rocket,
  PauseCircle,
  PlayCircle,
  Settings,
  Bell,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { BriefingWidget } from '@/components/command-center/BriefingWidget';
import { AlertsWidget } from '@/components/command-center/AlertsWidget';
import { TimelineWidget } from '@/components/command-center/TimelineWidget';
import { TasksWidget } from '@/components/command-center/TasksWidget';
import { CashFlowChart } from '@/components/command-center/CashFlowChart';
import { QuickActionsWidget } from '@/components/command-center/QuickActionsWidget';
import { supabase } from '@/integrations/supabase/client';

export default function CommandCenter() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [automationPaused, setAutomationPaused] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  const handleToggleAutomation = async () => {
    setAutomationPaused(!automationPaused);
    // TODO: Update tenant automation_paused in database
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simulate refresh
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsRefreshing(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-sidebar flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-neon-cyan" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-sidebar text-sidebar-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-sidebar/95 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="relative"
              >
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-neon-cyan via-neon-purple to-neon-rose flex items-center justify-center">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-neon-cyan rounded-full animate-pulse" />
              </motion.div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-neon-cyan via-white to-neon-rose bg-clip-text text-transparent">
                  Command Center
                </h1>
                <p className="text-xs text-muted-foreground">Mission Control • Autonomous Operations</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefresh}
                className="text-muted-foreground hover:text-neon-cyan"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-neon-amber"
              >
                <Bell className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/configuracoes')}
                className="text-muted-foreground hover:text-white"
              >
                <Settings className="w-4 h-4" />
              </Button>
              <Button
                variant={automationPaused ? "outline" : "ghost"}
                size="sm"
                onClick={handleToggleAutomation}
                className={automationPaused 
                  ? "border-neon-rose/50 text-neon-rose hover:bg-neon-rose/10" 
                  : "text-neon-cyan hover:bg-neon-cyan/10"
                }
              >
                {automationPaused ? (
                  <>
                    <PlayCircle className="w-4 h-4 mr-1" />
                    Resume
                  </>
                ) : (
                  <>
                    <PauseCircle className="w-4 h-4 mr-1" />
                    Pause AI
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Grid */}
      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left Column - Briefing + Timeline */}
          <div className="lg:col-span-2 space-y-4">
            <BriefingWidget />
            <TimelineWidget />
          </div>

          {/* Right Column - Alerts */}
          <div className="space-y-4">
            <AlertsWidget />
          </div>

          {/* Bottom Row - Tasks + Cash Flow + Quick Actions */}
          <div className="lg:col-span-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TasksWidget />
              <CashFlowChart />
            </div>
          </div>

          <div>
            <QuickActionsWidget />
          </div>
        </div>
      </main>

      {/* Status Bar */}
      <footer className="fixed bottom-0 left-0 right-0 border-t border-white/10 bg-sidebar/95 backdrop-blur-xl py-2 px-4">
        <div className="container mx-auto flex items-center justify-between text-xs">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full ${automationPaused ? 'bg-neon-rose' : 'bg-neon-cyan animate-pulse'}`} />
              <span className="text-muted-foreground">
                {automationPaused ? 'Automations Paused' : 'Autopilot Active'}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Activity className="w-3 h-3" />
              <span>3 agents running</span>
            </div>
          </div>
          <div className="flex items-center gap-4 text-muted-foreground">
            <span>Last sync: 2 min ago</span>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-6 text-xs text-neon-cyan hover:text-neon-cyan/80"
              onClick={() => navigate('/home')}
            >
              ← Back to Dashboard
            </Button>
          </div>
        </div>
      </footer>
    </div>
  );
}
