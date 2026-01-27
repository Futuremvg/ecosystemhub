import { motion } from 'framer-motion';
import { useAgents } from '@/hooks/useAgents';
import { useAppSettings } from '@/contexts/AppSettingsContext';
import { 
  Shield, 
  Activity, 
  Cpu, 
  Lock, 
  Zap,
  ChevronLeft
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useIsMobile, useIsMobileOrTablet } from '@/hooks/use-mobile';
import { Card, CardContent } from '@/components/ui/card';

export default function CommandCenter() {
  const { healthScore, lastActivity, isProcessing } = useAgents();
  const { t, language } = useAppSettings();
  const navigate = useNavigate();
  const isPt = language === 'pt-BR';
  const isMobile = useIsMobile();
  const isMobileOrTablet = useIsMobileOrTablet();

  const content = {
    title: isPt ? 'Operações Centrais' : 'Core Operations',
    liveEngine: isPt ? 'Motor Ativo' : 'Live Engine',
    systemIntegrity: isPt ? 'Integridade do Sistema' : 'System Integrity',
    encryption: isPt ? 'Criptografia' : 'Encryption',
    agentSync: isPt ? 'Sincronização' : 'Agent Sync',
    optimal: isPt ? 'Ótimo' : 'Optimal',
    latency: isPt ? 'Latência' : 'Latency',
    activeBriefing: isPt ? 'Briefing do Agente Ativo' : 'Active Agent Briefing',
    systemOptimizing: isPt 
      ? 'O sistema está realizando otimização em segundo plano.'
      : 'The system is performing background optimization.',
    engineVersion: isPt ? 'Architecta God Mode Engine v2.0' : 'Architecta God Mode Engine v2.0',
    allOperational: isPt ? 'Todos os agentes operacionais' : 'All agents operational',
  };

  const stats = [
    { label: content.encryption, status: 'AES-256', icon: Lock },
    { label: content.agentSync, status: content.optimal, icon: Activity },
    { label: content.latency, status: '12ms', icon: Zap }
  ];

  return (
    <div className="min-h-screen w-full flex flex-col bg-transparent text-white font-light">
      {/* Header */}
      <header className="z-50 flex items-center justify-between px-4 sm:px-8 py-4 sm:py-6 border-b border-white/5 backdrop-blur-md">
        <div className="flex items-center gap-3 sm:gap-4">
          {!isMobileOrTablet && (
            <button 
              onClick={() => navigate('/')}
              className="p-2 hover:bg-white/5 rounded-full transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              <ChevronLeft className="w-5 h-5 opacity-50" />
            </button>
          )}
          <div className="flex items-center gap-2 sm:gap-3">
            <Cpu className="w-4 sm:w-5 h-4 sm:h-5 text-primary" />
            <h1 className="text-xs sm:text-sm uppercase tracking-[0.2em] sm:tracking-[0.3em]">{content.title}</h1>
          </div>
        </div>
        
        <div className="flex items-center gap-2 px-2 sm:px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
          <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          <span className="text-[9px] sm:text-[10px] uppercase tracking-widest text-primary">{content.liveEngine}</span>
        </div>
      </header>

      {/* Grid Layout - Stack on Mobile */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-4 lg:space-y-0 lg:grid lg:grid-cols-12 lg:gap-6">
        {/* System Status */}
        <div className="lg:col-span-4 space-y-4 lg:space-y-6">
          <Card className="glass-panel border-0">
            <CardContent className="p-4 sm:p-6 space-y-6 sm:space-y-8">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-widest opacity-40">{content.systemIntegrity}</span>
                <Shield className="w-4 h-4 text-primary opacity-50" />
              </div>
              
              <div className="flex flex-col items-center py-2 sm:py-4">
                <div className={`font-extralight tracking-tighter mb-2 ${isMobile ? 'text-4xl' : 'text-5xl'}`}>{healthScore}%</div>
                <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${healthScore}%` }}
                    className="h-full bg-primary"
                  />
                </div>
              </div>

              <div className="space-y-3 sm:space-y-4">
                {stats.map((stat) => (
                  <div key={stat.label} className="flex items-center justify-between py-2 border-b border-white/5">
                    <div className="flex items-center gap-2 sm:gap-3 opacity-40">
                      <stat.icon className="w-3 h-3" />
                      <span className="text-[10px] uppercase tracking-widest">{stat.label}</span>
                    </div>
                    <span className="text-xs">{stat.status}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Agent Activity Feed */}
        <div className="lg:col-span-8">
          <Card className="glass-panel h-full border-0 flex flex-col overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-white/5 flex items-center justify-between">
              <span className="text-xs uppercase tracking-widest opacity-40">{content.activeBriefing}</span>
              {isProcessing && <Activity className="w-4 h-4 text-primary animate-spin" />}
            </div>
            
            <CardContent className="flex-1 p-4 sm:p-6 space-y-4 sm:space-y-6 overflow-y-auto">
              <motion.div 
                key={lastActivity.timestamp.getTime()}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 sm:p-4 rounded-xl bg-white/5 border border-white/10"
              >
                <div className="flex items-center gap-2 sm:gap-3 mb-2">
                  <span className="text-[10px] uppercase tracking-widest text-primary">{lastActivity.agent}</span>
                  <span className="text-[10px] opacity-30">
                    {lastActivity.timestamp.toLocaleTimeString(language, {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
                <p className="text-xs sm:text-sm opacity-80 leading-relaxed">
                  {lastActivity.status}. {content.systemOptimizing}
                </p>
              </motion.div>

              {/* Placeholder for history - Hide some on mobile */}
              <div className="opacity-20 space-y-4 sm:space-y-6">
                {[1, 2, isMobile ? null : 3].filter(Boolean).map((i) => (
                  <div key={i} className="p-3 sm:p-4 rounded-xl border border-white/5">
                    <div className="h-2 w-24 bg-white/20 rounded mb-3" />
                    <div className="h-2 w-full bg-white/10 rounded" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer Status - Simplified on Mobile */}
      <footer className="px-4 sm:px-8 py-3 sm:py-4 border-t border-white/5 text-[9px] sm:text-[10px] uppercase tracking-[0.15em] sm:tracking-[0.2em] opacity-30 flex justify-between">
        <span className="truncate">{isMobile ? 'v2.0' : content.engineVersion}</span>
        <span>{content.allOperational}</span>
      </footer>
    </div>
  );
}
