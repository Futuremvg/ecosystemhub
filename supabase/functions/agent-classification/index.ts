import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ClassificationPayload {
  event_id: string;
  event_type: string;
  payload: Record<string, unknown>;
  user_id: string;
  previous_results?: {
    normalization?: { normalized_data?: Record<string, unknown> };
    deduplication?: { master_operation_id?: string };
  };
}

// Business domain categories
const CATEGORIES = {
  income: [
    { name: "sales", keywords: ["sale", "payment", "invoice", "revenue", "product", "service"] },
    { name: "consulting", keywords: ["consulting", "advisory", "professional", "hourly", "project"] },
    { name: "subscription", keywords: ["subscription", "recurring", "monthly", "annual", "plan"] },
    { name: "refund_received", keywords: ["refund", "reimbursement", "credit"] },
    { name: "interest", keywords: ["interest", "dividend", "yield"] },
    { name: "other_income", keywords: [] },
  ],
  expense: [
    { name: "payroll", keywords: ["salary", "wage", "payroll", "bonus", "employee"] },
    { name: "rent", keywords: ["rent", "lease", "office", "space"] },
    { name: "utilities", keywords: ["electric", "water", "gas", "internet", "phone", "utility"] },
    { name: "software", keywords: ["software", "saas", "subscription", "tool", "app"] },
    { name: "marketing", keywords: ["marketing", "ads", "advertising", "campaign", "facebook", "google"] },
    { name: "travel", keywords: ["travel", "flight", "hotel", "uber", "taxi", "transport"] },
    { name: "meals", keywords: ["meal", "food", "restaurant", "lunch", "dinner", "coffee"] },
    { name: "supplies", keywords: ["supplies", "office", "materials", "equipment"] },
    { name: "professional_services", keywords: ["legal", "accounting", "consulting", "lawyer", "cpa"] },
    { name: "insurance", keywords: ["insurance", "coverage", "policy"] },
    { name: "taxes", keywords: ["tax", "gst", "hst", "vat", "government"] },
    { name: "bank_fees", keywords: ["fee", "charge", "bank", "interest", "overdraft"] },
    { name: "other_expense", keywords: [] },
  ],
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const data: ClassificationPayload = await req.json();
    console.log(`[Classification Agent] Processing event: ${data.event_id}`);

    const normalizedData = data.previous_results?.normalization?.normalized_data || data.payload;
    const masterOperationId = data.previous_results?.deduplication?.master_operation_id;

    // Get user's business rules for learned classifications
    const { data: businessRules } = await supabase
      .from("business_rules")
      .select("*")
      .eq("user_id", data.user_id)
      .eq("rule_type", "classification")
      .eq("is_active", true)
      .order("priority", { ascending: false });

    // Classify the transaction
    const classification = classifyTransaction(normalizedData, businessRules || []);
    console.log(`[Classification Agent] Classified as: ${classification.category} (${classification.confidence}%)`);

    // Update master operation if exists
    if (masterOperationId) {
      await supabase
        .from("master_operations")
        .update({
          category: classification.category,
          auto_classified: true,
          confidence_score: classification.confidence,
          classification_reason: classification.reasons,
        })
        .eq("id", masterOperationId);
    }

    // Log agent activity
    await supabase.from("agent_logs").insert({
      agent_type: "classification",
      action_type: "auto_classify",
      user_id: data.user_id,
      input_data: { description: normalizedData.description, counterparty: normalizedData.counterparty },
      output_data: classification,
      execution_time_ms: Date.now() - startTime,
      confidence_score: classification.confidence,
    });

    console.log(`[Classification Agent] Completed in ${Date.now() - startTime}ms`);

    return new Response(
      JSON.stringify({
        success: true,
        ...classification,
        master_operation_id: masterOperationId,
        execution_time_ms: Date.now() - startTime,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[Classification Agent] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function classifyTransaction(
  data: Record<string, unknown>,
  businessRules: Array<{ conditions: Record<string, unknown>; name: string; priority: number }>
): { category: string; confidence: number; reasons: string[]; subcategory?: string } {
  const description = ((data.description as string) || "").toLowerCase();
  const counterparty = ((data.counterparty as string) || "").toLowerCase();
  const operationType = (data.operation_type as string) || "expense";
  const searchText = `${description} ${counterparty}`;

  const reasons: string[] = [];

  // First, check user-defined business rules
  for (const rule of businessRules) {
    if (matchesRule(data, rule.conditions)) {
      reasons.push(`Matched business rule: ${rule.name}`);
      return {
        category: rule.conditions.category as string,
        subcategory: rule.conditions.subcategory as string,
        confidence: 95,
        reasons,
      };
    }
  }

  // Auto-classification based on keywords
  const categories = CATEGORIES[operationType as keyof typeof CATEGORIES] || CATEGORIES.expense;
  
  let bestMatch = { name: operationType === "income" ? "other_income" : "other_expense", score: 0 };
  
  for (const category of categories) {
    let score = 0;
    const matchedKeywords: string[] = [];
    
    for (const keyword of category.keywords) {
      if (searchText.includes(keyword)) {
        score += 10;
        matchedKeywords.push(keyword);
      }
    }
    
    if (score > bestMatch.score) {
      bestMatch = { name: category.name, score };
      reasons.length = 0;
      if (matchedKeywords.length) {
        reasons.push(`Matched keywords: ${matchedKeywords.join(", ")}`);
      }
    }
  }

  // Calculate confidence
  const confidence = Math.min(90, 50 + bestMatch.score * 2);
  
  if (!reasons.length) {
    reasons.push("No specific keywords matched, using default category");
  }

  return {
    category: bestMatch.name,
    confidence,
    reasons,
  };
}

function matchesRule(data: Record<string, unknown>, conditions: Record<string, unknown>): boolean {
  for (const [key, value] of Object.entries(conditions)) {
    if (key === "category" || key === "subcategory") continue;
    
    const dataValue = data[key];
    
    if (typeof value === "string" && typeof dataValue === "string") {
      if (!dataValue.toLowerCase().includes(value.toLowerCase())) {
        return false;
      }
    } else if (value !== dataValue) {
      return false;
    }
  }
  return true;
}
