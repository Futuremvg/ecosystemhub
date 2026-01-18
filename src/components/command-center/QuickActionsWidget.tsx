import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Rocket, 
  FileText,
  CreditCard,
  Download,
  PlusCircle,
  Sparkles,
  Mic,
  BarChart3,
  Users,
  Settings
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface QuickAction {
  id: string;
  label: string;
  icon: React.ElementType;
  color: string;
  action: () => void;
}

export function QuickActionsWidget() {
  const navigate = useNavigate();

  const actions: QuickAction[] = [
    {
      id: 'godmode',
      label: 'God Mode',
      icon: Sparkles,
      color: 'from-god-gold to-neon-amber',
      action: () => navigate('/godmode')
    },
    {
      id: 'new-transaction',
      label: 'Nova Transação',
      icon: PlusCircle,
      color: 'from-neon-cyan to-neon-purple',
      action: () => navigate('/dinheiro')
    },
    {
      id: 'import-statement',
      label: 'Importar Extrato',
      icon: Download,
      color: 'from-neon-purple to-neon-rose',
      action: () => navigate('/dinheiro')
    },
    {
      id: 'new-invoice',
      label: 'Nova Nota Fiscal',
      icon: FileText,
      color: 'from-neon-amber to-neon-rose',
      action: () => navigate('/documentos')
    },
    {
      id: 'reports',
      label: 'Relatórios',
      icon: BarChart3,
      color: 'from-neon-cyan to-neon-amber',
      action: () => navigate('/home')
    },
    {
      id: 'companies',
      label: 'Empresas',
      icon: Users,
      color: 'from-neon-rose to-neon-purple',
      action: () => navigate('/empresas')
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm overflow-hidden h-full"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-neon-rose to-neon-purple flex items-center justify-center">
            <Rocket className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Ações Rápidas</h3>
            <p className="text-xs text-muted-foreground">Acesso direto</p>
          </div>
        </div>
      </div>

      {/* Actions Grid */}
      <div className="p-4">
        <div className="grid grid-cols-2 gap-2">
          {actions.map((action, index) => {
            const Icon = action.icon;
            return (
              <motion.button
                key={action.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 + index * 0.05 }}
                onClick={action.action}
                className={`
                  relative p-3 rounded-lg border border-white/10 bg-white/5
                  hover:bg-white/10 hover:border-white/20 transition-all
                  group overflow-hidden
                `}
              >
                {/* Gradient background on hover */}
                <div className={`
                  absolute inset-0 bg-gradient-to-br ${action.color} opacity-0 
                  group-hover:opacity-10 transition-opacity
                `} />
                
                <div className="relative flex flex-col items-center gap-2">
                  <div className={`
                    w-8 h-8 rounded-lg bg-gradient-to-br ${action.color}
                    flex items-center justify-center
                    group-hover:scale-110 transition-transform
                  `}>
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-xs font-medium text-white/80 group-hover:text-white transition-colors">
                    {action.label}
                  </span>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Voice Command Shortcut */}
      <div className="p-4 border-t border-white/10">
        <Button
          variant="ghost"
          className="w-full justify-center gap-2 text-god-gold hover:text-god-gold hover:bg-god-gold/10"
          onClick={() => navigate('/godmode')}
        >
          <Mic className="w-4 h-4" />
          <span className="text-sm">Comando de Voz</span>
        </Button>
      </div>
    </motion.div>
  );
}
