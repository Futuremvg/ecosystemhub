import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface QuickPulseData {
  alertsHigh: number;
  tasksDueToday: number;
  cashflowNet: number;
  isLoading: boolean;
}

export function useQuickPulse(): QuickPulseData {
  const { user } = useAuth();
  const [alertsHigh, setAlertsHigh] = useState(0);
  const [tasksDueToday, setTasksDueToday] = useState(0);
  const [cashflowNet, setCashflowNet] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    const fetchPulse = async () => {
      setIsLoading(true);
      try {
        const today = new Date();
        const todayStr = today.toISOString().split("T")[0];
        const currentMonth = today.getMonth() + 1;
        const currentYear = today.getFullYear();

        // Fetch alerts
        const { data: alerts } = await supabase
          .from("alerts")
          .select("id, severity")
          .eq("user_id", user.id)
          .eq("is_dismissed", false)
          .eq("severity", "high");

        setAlertsHigh(alerts?.length || 0);

        // Fetch tasks due today
        const { data: tasks } = await supabase
          .from("tasks")
          .select("id")
          .eq("user_id", user.id)
          .eq("status", "pending")
          .eq("due_date", todayStr);

        setTasksDueToday(tasks?.length || 0);

        // Fetch financial entries for this month
        const { data: entries } = await supabase
          .from("financial_entries")
          .select("amount, source_id, category_id")
          .eq("user_id", user.id)
          .eq("month", currentMonth)
          .eq("year", currentYear);

        if (entries) {
          const income = entries
            .filter(e => e.source_id !== null)
            .reduce((sum, e) => sum + Number(e.amount), 0);
          const expense = entries
            .filter(e => e.category_id !== null)
            .reduce((sum, e) => sum + Number(e.amount), 0);
          setCashflowNet(income - expense);
        }
      } catch (error) {
        console.error("Error fetching pulse data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPulse();
  }, [user]);

  return { alertsHigh, tasksDueToday, cashflowNet, isLoading };
}
