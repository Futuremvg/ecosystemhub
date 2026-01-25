import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface DeduplicationPayload {
  event_id: string;
  event_type: string;
  payload: Record<string, unknown>;
  user_id: string;
  previous_results?: {
    normalization?: {
      normalized_data?: Record<string, unknown>;
    };
  };
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

    const data: DeduplicationPayload = await req.json();
    console.log(`[Deduplication Agent] Processing event: ${data.event_id}`);

    const normalizedData = data.previous_results?.normalization?.normalized_data || data.payload;
    
    // Generate Master Transaction ID
    const masterTxId = generateMasterTransactionId(normalizedData);
    console.log(`[Deduplication Agent] Generated Master TX ID: ${masterTxId}`);

    // Check for duplicates
    const { duplicateFound, existingOperation, matchConfidence } = await findDuplicates(
      supabase,
      normalizedData,
      data.user_id
    );

    let result: Record<string, unknown>;

    if (duplicateFound && existingOperation) {
      console.log(`[Deduplication Agent] Duplicate found: ${existingOperation.id}`);
      
      // Link this source to existing master operation
      await supabase.from("operation_sources").insert({
        master_operation_id: existingOperation.id,
        source_type: normalizedData.source_type || "unknown",
        external_id: normalizedData.external_id || data.event_id,
        raw_data: data.payload,
        match_type: "duplicate",
        match_confidence: matchConfidence,
      });

      result = {
        is_duplicate: true,
        master_operation_id: existingOperation.id,
        master_tx_id: masterTxId,
        match_confidence: matchConfidence,
        action: "linked_to_existing",
      };
    } else {
      // Create new master operation
      const { data: newOperation, error } = await supabase
        .from("master_operations")
        .insert({
          user_id: data.user_id,
          operation_type: normalizedData.operation_type || "expense",
          amount: normalizedData.amount || 0,
          currency: normalizedData.currency || "CAD",
          description: normalizedData.description,
          counterparty: normalizedData.counterparty,
          transaction_date: normalizedData.transaction_date,
          status: "pending_review",
          auto_classified: false,
          confidence_score: normalizedData.confidence || 80,
        })
        .select()
        .single();

      if (error) throw error;

      // Create source link
      await supabase.from("operation_sources").insert({
        master_operation_id: newOperation.id,
        source_type: normalizedData.source_type || "unknown",
        external_id: normalizedData.external_id || data.event_id,
        raw_data: data.payload,
        match_type: "new",
        match_confidence: 100,
      });

      result = {
        is_duplicate: false,
        master_operation_id: newOperation.id,
        master_tx_id: masterTxId,
        action: "created_new",
      };
    }

    // Log agent activity
    await supabase.from("agent_logs").insert({
      agent_type: "deduplication",
      action_type: duplicateFound ? "found_duplicate" : "created_master",
      user_id: data.user_id,
      input_data: { normalized: normalizedData },
      output_data: result,
      execution_time_ms: Date.now() - startTime,
      confidence_score: matchConfidence || 100,
    });

    console.log(`[Deduplication Agent] Completed in ${Date.now() - startTime}ms`);

    return new Response(
      JSON.stringify({
        success: true,
        ...result,
        execution_time_ms: Date.now() - startTime,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[Deduplication Agent] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function generateMasterTransactionId(data: Record<string, unknown>): string {
  const components = [
    data.transaction_date || new Date().toISOString().split("T")[0],
    data.amount?.toString() || "0",
    data.counterparty?.toString().substring(0, 10) || "unknown",
    data.source_type || "manual",
  ];
  
  const hash = components.join("-").replace(/\s+/g, "_").toLowerCase();
  const timestamp = Date.now().toString(36);
  
  return `MTX-${hash}-${timestamp}`;
}

async function findDuplicates(
  supabase: any,
  data: Record<string, unknown>,
  userId: string
): Promise<{ duplicateFound: boolean; existingOperation?: Record<string, unknown>; matchConfidence: number }> {
  
  // Search for potential duplicates based on amount, date, and counterparty
  const { data: potentialDuplicates, error } = await supabase
    .from("master_operations")
    .select("*")
    .eq("user_id", userId)
    .eq("amount", data.amount)
    .gte("transaction_date", getDateRange(data.transaction_date as string, -3))
    .lte("transaction_date", getDateRange(data.transaction_date as string, 3))
    .limit(10);

  if (error || !potentialDuplicates?.length) {
    return { duplicateFound: false, matchConfidence: 0 };
  }

  // Calculate match scores
  for (const existing of potentialDuplicates) {
    const score = calculateMatchScore(existing, data);
    if (score >= 85) {
      return {
        duplicateFound: true,
        existingOperation: existing,
        matchConfidence: score,
      };
    }
  }

  return { duplicateFound: false, matchConfidence: 0 };
}

function getDateRange(dateStr: string, days: number): string {
  const date = new Date(dateStr || new Date());
  date.setDate(date.getDate() + days);
  return date.toISOString().split("T")[0];
}

function calculateMatchScore(existing: Record<string, unknown>, incoming: Record<string, unknown>): number {
  let score = 0;
  let weights = 0;

  // Amount match (40 points)
  if (existing.amount === incoming.amount) {
    score += 40;
  }
  weights += 40;

  // Date match (30 points)
  if (existing.transaction_date === incoming.transaction_date) {
    score += 30;
  } else {
    const existingDate = new Date(existing.transaction_date as string);
    const incomingDate = new Date(incoming.transaction_date as string);
    const daysDiff = Math.abs((existingDate.getTime() - incomingDate.getTime()) / (1000 * 60 * 60 * 24));
    if (daysDiff <= 1) score += 25;
    else if (daysDiff <= 3) score += 15;
  }
  weights += 30;

  // Counterparty match (20 points)
  if (existing.counterparty && incoming.counterparty) {
    const similarity = calculateStringSimilarity(
      (existing.counterparty as string).toLowerCase(),
      (incoming.counterparty as string).toLowerCase()
    );
    score += similarity * 20;
  }
  weights += 20;

  // Description match (10 points)
  if (existing.description && incoming.description) {
    const similarity = calculateStringSimilarity(
      (existing.description as string).toLowerCase(),
      (incoming.description as string).toLowerCase()
    );
    score += similarity * 10;
  }
  weights += 10;

  return Math.round((score / weights) * 100);
}

function calculateStringSimilarity(str1: string, str2: string): number {
  const words1 = str1.split(/\s+/);
  const words2 = str2.split(/\s+/);
  
  let matches = 0;
  for (const word of words1) {
    if (words2.some(w => w.includes(word) || word.includes(w))) {
      matches++;
    }
  }
  
  return matches / Math.max(words1.length, words2.length);
}
