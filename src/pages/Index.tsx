import { motion } from 'framer-motion';
import { useAgents } from '@/hooks/useAgents';
import { 
  Shield, 
  Activity, 
  LayoutDashboard, 
  FileText, 
  TrendingUp, 
  Settings,
  Globe
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Index = () => {
  const { healthScore, lastActivity, currency } = useAgents();
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen w-full flex flex-col overflow-hidden">
      {/* Navigation - Ultra Minimal */}
      <nav className="z-50 flex items-center justify-between px-8 py-6 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full border border-primary/30 flex items-center justify-center">
            <Shield className="w-4 h-4 text-primary" />
          </div>
          <span className="text-sm tracking-[0.2em] uppercase opacity-80">Architecta HUB</span>
        </div>
        
        <div className="flex items-center gap-8">
          {[
            { label: 'Command', icon: LayoutDashboard, path: '/command-center' },
            { label: 'Vault', icon: FileText, path: '/documentos' },
            { label: 'Growth', icon: TrendingUp, path: '/empresas' },
            { label: 'Settings', icon: Settings, path: '/configuracoes' }
          ].map((item) => (
            <button 
              key={item.label}
              onClick={() => navigate(item.path)}
              className="flex items-center gap-2 text-xs uppercase tracking-widest opacity-50 hover:opacity-100 transition-opacity"
            >
              <item.icon className="w-3 h-3" />
              {item.label}
            </button>
          ))}
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="text-center space-y-12"
        >
          {/* Health Score Circle */}
          <div className="relative inline-block">
            <svg className="w-64 h-64 transform -rotate-90">
              <circle
                cx="128"
                cy="128"
                r="120"
                stroke="currentColor"
                strokeWidth="1"
                fill="transparent"
                className="text-white/5"
              />
              <motion.circle
                cx="128"
                cy="128"
                r="120"
                stroke="currentColor"
                strokeWidth="1"
                fill="transparent"
                strokeDasharray={753.6}
                initial={{ strokeDashoffset: 753.6 }}
                animate={{ strokeDashoffset: 753.6 - (753.6 * healthScore) / 100 }}
                transition={{ duration: 2, ease: "easeOut" }}
                className="text-primary"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-6xl font-extralight tracking-tighter">{healthScore}</span>
              <span className="text-[10px] uppercase tracking-[0.3em] opacity-40 mt-2">Health Score</span>
            </div>
          </div>

          {/* Core Metrics */}
          <div className="grid grid-cols-3 gap-24">
            <div className="space-y-1">
              <p className="text-[10px] uppercase tracking-[0.2em] opacity-40">Currency</p>
              <p className="text-xl font-light">{currency}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] uppercase tracking-[0.2em] opacity-40">Status</p>
              <div className="flex items-center justify-center gap-2">
                <div className="w-1 h-1 rounded-full bg-primary animate-pulse" />
                <p className="text-xl font-light">Active</p>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] uppercase tracking-[0.2em] opacity-40">Network</p>
              <p className="text-xl font-light">Secure</p>
            </div>
          </div>
        </motion.div>
      </main>

      {/* Silent Activity Feed - Bottom Bar */}
      <footer className="z-50 w-full px-8 py-6 border-t border-white/5 backdrop-blur-md bg-black/20">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4 overflow-hidden">
            <Activity className="w-3 h-3 text-primary opacity-50" />
            <div className="h-4 w-[1px] bg-white/10" />
            <motion.div 
              key={lastActivity.timestamp.getTime()}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3"
            >
              <span className="text-[10px] uppercase tracking-widest text-primary/80">{lastActivity.agent}:</span>
              <span className="text-[11px] tracking-wider opacity-60">{lastActivity.status}</span>
            </motion.div>
          </div>
          
          <div className="flex items-center gap-6 text-[10px] uppercase tracking-[0.2em] opacity-30">
            <div className="flex items-center gap-2">
              <Globe className="w-3 h-3" />
              <span>Global Node 01</span>
            </div>
            <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
          </div>
        </div>
      </footer>

      {/* Background Subtle Elements */}
      <div className="absolute top-1/4 -left-24 w-96 h-96 bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 -right-24 w-96 h-96 bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
    </div>
  );
};

export default Index;
