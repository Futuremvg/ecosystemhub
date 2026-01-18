import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';

interface CashFlowData {
  date: string;
  balance: number;
  income: number;
  expense: number;
}

export function CashFlowChart() {
  const [data, setData] = useState<CashFlowData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Generate sample 30-day projection data
    const generateData = () => {
      const today = new Date();
      const result: CashFlowData[] = [];
      let balance = 45000;
      
      for (let i = 0; i < 30; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() + i);
        
        const income = Math.random() * 5000 + 1000;
        const expense = Math.random() * 4000 + 500;
        balance += income - expense;
        
        result.push({
          date: date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
          balance: Math.round(balance),
          income: Math.round(income),
          expense: Math.round(expense)
        });
      }
      
      return result;
    };
    
    setData(generateData());
    setIsLoading(false);
  }, []);

  const currentBalance = data[0]?.balance || 0;
  const projectedBalance = data[data.length - 1]?.balance || 0;
  const trend = projectedBalance > currentBalance ? 'up' : 'down';
  const trendPercent = ((projectedBalance - currentBalance) / currentBalance * 100).toFixed(1);

  const totalIncome = data.reduce((sum, d) => sum + d.income, 0);
  const totalExpense = data.reduce((sum, d) => sum + d.expense, 0);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0
    }).format(value);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload) return null;
    
    return (
      <div className="bg-sidebar/95 backdrop-blur-sm border border-white/10 rounded-lg p-2 text-xs">
        <p className="text-white font-medium mb-1">{label}</p>
        <p className="text-neon-cyan">Saldo: {formatCurrency(payload[0]?.value)}</p>
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm overflow-hidden h-full"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-neon-cyan to-neon-purple flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Fluxo de Caixa</h3>
            <p className="text-xs text-muted-foreground">Projeção 30 dias</p>
          </div>
        </div>
        <div className={`flex items-center gap-1 text-sm font-medium ${
          trend === 'up' ? 'text-neon-cyan' : 'text-neon-rose'
        }`}>
          {trend === 'up' ? (
            <ArrowUpRight className="w-4 h-4" />
          ) : (
            <ArrowDownRight className="w-4 h-4" />
          )}
          {trendPercent}%
        </div>
      </div>

      {/* Chart */}
      <div className="p-4">
        {isLoading ? (
          <div className="h-[120px] bg-white/5 rounded-lg animate-pulse" />
        ) : (
          <div className="h-[120px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                <defs>
                  <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(187 100% 50%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(187 100% 50%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 10, fill: 'hsl(210 8% 55%)' }}
                  axisLine={false}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis hide />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="balance"
                  stroke="hsl(187 100% 50%)"
                  strokeWidth={2}
                  fill="url(#balanceGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="p-4 border-t border-white/10">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <div className="text-xs text-muted-foreground mb-1">Saldo Atual</div>
            <div className="text-sm font-bold text-white">
              {formatCurrency(currentBalance)}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1 flex items-center justify-center gap-1">
              <ArrowUpRight className="w-3 h-3 text-neon-cyan" />
              Entradas
            </div>
            <div className="text-sm font-bold text-neon-cyan">
              {formatCurrency(totalIncome)}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1 flex items-center justify-center gap-1">
              <ArrowDownRight className="w-3 h-3 text-neon-rose" />
              Saídas
            </div>
            <div className="text-sm font-bold text-neon-rose">
              {formatCurrency(totalExpense)}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
