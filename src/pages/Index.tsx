import { useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, 
  FileText, 
  TrendingUp, 
  Settings,
  Rocket,
  AlertTriangle,
  CheckSquare,
  Wallet,
  Clock
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import { Card, CardContent } from '@/components/ui/card';
import { useQuickPulse } from '@/hooks/useQuickPulse';
import { useAppSettings } from '@/contexts/AppSettingsContext';

const MOTIVATIONAL_PHRASES = [
  "Small actions today build powerful systems tomorrow.",
  "Your system works while you rest.",
  "Consistency beats intensity.",
  "Control the system, not the chaos.",
  "Build once, scale forever.",
  "Trust your architecture.",
  "Every command compounds."
];

// Get a consistent phrase for the day (same phrase all day)
const getDailyPhrase = () => {
  const today = new Date();
  const dayOfYear = Math.floor(
    (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24)
  );
  return MOTIVATIONAL_PHRASES[dayOfYear % MOTIVATIONAL_PHRASES.length];
};

const Index = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { formatCurrency, language } = useAppSettings();
  const { alertsHigh, tasksDueToday, cashflowNet, isLoading: pulseLoading } = useQuickPulse();
  
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { label: 'Command', icon: LayoutDashboard, path: '/command-center' },
    { label: 'Vault', icon: FileText, path: '/documentos' },
    { label: 'Growth', icon: TrendingUp, path: '/empresas' },
    { label: 'Settings', icon: Settings, path: '/configuracoes' }
  ];

  // Memoize to keep consistent during session
  const dailyPhrase = useMemo(() => getDailyPhrase(), []);
  
  // Format today's date localized
  const formattedDate = useMemo(() => {
    return currentTime.toLocaleDateString(language === 'pt-BR' ? 'pt-BR' : undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }, [currentTime, language]);

  const formattedTime = useMemo(() => {
    return currentTime.toLocaleTimeString(language === 'pt-BR' ? 'pt-BR' : undefined, {
      hour: '2-digit',
      minute: '2-digit'
    });
  }, [currentTime, language]);

  const isPt = language === 'pt-BR';

  return (
    <div className="relative min-h-full w-full flex flex-col p-4 lg:p-8">
      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center relative z-10 py-8 lg:py-0">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="text-center space-y-6 lg:space-y-10 w-full max-w-2xl"
        >
          {/* Command Launcher Header */}
          <div className="space-y-3">
            <div className="flex items-center justify-center gap-3 mb-2">
              <Rocket className={`text-primary ${isMobile ? 'w-8 h-8' : 'w-10 h-10'}`} />
            </div>
            <h1 className={`font-extralight tracking-tight ${isMobile ? 'text-3xl' : 'text-5xl'}`}>
              Command Launcher
            </h1>
            
            {/* Date and Time */}
            <div className="flex items-center justify-center gap-3 text-muted-foreground">
              <Clock className="w-4 h-4 opacity-60" />
              <p className="text-sm uppercase tracking-[0.15em]">
                {formattedDate}
              </p>
              <span className="text-primary font-medium">{formattedTime}</span>
            </div>
            
            {/* Motivational Phrase */}
            <p className={`italic opacity-70 ${isMobile ? 'text-sm' : 'text-base'} max-w-md mx-auto mt-3`}>
              "{dailyPhrase}"
            </p>
          </div>

          {/* Quick Pulse Row */}
          <div className="grid grid-cols-3 gap-2 sm:gap-4 w-full">
            <Card className="bg-card/40 border-border/30">
              <CardContent className="p-3 sm:p-4 flex flex-col items-center gap-1">
                <AlertTriangle className={`w-5 h-5 ${alertsHigh > 0 ? 'text-destructive' : 'text-muted-foreground/50'}`} />
                <span className="text-lg font-semibold">{pulseLoading ? '—' : alertsHigh}</span>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  {isPt ? 'Alertas' : 'Alerts'}
                </span>
              </CardContent>
            </Card>
            
            <Card className="bg-card/40 border-border/30">
              <CardContent className="p-3 sm:p-4 flex flex-col items-center gap-1">
                <CheckSquare className={`w-5 h-5 ${tasksDueToday > 0 ? 'text-primary' : 'text-muted-foreground/50'}`} />
                <span className="text-lg font-semibold">{pulseLoading ? '—' : tasksDueToday}</span>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  {isPt ? 'Tarefas Hoje' : 'Due Today'}
                </span>
              </CardContent>
            </Card>
            
            <Card className="bg-card/40 border-border/30">
              <CardContent className="p-3 sm:p-4 flex flex-col items-center gap-1">
                <Wallet className={`w-5 h-5 ${cashflowNet >= 0 ? 'text-primary' : 'text-destructive'}`} />
                <span className={`text-lg font-semibold ${cashflowNet >= 0 ? 'text-primary' : 'text-destructive'}`}>
                  {pulseLoading ? '—' : formatCurrency(cashflowNet)}
                </span>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  {isPt ? 'Fluxo Mês' : 'Net Month'}
                </span>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions Grid */}
          <div className={`grid gap-3 w-full pt-2 ${isMobile ? 'grid-cols-2' : 'grid-cols-4'}`}>
            {navItems.map((item) => (
              <button
                key={item.label}
                onClick={() => navigate(item.path)}
                className="flex flex-col items-center gap-2 p-4 rounded-xl bg-card/40 border border-border/30 hover:bg-card/60 hover:border-primary/30 transition-all min-h-[88px]"
              >
                <item.icon className="w-6 h-6 text-primary opacity-70" />
                <span className="text-xs uppercase tracking-wider opacity-60">{item.label}</span>
              </button>
            ))}
          </div>
        </motion.div>
      </main>

      {/* Background Subtle Elements */}
      <div className="absolute top-1/4 -left-24 w-96 h-96 bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 -right-24 w-96 h-96 bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
    </div>
  );
};

export default Index;
