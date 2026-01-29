import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

/**
 * Call the events-ingest gateway to create an event
 */
async function ingestStripeEvent(
  supabaseUrl: string,
  supabaseServiceKey: string,
  stripeEvent: Stripe.Event,
  companyId: string
): Promise<{ success: boolean; eventId?: string; isDuplicate?: boolean; error?: string }> {
  try {
    const ingestUrl = `${supabaseUrl}/functions/v1/events-ingest`;
    
    const response = await fetch(ingestUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${supabaseServiceKey}`,
        "x-service-role": "true", // Mark as internal service call
      },
      body: JSON.stringify({
        company_id: companyId,
        source: "stripe",
        event_type: `stripe.${stripeEvent.type}`,
        external_id: stripeEvent.id, // Stripe event ID for dedup
        occurred_at: new Date(stripeEvent.created * 1000).toISOString(),
        payload: stripeEvent.data.object,
        metadata: {
          stripe_event_id: stripeEvent.id,
          stripe_api_version: stripeEvent.api_version,
          stripe_livemode: stripeEvent.livemode,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { success: false, error: errorText };
    }

    const result = await response.json();
    return {
      success: true,
      eventId: result.event_id,
      isDuplicate: result.is_duplicate,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Find the company associated with a Stripe customer
 */
async function findCompanyByStripeCustomer(
  supabaseUrl: string,
  supabaseServiceKey: string,
  customerId: string | null
): Promise<string | null> {
  if (!customerId) return null;

  try {
    // For now, look up by checking integrations table for stripe integration with this customer
    const response = await fetch(
      `${supabaseUrl}/rest/v1/integrations?integration_type=eq.stripe&select=company_id,config`,
      {
        headers: {
          "Authorization": `Bearer ${supabaseServiceKey}`,
          "apikey": supabaseServiceKey,
          "Content-Type": "application/json",
        },
      }
    );

    if (response.ok) {
      const integrations = await response.json();
      for (const integration of integrations) {
        if (integration.config?.customer_id === customerId) {
          return integration.company_id;
        }
      }
    }

    // Fallback: Get the first company (for single-tenant scenarios)
    const companiesResponse = await fetch(
      `${supabaseUrl}/rest/v1/companies?select=id&limit=1`,
      {
        headers: {
          "Authorization": `Bearer ${supabaseServiceKey}`,
          "apikey": supabaseServiceKey,
          "Content-Type": "application/json",
        },
      }
    );

    if (companiesResponse.ok) {
      const companies = await companiesResponse.json();
      if (companies.length > 0) {
        return companies[0].id;
      }
    }

    return null;
  } catch {
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Webhook received");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    let event: Stripe.Event;

    // If webhook secret is configured, verify the signature
    if (webhookSecret && signature) {
      try {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
        logStep("Webhook signature verified");
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        logStep("Webhook signature verification failed", { error: errorMessage });
        return new Response(JSON.stringify({ error: "Invalid signature" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        });
      }
    } else {
      // For development/testing without webhook secret
      event = JSON.parse(body);
      logStep("Processing webhook without signature verification");
    }

    logStep("Event type", { type: event.type, id: event.id });

    // Extract customer ID from the event object
    let customerId: string | null = null;
    const eventObject = event.data.object as Record<string, unknown>;
    
    if (typeof eventObject.customer === "string") {
      customerId = eventObject.customer;
    } else if (typeof eventObject.id === "string" && event.type.startsWith("customer.")) {
      customerId = eventObject.id;
    }

    // Find the company for this customer
    const companyId = await findCompanyByStripeCustomer(supabaseUrl, supabaseServiceKey, customerId);

    if (companyId) {
      // Ingest the event through the centralized gateway
      const ingestResult = await ingestStripeEvent(supabaseUrl, supabaseServiceKey, event, companyId);
      
      if (ingestResult.success) {
        logStep("Event ingested", { 
          eventId: ingestResult.eventId, 
          isDuplicate: ingestResult.isDuplicate 
        });
      } else {
        logStep("Event ingestion failed", { error: ingestResult.error });
        // Continue processing even if ingestion fails
      }
    } else {
      logStep("No company found for customer, skipping event ingestion", { customerId });
    }

    // Handle specific events for immediate business logic
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        logStep("Checkout completed", { 
          customerId: session.customer, 
          customerEmail: session.customer_email,
          subscriptionId: session.subscription 
        });
        break;
      }

      case "customer.subscription.created": {
        const subscription = event.data.object as Stripe.Subscription;
        logStep("Subscription created", { 
          subscriptionId: subscription.id,
          customerId: subscription.customer,
          status: subscription.status 
        });
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        logStep("Subscription updated", { 
          subscriptionId: subscription.id,
          status: subscription.status,
          cancelAtPeriodEnd: subscription.cancel_at_period_end
        });
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        logStep("Subscription cancelled/deleted", { 
          subscriptionId: subscription.id,
          customerId: subscription.customer 
        });
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        logStep("Payment succeeded", { 
          invoiceId: invoice.id,
          customerId: invoice.customer,
          amountPaid: invoice.amount_paid 
        });
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        logStep("Payment failed", { 
          invoiceId: invoice.id,
          customerId: invoice.customer,
          attemptCount: invoice.attempt_count
        });
        break;
      }

      default:
        logStep("Unhandled event type", { type: event.type });
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
