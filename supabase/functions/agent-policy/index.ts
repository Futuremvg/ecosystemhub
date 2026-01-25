import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PolicyPayload {
  event_id: string;
  event_type: string;
  payload: Record<string, unknown>;
  user_id: string;
  previous_results?: {
    normalization?: { normalized_data?: Record<string, unknown> };
    deduplication?: { master_operation_id?: string };
    classification?: { category?: string };
  };
}

interface PolicyViolation {
  rule: string;
  severity: "low" | "medium" | "high" | "critical";
  message: string;
  action_required?: string;
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

    const data: PolicyPayload = await req.json();
    console.log(`[Policy Agent] Processing event: ${data.event_id}`);

    const normalizedData = data.previous_results?.normalization?.normalized_data || data.payload;
    const masterOperationId = data.previous_results?.deduplication?.master_operation_id;

    // Get user profile for thresholds
    const { data: profile } = await supabase
      .from("profiles")
      .select("approval_threshold")
      .eq("id", data.user_id)
      .single();

    const approvalThreshold = profile?.approval_threshold || 1000;

    // Get user's policy rules
    const { data: policyRules } = await supabase
      .from("business_rules")
      .select("*")
      .eq("user_id", data.user_id)
      .eq("rule_type", "policy")
      .eq("is_active", true);

    // Run policy checks
    const violations = checkPolicies(normalizedData, approvalThreshold, policyRules || []);
    const isCompliant = violations.length === 0;
    const requiresApproval = violations.some(v => v.severity === "high" || v.severity === "critical");

    console.log(`[Policy Agent] Compliant: ${isCompliant}, Violations: ${violations.length}`);

    // Update master operation status if needed
    if (masterOperationId && requiresApproval) {
      await supabase
        .from("master_operations")
        .update({ status: "pending_approval" })
        .eq("id", masterOperationId);
    }

    // Create alerts for violations
    for (const violation of violations) {
      if (violation.severity === "high" || violation.severity === "critical") {
        await supabase.from("alerts").insert({
          user_id: data.user_id,
          alert_type: "policy_violation",
          severity: violation.severity,
          title: violation.rule,
          description: violation.message,
          data: { violation, event_id: data.event_id, master_operation_id: masterOperationId },
        });
      }
    }

    // Log agent activity
    await supabase.from("agent_logs").insert({
      agent_type: "policy",
      action_type: isCompliant ? "compliance_check_passed" : "compliance_violations_found",
      user_id: data.user_id,
      input_data: { amount: normalizedData.amount, category: data.previous_results?.classification?.category },
      output_data: { isCompliant, violations, requiresApproval },
      execution_time_ms: Date.now() - startTime,
      confidence_score: isCompliant ? 100 : 100 - (violations.length * 10),
    });

    console.log(`[Policy Agent] Completed in ${Date.now() - startTime}ms`);

    return new Response(
      JSON.stringify({
        success: true,
        is_compliant: isCompliant,
        requires_approval: requiresApproval,
        violations,
        policies_checked: 5 + (policyRules?.length || 0),
        execution_time_ms: Date.now() - startTime,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[Policy Agent] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function checkPolicies(
  data: Record<string, unknown>,
  approvalThreshold: number,
  customRules: Array<{ name: string; conditions: Record<string, unknown>; priority: number }>
): PolicyViolation[] {
  const violations: PolicyViolation[] = [];
  const amount = (data.amount as number) || 0;

  // Built-in policy checks

  // 1. Approval threshold check
  if (amount > approvalThreshold) {
    violations.push({
      rule: "Approval Threshold Exceeded",
      severity: amount > approvalThreshold * 5 ? "critical" : "high",
      message: `Transaction amount $${amount.toFixed(2)} exceeds approval threshold of $${approvalThreshold.toFixed(2)}`,
      action_required: "Manual approval required",
    });
  }

  // 2. Missing documentation check
  if (amount > 500 && !data.description && !data.counterparty) {
    violations.push({
      rule: "Missing Documentation",
      severity: "medium",
      message: "Large transaction without description or counterparty information",
      action_required: "Add transaction details",
    });
  }

  // 3. Weekend transaction check
  if (data.transaction_date) {
    const date = new Date(data.transaction_date as string);
    const dayOfWeek = date.getDay();
    if ((dayOfWeek === 0 || dayOfWeek === 6) && amount > 1000) {
      violations.push({
        rule: "Weekend Large Transaction",
        severity: "low",
        message: "Large transaction on weekend may require verification",
      });
    }
  }

  // 4. Unusual category for amount
  const category = data.category as string;
  if (category === "meals" && amount > 200) {
    violations.push({
      rule: "Category Amount Mismatch",
      severity: "low",
      message: `Meals expense of $${amount.toFixed(2)} is unusually high`,
    });
  }

  // 5. Duplicate warning window
  if (data.potential_duplicate) {
    violations.push({
      rule: "Potential Duplicate",
      severity: "medium",
      message: "This transaction may be a duplicate of an existing entry",
      action_required: "Verify transaction is not duplicated",
    });
  }

  // Custom user-defined rules
  for (const rule of customRules) {
    if (matchesPolicyConditions(data, rule.conditions)) {
      violations.push({
        rule: rule.name,
        severity: (rule.conditions.severity as PolicyViolation["severity"]) || "medium",
        message: (rule.conditions.message as string) || `Policy rule "${rule.name}" triggered`,
        action_required: rule.conditions.action as string,
      });
    }
  }

  return violations;
}

function matchesPolicyConditions(data: Record<string, unknown>, conditions: Record<string, unknown>): boolean {
  for (const [key, value] of Object.entries(conditions)) {
    if (["severity", "message", "action"].includes(key)) continue;

    const dataValue = data[key];

    // Handle comparison operators
    if (typeof value === "object" && value !== null) {
      const op = value as Record<string, number>;
      if (op.$gt !== undefined && !((dataValue as number) > op.$gt)) return false;
      if (op.$lt !== undefined && !((dataValue as number) < op.$lt)) return false;
      if (op.$gte !== undefined && !((dataValue as number) >= op.$gte)) return false;
      if (op.$lte !== undefined && !((dataValue as number) <= op.$lte)) return false;
    } else if (value !== dataValue) {
      return false;
    }
  }
  return true;
}
