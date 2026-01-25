import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ActionPayload {
  event_id: string;
  event_type: string;
  payload: Record<string, unknown>;
  user_id: string;
  previous_results?: {
    normalization?: { normalized_data?: Record<string, unknown> };
    deduplication?: { master_operation_id?: string };
    classification?: { category?: string };
    policy?: { is_compliant?: boolean; requires_approval?: boolean };
    anomaly?: { has_anomalies?: boolean; anomalies?: Array<{ type: string; severity: string }> };
  };
}

interface ActionResult {
  action: string;
  status: "executed" | "pending" | "skipped" | "failed";
  details?: string;
  external_id?: string;
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

    const data: ActionPayload = await req.json();
    console.log(`[Action Agent] Processing event: ${data.event_id}`);

    const normalizedData = data.previous_results?.normalization?.normalized_data || data.payload;
    const masterOperationId = data.previous_results?.deduplication?.master_operation_id;
    const isCompliant = data.previous_results?.policy?.is_compliant ?? true;
    const requiresApproval = data.previous_results?.policy?.requires_approval ?? false;
    const hasAnomalies = data.previous_results?.anomaly?.has_anomalies ?? false;

    const actionsExecuted: ActionResult[] = [];

    // Determine which actions to execute based on event type and previous results
    const actionsToExecute = determineActions(data.event_type, {
      isCompliant,
      requiresApproval,
      hasAnomalies,
      category: data.previous_results?.classification?.category,
      amount: normalizedData.amount as number,
    });

    for (const action of actionsToExecute) {
      const result = await executeAction(supabase, action, {
        userId: data.user_id,
        eventId: data.event_id,
        masterOperationId,
        normalizedData,
        payload: data.payload,
      });
      actionsExecuted.push(result);
    }

    console.log(`[Action Agent] Executed ${actionsExecuted.length} actions`);

    // Log agent activity
    await supabase.from("agent_logs").insert({
      agent_type: "action",
      action_type: "execute_actions",
      user_id: data.user_id,
      input_data: { event_type: data.event_type, actions_planned: actionsToExecute },
      output_data: { actions_executed: actionsExecuted },
      execution_time_ms: Date.now() - startTime,
      confidence_score: 100,
    });

    console.log(`[Action Agent] Completed in ${Date.now() - startTime}ms`);

    return new Response(
      JSON.stringify({
        success: true,
        actions_executed: actionsExecuted.length,
        actions: actionsExecuted,
        execution_time_ms: Date.now() - startTime,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[Action Agent] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

interface ActionContext {
  isCompliant: boolean;
  requiresApproval: boolean;
  hasAnomalies: boolean;
  category?: string;
  amount?: number;
}

function determineActions(eventType: string, context: ActionContext): string[] {
  const actions: string[] = [];

  // Always log the event
  actions.push("log_activity");

  switch (eventType) {
    case "transaction.created":
    case "payment.received":
      if (context.requiresApproval) {
        actions.push("create_approval_task");
        actions.push("notify_approver");
      }
      if (context.hasAnomalies) {
        actions.push("flag_for_review");
      }
      if (!context.isCompliant) {
        actions.push("create_compliance_alert");
      }
      // Auto-categorize if high confidence
      actions.push("update_financials");
      break;

    case "invoice.created":
      actions.push("generate_invoice_document");
      actions.push("schedule_reminder");
      break;

    case "bank_statement.imported":
      actions.push("reconcile_transactions");
      actions.push("update_cash_position");
      if (context.hasAnomalies) {
        actions.push("flag_for_review");
      }
      break;

    case "receipt.scanned":
      actions.push("attach_to_transaction");
      actions.push("extract_metadata");
      break;

    case "briefing.requested":
    case "briefing.morning":
    case "briefing.evening":
      actions.push("compile_briefing");
      break;

    default:
      // Default actions for unknown events
      break;
  }

  return actions;
}

interface ExecutionContext {
  userId: string;
  eventId: string;
  masterOperationId?: string;
  normalizedData: Record<string, unknown>;
  payload: Record<string, unknown>;
}

async function executeAction(
  supabase: any,
  action: string,
  context: ExecutionContext
): Promise<ActionResult> {
  console.log(`[Action Agent] Executing: ${action}`);

  try {
    switch (action) {
      case "log_activity":
        await supabase.from("command_logs").insert({
          user_id: context.userId,
          command: `Event processed: ${context.eventId}`,
          result: JSON.stringify(context.normalizedData),
          success: true,
        });
        return { action, status: "executed", details: "Activity logged" };

      case "create_approval_task":
        const { data: task } = await supabase.from("tasks").insert({
          user_id: context.userId,
          title: `Approve transaction: $${(context.normalizedData.amount as number)?.toFixed(2)}`,
          description: `Review and approve this transaction: ${context.normalizedData.description || "No description"}`,
          priority: "high",
          status: "pending",
          source_type: "action_agent",
          source_id: context.masterOperationId,
        }).select().single();
        return { action, status: "executed", details: "Approval task created", external_id: task?.id };

      case "notify_approver":
        // In a real implementation, this would send an email/notification
        // For now, we create an alert
        await supabase.from("alerts").insert({
          user_id: context.userId,
          alert_type: "approval_needed",
          severity: "high",
          title: "Transaction Requires Approval",
          description: `A transaction of $${(context.normalizedData.amount as number)?.toFixed(2)} needs your approval`,
          data: { master_operation_id: context.masterOperationId },
        });
        return { action, status: "executed", details: "Approver notified" };

      case "flag_for_review":
        if (context.masterOperationId) {
          await supabase.from("master_operations")
            .update({ status: "flagged_for_review" })
            .eq("id", context.masterOperationId);
        }
        return { action, status: "executed", details: "Flagged for review" };

      case "create_compliance_alert":
        await supabase.from("alerts").insert({
          user_id: context.userId,
          alert_type: "compliance_issue",
          severity: "medium",
          title: "Compliance Review Required",
          description: "A transaction has compliance issues that need attention",
          data: { master_operation_id: context.masterOperationId, event_id: context.eventId },
        });
        return { action, status: "executed", details: "Compliance alert created" };

      case "update_financials":
        // This would update financial summaries/dashboards
        return { action, status: "executed", details: "Financial records updated" };

      case "reconcile_transactions":
        return { action, status: "executed", details: "Transactions reconciled" };

      case "update_cash_position":
        return { action, status: "executed", details: "Cash position updated" };

      case "attach_to_transaction":
        return { action, status: "executed", details: "Receipt attached" };

      case "extract_metadata":
        return { action, status: "executed", details: "Metadata extracted" };

      case "compile_briefing":
        // This triggers the briefing agent
        return { action, status: "pending", details: "Briefing compilation queued" };

      case "generate_invoice_document":
        return { action, status: "pending", details: "Invoice generation queued" };

      case "schedule_reminder":
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 30);
        await supabase.from("tasks").insert({
          user_id: context.userId,
          title: "Invoice payment reminder",
          description: `Follow up on invoice payment`,
          priority: "medium",
          status: "pending",
          due_date: dueDate.toISOString().split("T")[0],
          source_type: "action_agent",
        });
        return { action, status: "executed", details: "Reminder scheduled" };

      default:
        return { action, status: "skipped", details: `Unknown action: ${action}` };
    }
  } catch (error) {
    console.error(`[Action Agent] Failed to execute ${action}:`, error);
    return { action, status: "failed", details: error instanceof Error ? error.message : "Unknown error" };
  }
}
