import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertTriangle, 
  AlertCircle, 
  Info,
  X,
  Bell,
  ChevronRight,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface Alert {
  id: string;
  alert_type: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string | null;
  created_at: string;
  is_read: boolean;
}

export function AlertsWidget() {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadAlerts = async () => {
      if (!user) return;
      
      setIsLoading(true);
      
      const { data } = await supabase
        .from('alerts')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_dismissed', false)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (data) {
        setAlerts(data as Alert[]);
      } else {
        // Placeholder alerts
        setAlerts([
          {
            id: '1',
            alert_type: 'payment_due',
            severity: 'critical',
            title: 'Fatura vence hoje',
            description: 'Cliente XYZ - R$ 5.000',
            created_at: new Date().toISOString(),
            is_read: false
          },
          {
            id: '2',
            alert_type: 'anomaly',
            severity: 'high',
            title: 'Despesa incomum detectada',
            description: 'Valor 3x maior que a média',
            created_at: new Date(Date.now() - 3600000).toISOString(),
            is_read: false
          },
          {
            id: '3',
            alert_type: 'cash_flow',
            severity: 'medium',
            title: 'Projeção de caixa baixa',
            description: 'Saldo projetado negativo em 15 dias',
            created_at: new Date(Date.now() - 7200000).toISOString(),
            is_read: true
          }
        ]);
      }
      
      setIsLoading(false);
    };
    
    loadAlerts();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('alerts-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'alerts',
          filter: `user_id=eq.${user?.id}`
        },
        () => {
          loadAlerts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertCircle className="w-4 h-4" />;
      case 'high':
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <Info className="w-4 h-4" />;
    }
  };

  const getSeverityStyles = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'border-neon-rose/50 bg-neon-rose/10 text-neon-rose';
      case 'high':
        return 'border-neon-amber/50 bg-neon-amber/10 text-neon-amber';
      case 'medium':
        return 'border-god-gold/50 bg-god-gold/10 text-god-gold';
      default:
        return 'border-neon-cyan/50 bg-neon-cyan/10 text-neon-cyan';
    }
  };

  const handleDismiss = async (alertId: string) => {
    setAlerts(prev => prev.filter(a => a.id !== alertId));
    
    await supabase
      .from('alerts')
      .update({ is_dismissed: true })
      .eq('id', alertId);
  };

  const getTimeAgo = (dateString: string) => {
    const diff = Date.now() - new Date(dateString).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    return `${Math.floor(hours / 24)}d`;
  };

  const criticalCount = alerts.filter(a => a.severity === 'critical').length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm overflow-hidden h-full"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
            criticalCount > 0 
              ? 'bg-gradient-to-br from-neon-rose to-neon-amber animate-pulse' 
              : 'bg-gradient-to-br from-neon-cyan to-neon-purple'
          }`}>
            <Bell className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Alertas</h3>
            <p className="text-xs text-muted-foreground">
              {criticalCount > 0 ? (
                <span className="text-neon-rose">{criticalCount} crítico{criticalCount > 1 ? 's' : ''}</span>
              ) : (
                'Tudo sob controle'
              )}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-white"
        >
          Ver todos
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>

      {/* Alerts List */}
      <div className="p-4 space-y-2 max-h-[400px] overflow-y-auto">
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 rounded-lg bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : alerts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nenhum alerta ativo</p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {alerts.map((alert, index) => (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ delay: index * 0.05 }}
                className={`p-3 rounded-lg border ${getSeverityStyles(alert.severity)} 
                  ${!alert.is_read ? 'ring-1 ring-inset ring-white/20' : 'opacity-75'}`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    {getSeverityIcon(alert.severity)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h5 className="font-medium text-white text-sm truncate">{alert.title}</h5>
                      {!alert.is_read && (
                        <span className="w-2 h-2 rounded-full bg-current shrink-0" />
                      )}
                    </div>
                    {alert.description && (
                      <p className="text-xs text-muted-foreground mt-0.5">{alert.description}</p>
                    )}
                    <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {getTimeAgo(alert.created_at)}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDismiss(alert.id)}
                    className="h-6 w-6 p-0 text-muted-foreground hover:text-white"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </motion.div>
  );
}
