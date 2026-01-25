import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NormalizationPayload {
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

    const data: NormalizationPayload = await req.json();
    console.log(`[Normalization Agent] Processing event: ${data.event_id}`);

    const normalizedData = normalizePayload(data.payload, data.event_type);

    // Log agent activity
    await supabase.from("agent_logs").insert({
      agent_type: "normalization",
      action_type: "normalize_data",
      user_id: data.user_id,
      input_data: data.payload,
      output_data: normalizedData,
      execution_time_ms: Date.now() - startTime,
      confidence_score: normalizedData.confidence || 95,
    });

    console.log(`[Normalization Agent] Completed in ${Date.now() - startTime}ms`);

    return new Response(
      JSON.stringify({
        success: true,
        normalized_data: normalizedData,
        execution_time_ms: Date.now() - startTime,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[Normalization Agent] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function normalizePayload(payload: Record<string, unknown>, eventType: string): Record<string, unknown> {
  const normalized: Record<string, unknown> = {
    original: payload,
    normalized_at: new Date().toISOString(),
    source_type: detectSourceType(payload),
  };

  // Normalize amount fields
  if (payload.amount !== undefined) {
    normalized.amount = normalizeAmount(payload.amount);
    normalized.currency = normalizeCurrency(payload.currency as string | undefined);
  }

  // Normalize date fields
  const dateFields = ["date", "transaction_date", "created_at", "timestamp"];
  for (const field of dateFields) {
    if (payload[field]) {
      normalized.transaction_date = normalizeDate(payload[field] as string);
      break;
    }
  }

  // Normalize description/memo
  const descriptionFields = ["description", "memo", "note", "reference"];
  for (const field of descriptionFields) {
    if (payload[field]) {
      normalized.description = normalizeText(payload[field] as string);
      break;
    }
  }

  // Normalize counterparty
  const counterpartyFields = ["counterparty", "merchant", "vendor", "payee", "payer", "name"];
  for (const field of counterpartyFields) {
    if (payload[field]) {
      normalized.counterparty = normalizeText(payload[field] as string);
      break;
    }
  }

  // Normalize operation type
  if (payload.type || payload.operation_type || payload.transaction_type) {
    normalized.operation_type = normalizeOperationType(
      (payload.type || payload.operation_type || payload.transaction_type) as string
    );
  }

  // Calculate confidence score
  normalized.confidence = calculateConfidence(normalized);

  return normalized;
}

function normalizeAmount(amount: unknown): number {
  if (typeof amount === "number") return Math.abs(amount);
  if (typeof amount === "string") {
    const cleaned = amount.replace(/[^0-9.-]/g, "");
    return Math.abs(parseFloat(cleaned) || 0);
  }
  return 0;
}

function normalizeCurrency(currency?: string): string {
  if (!currency) return "CAD"; // Default to CAD as per BLUEPRINT
  const currencyMap: Record<string, string> = {
    "$": "CAD",
    "US$": "USD",
    "USD": "USD",
    "CAD": "CAD",
    "R$": "BRL",
    "BRL": "BRL",
    "€": "EUR",
    "EUR": "EUR",
  };
  return currencyMap[currency.toUpperCase()] || currency.toUpperCase();
}

function normalizeDate(date: string): string {
  try {
    const parsed = new Date(date);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString().split("T")[0];
    }
  } catch {
    // Try common formats
    const formats = [
      /(\d{2})\/(\d{2})\/(\d{4})/, // DD/MM/YYYY
      /(\d{4})-(\d{2})-(\d{2})/, // YYYY-MM-DD
      /(\d{2})-(\d{2})-(\d{4})/, // DD-MM-YYYY
    ];
    for (const format of formats) {
      const match = date.match(format);
      if (match) {
        return `${match[3] || match[1]}-${match[2]}-${match[1] || match[3]}`;
      }
    }
  }
  return new Date().toISOString().split("T")[0];
}

function normalizeText(text: string): string {
  return text
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[^\w\s.-]/gi, "")
    .substring(0, 255);
}

function normalizeOperationType(type: string): string {
  const typeMap: Record<string, string> = {
    credit: "income",
    debit: "expense",
    income: "income",
    expense: "expense",
    deposit: "income",
    withdrawal: "expense",
    payment: "expense",
    receive: "income",
    transfer_in: "income",
    transfer_out: "expense",
  };
  return typeMap[type.toLowerCase()] || "expense";
}

function detectSourceType(payload: Record<string, unknown>): string {
  if (payload.stripe_id || payload.payment_intent) return "stripe";
  if (payload.bank_id || payload.account_number) return "bank";
  if (payload.receipt_url || payload.scanned) return "receipt";
  if (payload.csv_row || payload.import_batch) return "csv";
  return "manual";
}

function calculateConfidence(normalized: Record<string, unknown>): number {
  let score = 100;
  if (!normalized.amount) score -= 20;
  if (!normalized.transaction_date) score -= 15;
  if (!normalized.counterparty) score -= 10;
  if (!normalized.description) score -= 10;
  if (!normalized.operation_type) score -= 10;
  return Math.max(score, 50);
}
