import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Activity, 
  Mail, 
  CreditCard, 
  FileText, 
  Download,
  Check,
  Clock,
  AlertCircle,
  Loader2,
  Zap
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface TimelineEvent {
  id: string;
  event_type: string;
  status: 'NEW' | 'PROCESSING' | 'PROCESSED' | 'FAILED';
  payload: Record<string, unknown>;
  source: string | null;
  created_at: string;
}

export function TimelineWidget() {
  const { user } = useAuth();
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadEvents = async () => {
      if (!user) return;
      
      setIsLoading(true);
      
      const { data } = await supabase
        .from('events')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(15);
      
      if (data) {
        setEvents(data as TimelineEvent[]);
      } else {
        // Placeholder events
        setEvents([
          {
            id: '1',
            event_type: 'payment.confirmed',
            status: 'PROCESSED',
            payload: { amount: 5000, customer: 'Cliente ABC' },
            source: 'stripe',
            created_at: new Date().toISOString()
          },
          {
            id: '2',
            event_type: 'invoice.detected',
            status: 'PROCESSING',
            payload: { invoice_number: 'NF-1234' },
            source: 'gmail',
            created_at: new Date(Date.now() - 300000).toISOString()
          },
          {
            id: '3',
            event_type: 'statement.imported',
            status: 'PROCESSED',
            payload: { transactions: 15, bank: 'Itaú' },
            source: 'manual',
            created_at: new Date(Date.now() - 600000).toISOString()
          },
          {
            id: '4',
            event_type: 'email.received',
            status: 'NEW',
            payload: { subject: 'Proposta comercial' },
            source: 'gmail',
            created_at: new Date(Date.now() - 900000).toISOString()
          }
        ]);
      }
      
      setIsLoading(false);
    };
    
    loadEvents();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('events-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'events',
          filter: `user_id=eq.${user?.id}`
        },
        () => {
          loadEvents();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const getEventIcon = (eventType: string) => {
    if (eventType.includes('email')) return Mail;
    if (eventType.includes('payment')) return CreditCard;
    if (eventType.includes('invoice')) return FileText;
    if (eventType.includes('statement')) return Download;
    return Zap;
  };

  const getEventLabel = (eventType: string) => {
    const labels: Record<string, string> = {
      'email.received': 'Email recebido',
      'invoice.detected': 'Nota fiscal detectada',
      'payment.confirmed': 'Pagamento confirmado',
      'statement.imported': 'Extrato importado',
    };
    return labels[eventType] || eventType;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PROCESSED':
        return <Check className="w-3 h-3 text-neon-cyan" />;
      case 'PROCESSING':
        return <Loader2 className="w-3 h-3 text-neon-amber animate-spin" />;
      case 'FAILED':
        return <AlertCircle className="w-3 h-3 text-neon-rose" />;
      default:
        return <Clock className="w-3 h-3 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PROCESSED': return 'border-neon-cyan/30 bg-neon-cyan/5';
      case 'PROCESSING': return 'border-neon-amber/30 bg-neon-amber/5';
      case 'FAILED': return 'border-neon-rose/30 bg-neon-rose/5';
      default: return 'border-white/10 bg-white/5';
    }
  };

  const getTimeAgo = (dateString: string) => {
    const diff = Date.now() - new Date(dateString).getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    
    if (seconds < 60) return 'agora';
    if (minutes < 60) return `${minutes}m atrás`;
    if (hours < 24) return `${hours}h atrás`;
    return `${Math.floor(hours / 24)}d atrás`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-neon-purple to-neon-cyan flex items-center justify-center">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Timeline de Eventos</h3>
            <p className="text-xs text-muted-foreground">
              Atividade em tempo real
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-neon-cyan">
          <div className="w-2 h-2 rounded-full bg-neon-cyan animate-pulse" />
          <span>Live</span>
        </div>
      </div>

      {/* Timeline */}
      <div className="p-4 max-h-[300px] overflow-y-auto">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-12 rounded-lg bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nenhum evento recente</p>
          </div>
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-5 top-0 bottom-0 w-px bg-gradient-to-b from-neon-cyan/50 via-neon-purple/50 to-transparent" />
            
            <div className="space-y-3">
              {events.map((event, index) => {
                const Icon = getEventIcon(event.event_type);
                return (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`relative pl-12 py-2 px-3 rounded-lg border ${getStatusColor(event.status)}`}
                  >
                    {/* Icon on timeline */}
                    <div className="absolute left-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-sidebar border border-white/20 flex items-center justify-center">
                      <Icon className="w-3 h-3 text-white" />
                    </div>
                    
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-white truncate">
                            {getEventLabel(event.event_type)}
                          </span>
                          {getStatusIcon(event.status)}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          {event.source && (
                            <span className="text-xs text-muted-foreground capitalize">
                              via {event.source}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {getTimeAgo(event.created_at)}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
