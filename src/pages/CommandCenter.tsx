import { motion } from 'framer-motion';
import { useAgents } from '@/hooks/useAgents';
import { 
  Shield, 
  Activity, 
  Cpu, 
  Lock, 
  Zap,
  ChevronLeft
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function CommandCenter() {
  const { healthScore, lastActivity, isProcessing } = useAgents();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen w-full flex flex-col bg-transparent text-white font-light">
      {/* Header */}
      <header className="z-50 flex items-center justify-between px-8 py-6 border-b border-white/5 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/')}
            className="p-2 hover:bg-white/5 rounded-full transition-colors"
          >
            <ChevronLeft className="w-5 h-5 opacity-50" />
          </button>
          <div className="flex items-center gap-3">
            <Cpu className="w-5 h-5 text-primary" />
            <h1 className="text-sm uppercase tracking-[0.3em]">Core Operations</h1>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-[10px] uppercase tracking-widest text-primary">Live Engine</span>
          </div>
        </div>
      </header>

      {/* Grid Layout */}
      <main className="flex-1 p-8 grid grid-cols-12 gap-6">
        {/* Left Column: System Status */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          <div className="glass-panel p-6 rounded-2xl space-y-8">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-widest opacity-40">System Integrity</span>
              <Shield className="w-4 h-4 text-primary opacity-50" />
            </div>
            
            <div className="flex flex-col items-center py-4">
              <div className="text-5xl font-extralight tracking-tighter mb-2">{healthScore}%</div>
              <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${healthScore}%` }}
                  className="h-full bg-primary"
                />
              </div>
            </div>

            <div className="space-y-4">
              {[
                { label: 'Encryption', status: 'AES-256', icon: Lock },
                { label: 'Agent Sync', status: 'Optimal', icon: Activity },
                { label: 'Latency', status: '12ms', icon: Zap }
              ].map((stat) => (
                <div key={stat.label} className="flex items-center justify-between py-2 border-b border-white/5">
                  <div className="flex items-center gap-3 opacity-40">
                    <stat.icon className="w-3 h-3" />
                    <span className="text-[10px] uppercase tracking-widest">{stat.label}</span>
                  </div>
                  <span className="text-xs">{stat.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Agent Activity Feed */}
        <div className="col-span-12 lg:col-span-8">
          <div className="glass-panel h-full rounded-2xl flex flex-col overflow-hidden">
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <span className="text-xs uppercase tracking-widest opacity-40">Active Agent Briefing</span>
              {isProcessing && <Activity className="w-4 h-4 text-primary animate-spin" />}
            </div>
            
            <div className="flex-1 p-6 space-y-6 overflow-y-auto">
              <motion.div 
                key={lastActivity.timestamp.getTime()}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-xl bg-white/5 border border-white/10"
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-[10px] uppercase tracking-widest text-primary">{lastActivity.agent}</span>
                  <span className="text-[10px] opacity-30">{lastActivity.timestamp.toLocaleTimeString()}</span>
                </div>
                <p className="text-sm opacity-80 leading-relaxed">
                  {lastActivity.status}. The system is currently performing background optimization and cross-referencing all data nodes.
                </p>
              </motion.div>

              {/* Placeholder for history */}
              <div className="opacity-20 space-y-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="p-4 rounded-xl border border-white/5">
                    <div className="h-2 w-24 bg-white/20 rounded mb-3" />
                    <div className="h-2 w-full bg-white/10 rounded" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer Status */}
      <footer className="px-8 py-4 border-t border-white/5 text-[10px] uppercase tracking-[0.2em] opacity-30 flex justify-between">
        <span>Architecta God Mode Engine v2.0</span>
        <span>All agents operational</span>
      </footer>
    </div>
  );
}
