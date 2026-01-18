import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  CheckSquare, 
  Circle, 
  CheckCircle2, 
  Clock,
  Plus,
  ChevronRight,
  Flag
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface Task {
  id: string;
  title: string;
  description: string | null;
  priority: 'critical' | 'high' | 'medium' | 'low';
  status: 'pending' | 'in_progress' | 'completed';
  due_date: string | null;
}

export function TasksWidget() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadTasks = async () => {
      if (!user) return;
      
      setIsLoading(true);
      
      const { data } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .neq('status', 'completed')
        .order('priority', { ascending: true })
        .order('due_date', { ascending: true })
        .limit(5);
      
      if (data) {
        setTasks(data as Task[]);
      } else {
        // Placeholder tasks
        setTasks([
          {
            id: '1',
            title: 'Enviar proposta para Cliente XYZ',
            description: null,
            priority: 'high',
            status: 'in_progress',
            due_date: new Date().toISOString()
          },
          {
            id: '2',
            title: 'Revisar contrato de parceria',
            description: null,
            priority: 'medium',
            status: 'pending',
            due_date: new Date(Date.now() + 86400000).toISOString()
          },
          {
            id: '3',
            title: 'Atualizar planilha de custos',
            description: null,
            priority: 'low',
            status: 'pending',
            due_date: null
          }
        ]);
      }
      
      setIsLoading(false);
    };
    
    loadTasks();
  }, [user]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-neon-rose';
      case 'high': return 'text-neon-amber';
      case 'medium': return 'text-god-gold';
      default: return 'text-neon-cyan';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-4 h-4 text-neon-cyan" />;
      case 'in_progress':
        return <Clock className="w-4 h-4 text-neon-amber" />;
      default:
        return <Circle className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const handleToggleTask = async (taskId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'pending' ? 'in_progress' : 
                      currentStatus === 'in_progress' ? 'completed' : 'pending';
    
    setTasks(prev => prev.map(t => 
      t.id === taskId ? { ...t, status: newStatus as Task['status'] } : t
    ));
    
    await supabase
      .from('tasks')
      .update({ 
        status: newStatus,
        completed_at: newStatus === 'completed' ? new Date().toISOString() : null
      })
      .eq('id', taskId);
  };

  const formatDueDate = (dateString: string | null) => {
    if (!dateString) return null;
    
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const taskDate = new Date(date);
    taskDate.setHours(0, 0, 0, 0);
    
    const diff = taskDate.getTime() - today.getTime();
    const days = Math.ceil(diff / 86400000);
    
    if (days < 0) return { text: 'Atrasada', color: 'text-neon-rose' };
    if (days === 0) return { text: 'Hoje', color: 'text-neon-amber' };
    if (days === 1) return { text: 'Amanhã', color: 'text-neon-cyan' };
    return { text: date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }), color: 'text-muted-foreground' };
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm overflow-hidden h-full"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-neon-amber to-neon-rose flex items-center justify-center">
            <CheckSquare className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Tarefas</h3>
            <p className="text-xs text-muted-foreground">
              {tasks.filter(t => t.status !== 'completed').length} pendentes
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-neon-cyan hover:bg-neon-cyan/10"
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      {/* Tasks List */}
      <div className="p-4 space-y-2">
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-12 rounded-lg bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <CheckSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nenhuma tarefa pendente</p>
          </div>
        ) : (
          tasks.map((task, index) => {
            const dueInfo = formatDueDate(task.due_date);
            return (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors group"
              >
                <button
                  onClick={() => handleToggleTask(task.id, task.status)}
                  className="shrink-0"
                >
                  {getStatusIcon(task.status)}
                </button>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${
                    task.status === 'completed' ? 'text-muted-foreground line-through' : 'text-white'
                  }`}>
                    {task.title}
                  </p>
                  {dueInfo && (
                    <p className={`text-xs ${dueInfo.color}`}>{dueInfo.text}</p>
                  )}
                </div>
                <Flag className={`w-3 h-3 shrink-0 ${getPriorityColor(task.priority)}`} />
              </motion.div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-white/10">
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-muted-foreground hover:text-white"
        >
          Ver todas as tarefas
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </motion.div>
  );
}
