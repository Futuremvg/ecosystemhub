import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Sunrise, 
  Sunset, 
  Calendar,
  ChevronRight,
  Sparkles,
  CheckCircle2,
  Clock,
  ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface BriefingItem {
  id: string;
  title: string;
  description: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  actionLabel?: string;
}

export function BriefingWidget() {
  const { user } = useAuth();
  const [briefingType, setBriefingType] = useState<'morning' | 'evening'>('morning');
  const [items, setItems] = useState<BriefingItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Determine briefing type based on time
  useEffect(() => {
    const hour = new Date().getHours();
    setBriefingType(hour >= 17 ? 'evening' : 'morning');
  }, []);

  // Load briefing from database
  useEffect(() => {
    const loadBriefing = async () => {
      if (!user) return;
      
      setIsLoading(true);
      
      // Try to get today's briefing
      const today = new Date().toISOString().split('T')[0];
      const { data } = await supabase
        .from('briefings')
        .select('*')
        .eq('user_id', user.id)
        .eq('briefing_type', briefingType)
        .gte('generated_at', today)
        .order('generated_at', { ascending: false })
        .limit(1);
      
      if (data && data.length > 0) {
        const content = data[0].content as { top3?: BriefingItem[] };
        setItems(content.top3 || []);
      } else {
        // Use placeholder items
        setItems([
          {
            id: '1',
            title: 'Revisar faturas pendentes',
            description: '3 faturas vencem esta semana - R$ 12.500 total',
            priority: 'high',
            actionLabel: 'Ver faturas'
          },
          {
            id: '2',
            title: 'Conciliar extrato bancário',
            description: '15 transações aguardando classificação',
            priority: 'medium',
            actionLabel: 'Conciliar'
          },
          {
            id: '3',
            title: 'Aprovar despesas pendentes',
            description: '2 despesas aguardam sua aprovação',
            priority: 'low',
            actionLabel: 'Revisar'
          }
        ]);
      }
      
      setIsLoading(false);
    };
    
    loadBriefing();
  }, [user, briefingType]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-neon-rose border-neon-rose/30 bg-neon-rose/10';
      case 'high': return 'text-neon-amber border-neon-amber/30 bg-neon-amber/10';
      case 'medium': return 'text-god-gold border-god-gold/30 bg-god-gold/10';
      case 'low': return 'text-neon-cyan border-neon-cyan/30 bg-neon-cyan/10';
      default: return 'text-muted-foreground border-border bg-muted';
    }
  };

  const handleConvertToTasks = async () => {
    // TODO: Implement briefing to tasks conversion
    console.log('Converting briefing to tasks...');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
            briefingType === 'morning' 
              ? 'bg-gradient-to-br from-neon-amber to-neon-rose' 
              : 'bg-gradient-to-br from-neon-purple to-neon-cyan'
          }`}>
            {briefingType === 'morning' ? (
              <Sunrise className="w-5 h-5 text-white" />
            ) : (
              <Sunset className="w-5 h-5 text-white" />
            )}
          </div>
          <div>
            <h3 className="font-semibold text-white">
              {briefingType === 'morning' ? 'Briefing da Manhã' : 'Briefing do Fim do Dia'}
            </h3>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="text-neon-cyan hover:text-neon-cyan/80 hover:bg-neon-cyan/10"
            onClick={handleConvertToTasks}
          >
            <Sparkles className="w-4 h-4 mr-1" />
            Gerar Tarefas
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="mb-3">
          <h4 className="text-sm font-medium text-white/80 flex items-center gap-2">
            <span className="text-neon-cyan">⚡</span>
            Top 3 Prioridades de Hoje
          </h4>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 rounded-lg bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`p-3 rounded-lg border ${getPriorityColor(item.priority)} transition-all hover:scale-[1.01]`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg font-bold opacity-50">#{index + 1}</span>
                      <h5 className="font-medium text-white truncate">{item.title}</h5>
                    </div>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                  {item.actionLabel && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="shrink-0 text-xs hover:bg-white/10"
                    >
                      {item.actionLabel}
                      <ChevronRight className="w-3 h-3 ml-1" />
                    </Button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Quick Stats */}
        <div className="mt-4 pt-4 border-t border-white/10">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <div className="text-2xl font-bold text-neon-cyan">5</div>
              <div className="text-xs text-muted-foreground">Pendências</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-neon-amber">R$ 8.2k</div>
              <div className="text-xs text-muted-foreground">A Receber Hoje</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-neon-rose">2</div>
              <div className="text-xs text-muted-foreground">Reuniões</div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
