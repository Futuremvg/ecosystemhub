import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EventPayload {
  event_type: string;
  source: string;
  payload: Record<string, unknown>;
  external_id?: string;
  user_id?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get("Authorization");
    let userId: string | null = null;

    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.replace("Bearer ", "");
      const { data: claims } = await supabase.auth.getClaims(token);
      userId = claims?.claims?.sub || null;
    }

    const eventData: EventPayload = await req.json();
    
    console.log(`[Event Bus] Received event: ${eventData.event_type} from ${eventData.source}`);

    // Create event record
    const { data: event, error: eventError } = await supabase
      .from("events")
      .insert({
        event_type: eventData.event_type,
        source: eventData.source,
        payload: eventData.payload,
        external_id: eventData.external_id,
        user_id: eventData.user_id || userId,
        status: "NEW",
      })
      .select()
      .single();

    if (eventError) {
      console.error("[Event Bus] Error creating event:", eventError);
      throw eventError;
    }

    console.log(`[Event Bus] Event created with ID: ${event.id}`);

    // Update status to PROCESSING
    await supabase
      .from("events")
      .update({ status: "PROCESSING" })
      .eq("id", event.id);

    // Route to appropriate agents based on event type
    const agentResults: Record<string, unknown> = {};
    const baseUrl = supabaseUrl.replace(/\/$/, "");

    // Agent pipeline based on event type
    const agentPipeline = getAgentPipeline(eventData.event_type);
    
    for (const agentName of agentPipeline) {
      try {
        console.log(`[Event Bus] Invoking ${agentName} agent...`);
        
        const agentResponse = await fetch(
          `${baseUrl}/functions/v1/agent-${agentName}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${supabaseServiceKey}`,
            },
            body: JSON.stringify({
              event_id: event.id,
              event_type: eventData.event_type,
              payload: eventData.payload,
              user_id: eventData.user_id || userId,
              previous_results: agentResults,
            }),
          }
        );

        if (agentResponse.ok) {
          const result = await agentResponse.json();
          agentResults[agentName] = result;
          console.log(`[Event Bus] ${agentName} agent completed successfully`);
        } else {
          const errorText = await agentResponse.text();
          console.error(`[Event Bus] ${agentName} agent failed:`, errorText);
          agentResults[agentName] = { error: errorText };
        }
      } catch (agentError) {
        console.error(`[Event Bus] Error calling ${agentName} agent:`, agentError);
        agentResults[agentName] = { error: String(agentError) };
      }
    }

    // Update event status to PROCESSED
    await supabase
      .from("events")
      .update({
        status: "PROCESSED",
        processed_at: new Date().toISOString(),
        payload: { ...eventData.payload, agent_results: agentResults },
      })
      .eq("id", event.id);

    console.log(`[Event Bus] Event ${event.id} fully processed`);

    return new Response(
      JSON.stringify({
        success: true,
        event_id: event.id,
        agents_invoked: agentPipeline,
        results: agentResults,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[Event Bus] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function getAgentPipeline(eventType: string): string[] {
  const pipelines: Record<string, string[]> = {
    // Financial events - full pipeline
    "transaction.created": ["normalization", "deduplication", "classification", "policy", "anomaly", "action"],
    "transaction.updated": ["normalization", "classification", "policy", "anomaly"],
    "payment.received": ["normalization", "deduplication", "classification", "policy", "action", "briefing"],
    "invoice.created": ["normalization", "classification", "policy", "action"],
    
    // Bank statement import
    "bank_statement.imported": ["normalization", "deduplication", "classification", "policy", "anomaly", "briefing"],
    
    // Receipt scan
    "receipt.scanned": ["normalization", "classification", "action"],
    
    // Briefing requests
    "briefing.requested": ["briefing"],
    "briefing.morning": ["briefing"],
    "briefing.evening": ["briefing"],
    
    // Growth/Marketing events
    "growth.analyze": ["growth"],
    "marketing.campaign": ["growth", "action"],
    "content.generate": ["growth"],
    
    // System events
    "system.audit": ["policy", "anomaly"],
    "system.healthcheck": ["anomaly"],
    
    // Default pipeline for unknown events
    default: ["normalization", "classification"],
  };

  return pipelines[eventType] || pipelines.default;
}
