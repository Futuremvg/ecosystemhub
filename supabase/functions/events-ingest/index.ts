import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface IngestPayload {
  company_id: string;
  source: "manual" | "bank" | "stripe" | "email" | "calendar" | "firecrawl" | "docs" | "integration";
  event_type: string;
  external_id?: string | null;
  occurred_at?: string | null;
  payload: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

interface IngestResponse {
  success: boolean;
  event_id: string;
  is_duplicate: boolean;
  idempotency_key: string;
}

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[EVENTS-INGEST] ${step}${detailsStr}`);
};

/**
 * Generate a SHA-256 hash for idempotency
 * Key = company_id + source + event_type + (external_id OR payload fingerprint)
 */
async function generateIdempotencyKey(
  companyId: string,
  source: string,
  eventType: string,
  externalId: string | null | undefined,
  payload: Record<string, unknown>
): Promise<string> {
  // Use external_id if available, otherwise hash the payload
  const uniquePart = externalId || JSON.stringify(payload);
  const rawKey = `${companyId}:${source}:${eventType}:${uniquePart}`;
  
  // Create SHA-256 hash
  const encoder = new TextEncoder();
  const data = encoder.encode(rawKey);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  
  return hashHex;
}

/**
 * Validate that user has access to the company
 */
async function validateCompanyAccess(
  supabaseUrl: string,
  supabaseServiceKey: string,
  userId: string,
  companyId: string
): Promise<boolean> {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const { data, error } = await supabase
    .from("companies")
    .select("id")
    .eq("id", companyId)
    .eq("user_id", userId)
    .single();

  if (error || !data) {
    return false;
  }
  return true;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Check for internal service call (from other edge functions)
    const isServiceCall = req.headers.get("x-service-role") === "true";
    const authHeader = req.headers.get("Authorization");

    let userId: string | null = null;

    // For authenticated user calls, validate the token
    if (authHeader?.startsWith("Bearer ") && !isServiceCall) {
      const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } },
      });

      const token = authHeader.replace("Bearer ", "");
      const { data: claims, error: claimsError } = await supabaseAuth.auth.getClaims(token);

      if (claimsError || !claims?.claims?.sub) {
        logStep("Authentication failed", { error: claimsError?.message });
        return new Response(
          JSON.stringify({ error: "Unauthorized", details: "Invalid or expired token" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      userId = claims.claims.sub as string;
      logStep("User authenticated", { userId });
    } else if (!isServiceCall) {
      // No auth header and not a service call
      logStep("No authentication provided");
      return new Response(
        JSON.stringify({ error: "Unauthorized", details: "Authentication required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use service role client for database operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse and validate input
    const body: IngestPayload = await req.json();

    // Validate required fields
    if (!body.company_id) {
      return new Response(
        JSON.stringify({ error: "Validation error", details: "company_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!body.source) {
      return new Response(
        JSON.stringify({ error: "Validation error", details: "source is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!body.event_type) {
      return new Response(
        JSON.stringify({ error: "Validation error", details: "event_type is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!body.payload || typeof body.payload !== "object") {
      return new Response(
        JSON.stringify({ error: "Validation error", details: "payload must be an object" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const validSources = ["manual", "bank", "stripe", "email", "calendar", "firecrawl", "docs", "integration"];
    if (!validSources.includes(body.source)) {
      return new Response(
        JSON.stringify({ error: "Validation error", details: `source must be one of: ${validSources.join(", ")}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    logStep("Ingesting event", { source: body.source, type: body.event_type, company: body.company_id });

    // For user-initiated events (manual), validate company access
    if (userId && body.source === "manual") {
      const hasAccess = await validateCompanyAccess(supabaseUrl, supabaseServiceKey, userId, body.company_id);
      if (!hasAccess) {
        logStep("Company access denied", { userId, companyId: body.company_id });
        return new Response(
          JSON.stringify({ error: "Forbidden", details: "You do not have access to this company" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Get a user_id for the event - either from auth or from the payload
    let finalUserId = userId || (body.metadata?.user_id as string | undefined);
    
    if (!finalUserId) {
      // For service calls, we need to get the company owner
      const { data: company } = await supabase
        .from("companies")
        .select("user_id")
        .eq("id", body.company_id)
        .single();
      
      if (!company?.user_id) {
        return new Response(
          JSON.stringify({ error: "Validation error", details: "Cannot determine user for this event" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      finalUserId = company.user_id;
    }

    // Generate idempotency key
    const idempotencyKey = await generateIdempotencyKey(
      body.company_id,
      body.source,
      body.event_type,
      body.external_id,
      body.payload
    );

    logStep("Idempotency key generated", { key: idempotencyKey.substring(0, 16) + "..." });

    // Check for existing event with same idempotency key
    // We store the idempotency key in external_id for lookup
    const { data: existingEvents } = await supabase
      .from("events")
      .select("id")
      .eq("external_id", idempotencyKey)
      .eq("source", body.source)
      .limit(1);

    if (existingEvents && existingEvents.length > 0) {
      logStep("Duplicate event detected", { existingId: existingEvents[0].id });
      
      const response: IngestResponse = {
        success: true,
        event_id: existingEvents[0].id,
        is_duplicate: true,
        idempotency_key: idempotencyKey,
      };

      return new Response(JSON.stringify(response), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Get tenant_id from company if it exists
    const { data: companyData } = await supabase
      .from("companies")
      .select("tenant_id")
      .eq("id", body.company_id)
      .single();

    // Prepare the event record
    const eventRecord = {
      event_type: body.event_type,
      source: body.source,
      external_id: idempotencyKey, // Use idempotency key as external_id for dedup
      payload: {
        ...body.payload,
        _metadata: {
          ...body.metadata,
          original_external_id: body.external_id,
          ingested_at: new Date().toISOString(),
          company_id: body.company_id,
        },
      },
      user_id: finalUserId,
      tenant_id: companyData?.tenant_id || null,
      status: "NEW",
      created_at: body.occurred_at || new Date().toISOString(),
    };

    // Insert the event
    const { data: newEvent, error: insertError } = await supabase
      .from("events")
      .insert(eventRecord)
      .select("id")
      .single();

    if (insertError) {
      logStep("Insert error", { error: insertError.message });
      return new Response(
        JSON.stringify({ error: "Database error", details: insertError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    logStep("Event created successfully", { eventId: newEvent.id });

    const response: IngestResponse = {
      success: true,
      event_id: newEvent.id,
      is_duplicate: false,
      idempotency_key: idempotencyKey,
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 201,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(
      JSON.stringify({ error: "Internal server error", details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
