import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BriefingPayload {
  event_id: string;
  event_type: string;
  payload: Record<string, unknown>;
  user_id: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const data: BriefingPayload = await req.json();
    console.log(`[Briefing Agent] Generating briefing for user: ${data.user_id}`);

    // Determine briefing type
    const hour = new Date().getHours();
    const briefingType = hour < 12 ? "morning" : "evening";

    // Gather data for briefing
    const [
      pendingTasks,
      recentAlerts,
      recentOperations,
      cashFlowData,
    ] = await Promise.all([
      supabase.from("tasks")
        .select("*")
        .eq("user_id", data.user_id)
        .eq("status", "pending")
        .order("priority", { ascending: false })
        .limit(5),
      supabase.from("alerts")
        .select("*")
        .eq("user_id", data.user_id)
        .eq("is_read", false)
        .order("created_at", { ascending: false })
        .limit(5),
      supabase.from("master_operations")
        .select("*")
        .eq("user_id", data.user_id)
        .gte("created_at", getDateDaysAgo(7))
        .order("created_at", { ascending: false }),
      supabase.from("master_operations")
        .select("operation_type, amount")
        .eq("user_id", data.user_id)
        .gte("transaction_date", getDateDaysAgo(30)),
    ]);

    // Calculate metrics
    const operations = recentOperations.data || [];
    const allOperations = cashFlowData.data || [];
    
    const income = allOperations.filter(o => o.operation_type === "income").reduce((sum, o) => sum + o.amount, 0);
    const expenses = allOperations.filter(o => o.operation_type === "expense").reduce((sum, o) => sum + o.amount, 0);
    const netCashFlow = income - expenses;
    
    const pendingApprovals = operations.filter(o => o.status === "pending_approval").length;
    const flaggedItems = operations.filter(o => o.status === "flagged_for_review").length;

    // Generate briefing content
    const briefingContent = generateBriefingContent({
      briefingType,
      pendingTasks: pendingTasks.data || [],
      recentAlerts: recentAlerts.data || [],
      income,
      expenses,
      netCashFlow,
      pendingApprovals,
      flaggedItems,
      recentOperationsCount: operations.length,
    });

    // Save briefing
    const { data: briefing, error: briefingError } = await supabase
      .from("briefings")
      .insert({
        user_id: data.user_id,
        briefing_type: briefingType,
        content: briefingContent,
      })
      .select()
      .single();

    if (briefingError) throw briefingError;

    console.log(`[Briefing Agent] Created ${briefingType} briefing: ${briefing.id}`);

    // Log agent activity
    await supabase.from("agent_logs").insert({
      agent_type: "briefing",
      action_type: `generate_${briefingType}_briefing`,
      user_id: data.user_id,
      input_data: { 
        pending_tasks: pendingTasks.data?.length || 0,
        recent_alerts: recentAlerts.data?.length || 0,
        operations_analyzed: allOperations.length,
      },
      output_data: { briefing_id: briefing.id, summary: briefingContent.summary },
      execution_time_ms: Date.now() - startTime,
      confidence_score: 100,
    });

    console.log(`[Briefing Agent] Completed in ${Date.now() - startTime}ms`);

    return new Response(
      JSON.stringify({
        success: true,
        briefing_id: briefing.id,
        briefing_type: briefingType,
        content: briefingContent,
        execution_time_ms: Date.now() - startTime,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[Briefing Agent] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function getDateDaysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString();
}

interface BriefingData {
  briefingType: string;
  pendingTasks: Array<{ title: string; priority: string; due_date?: string }>;
  recentAlerts: Array<{ title: string; severity: string; alert_type: string }>;
  income: number;
  expenses: number;
  netCashFlow: number;
  pendingApprovals: number;
  flaggedItems: number;
  recentOperationsCount: number;
}

function generateBriefingContent(data: BriefingData): Record<string, unknown> {
  const greeting = data.briefingType === "morning" 
    ? "Good morning! Here's your executive briefing for today."
    : "Good evening! Here's your end-of-day summary.";

  // Generate summary text
  let summary = greeting + " ";
  
  if (data.netCashFlow >= 0) {
    summary += `Your 30-day cash flow is positive at $${data.netCashFlow.toFixed(2)} CAD. `;
  } else {
    summary += `Attention: Your 30-day cash flow is negative at -$${Math.abs(data.netCashFlow).toFixed(2)} CAD. `;
  }

  if (data.pendingApprovals > 0) {
    summary += `You have ${data.pendingApprovals} transaction(s) pending approval. `;
  }

  if (data.flaggedItems > 0) {
    summary += `${data.flaggedItems} item(s) flagged for review. `;
  }

  const highPriorityTasks = data.pendingTasks.filter(t => t.priority === "high");
  if (highPriorityTasks.length > 0) {
    summary += `${highPriorityTasks.length} high-priority task(s) require attention.`;
  }

  // Build priorities list
  const priorities = data.pendingTasks.slice(0, 3).map((task, index) => ({
    rank: index + 1,
    title: task.title,
    priority: task.priority,
    due_date: task.due_date,
  }));

  // Build alerts summary
  const criticalAlerts = data.recentAlerts.filter(a => a.severity === "critical" || a.severity === "high");

  // Financial snapshot
  const financialSnapshot = {
    period: "Last 30 days",
    income: data.income,
    expenses: data.expenses,
    net_cash_flow: data.netCashFlow,
    currency: "CAD",
    trend: data.netCashFlow >= 0 ? "positive" : "negative",
  };

  // Action items
  const actionItems: string[] = [];
  if (data.pendingApprovals > 0) {
    actionItems.push(`Review ${data.pendingApprovals} pending approval(s)`);
  }
  if (data.flaggedItems > 0) {
    actionItems.push(`Investigate ${data.flaggedItems} flagged transaction(s)`);
  }
  if (criticalAlerts.length > 0) {
    actionItems.push(`Address ${criticalAlerts.length} critical alert(s)`);
  }
  if (highPriorityTasks.length > 0) {
    actionItems.push(`Complete ${highPriorityTasks.length} high-priority task(s)`);
  }

  return {
    summary,
    generated_at: new Date().toISOString(),
    briefing_type: data.briefingType,
    priorities,
    alerts: {
      total: data.recentAlerts.length,
      critical: criticalAlerts.length,
      items: data.recentAlerts.slice(0, 3).map(a => ({
        title: a.title,
        severity: a.severity,
        type: a.alert_type,
      })),
    },
    financial_snapshot: financialSnapshot,
    action_items: actionItems,
    metrics: {
      pending_tasks: data.pendingTasks.length,
      pending_approvals: data.pendingApprovals,
      flagged_items: data.flaggedItems,
      recent_operations: data.recentOperationsCount,
    },
  };
}
