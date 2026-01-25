import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface GrowthPayload {
  event_id: string;
  event_type: string;
  payload: Record<string, unknown>;
  user_id: string;
}

interface GrowthInsight {
  type: string;
  title: string;
  description: string;
  impact: "low" | "medium" | "high";
  actionable: boolean;
  suggested_actions?: string[];
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

    const data: GrowthPayload = await req.json();
    console.log(`[Growth Agent] Analyzing growth opportunities for user: ${data.user_id}`);

    // Gather business data
    const [
      operationsData,
      companiesData,
      clientsData,
    ] = await Promise.all([
      supabase.from("master_operations")
        .select("*")
        .eq("user_id", data.user_id)
        .gte("transaction_date", getDateDaysAgo(90)),
      supabase.from("companies")
        .select("*")
        .eq("user_id", data.user_id),
      supabase.from("company_clients")
        .select("*")
        .eq("user_id", data.user_id),
    ]);

    const operations = operationsData.data || [];
    const companies = companiesData.data || [];
    const clients = clientsData.data || [];

    // Analyze and generate insights
    const insights = generateGrowthInsights({
      operations,
      companies,
      clients,
      requestType: data.event_type,
      payload: data.payload,
    });

    // Generate content suggestions if requested
    let contentSuggestions: Record<string, unknown> | null = null;
    if (data.event_type === "content.generate" || data.event_type === "marketing.campaign") {
      contentSuggestions = generateContentSuggestions(data.payload);
    }

    console.log(`[Growth Agent] Generated ${insights.length} insights`);

    // Log agent activity
    await supabase.from("agent_logs").insert({
      agent_type: "growth",
      action_type: "analyze_growth",
      user_id: data.user_id,
      input_data: { 
        operations_analyzed: operations.length,
        companies_count: companies.length,
        clients_count: clients.length,
        request_type: data.event_type,
      },
      output_data: { 
        insights_count: insights.length,
        has_content_suggestions: !!contentSuggestions,
      },
      execution_time_ms: Date.now() - startTime,
      confidence_score: 85,
    });

    console.log(`[Growth Agent] Completed in ${Date.now() - startTime}ms`);

    return new Response(
      JSON.stringify({
        success: true,
        insights,
        content_suggestions: contentSuggestions,
        analysis_period: "Last 90 days",
        execution_time_ms: Date.now() - startTime,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[Growth Agent] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function getDateDaysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().split("T")[0];
}

interface AnalysisData {
  operations: Array<{ operation_type: string; amount: number; category?: string; transaction_date: string }>;
  companies: Array<{ name: string; company_type: string }>;
  clients: Array<{ name: string; created_at: string }>;
  requestType: string;
  payload: Record<string, unknown>;
}

function generateGrowthInsights(data: AnalysisData): GrowthInsight[] {
  const insights: GrowthInsight[] = [];

  // Revenue trend analysis
  const incomeOps = data.operations.filter(o => o.operation_type === "income");
  const expenseOps = data.operations.filter(o => o.operation_type === "expense");
  
  const totalIncome = incomeOps.reduce((sum, o) => sum + o.amount, 0);
  const totalExpenses = expenseOps.reduce((sum, o) => sum + o.amount, 0);
  const profitMargin = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;

  // 1. Profit margin insight
  if (profitMargin < 20) {
    insights.push({
      type: "margin_optimization",
      title: "Low Profit Margin Alert",
      description: `Your current profit margin is ${profitMargin.toFixed(1)}%. Industry standard is 20-30%.`,
      impact: "high",
      actionable: true,
      suggested_actions: [
        "Review your pricing strategy",
        "Identify top 3 expense categories to optimize",
        "Consider value-added services to increase revenue",
      ],
    });
  } else if (profitMargin > 40) {
    insights.push({
      type: "growth_opportunity",
      title: "Strong Margins - Investment Opportunity",
      description: `Your ${profitMargin.toFixed(1)}% margin creates room for growth investment.`,
      impact: "high",
      actionable: true,
      suggested_actions: [
        "Invest in marketing to acquire more clients",
        "Expand service offerings",
        "Hire additional team members",
      ],
    });
  }

  // 2. Client growth analysis
  const recentClients = data.clients.filter(c => {
    const createdAt = new Date(c.created_at);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return createdAt >= thirtyDaysAgo;
  });

  if (recentClients.length === 0 && data.clients.length > 0) {
    insights.push({
      type: "client_acquisition",
      title: "Client Acquisition Stalled",
      description: "No new clients in the last 30 days. Consider ramping up marketing efforts.",
      impact: "medium",
      actionable: true,
      suggested_actions: [
        "Launch a referral program",
        "Increase social media presence",
        "Reach out to past leads",
      ],
    });
  } else if (recentClients.length >= 3) {
    insights.push({
      type: "client_growth",
      title: "Strong Client Acquisition",
      description: `${recentClients.length} new clients in the last 30 days. Keep the momentum!`,
      impact: "high",
      actionable: true,
      suggested_actions: [
        "Ask for testimonials and reviews",
        "Implement a customer success program",
        "Upsell additional services",
      ],
    });
  }

  // 3. Revenue concentration risk
  if (incomeOps.length > 0) {
    const revenueByCategory = incomeOps.reduce((acc, op) => {
      const cat = op.category || "uncategorized";
      acc[cat] = (acc[cat] || 0) + op.amount;
      return acc;
    }, {} as Record<string, number>);

    const topCategory = Object.entries(revenueByCategory)
      .sort(([, a], [, b]) => b - a)[0];

    if (topCategory && topCategory[1] / totalIncome > 0.7) {
      insights.push({
        type: "diversification",
        title: "Revenue Concentration Risk",
        description: `${((topCategory[1] / totalIncome) * 100).toFixed(0)}% of revenue comes from ${topCategory[0]}. Consider diversifying.`,
        impact: "medium",
        actionable: true,
        suggested_actions: [
          "Develop complementary service offerings",
          "Target new market segments",
          "Create passive income streams",
        ],
      });
    }
  }

  // 4. Expense optimization
  const expensesByCategory = expenseOps.reduce((acc, op) => {
    const cat = op.category || "uncategorized";
    acc[cat] = (acc[cat] || 0) + op.amount;
    return acc;
  }, {} as Record<string, number>);

  const topExpenses = Object.entries(expensesByCategory)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3);

  if (topExpenses.length > 0 && totalExpenses > 0) {
    const topExpensePercentage = (topExpenses[0][1] / totalExpenses) * 100;
    if (topExpensePercentage > 40) {
      insights.push({
        type: "cost_optimization",
        title: "Major Expense Category",
        description: `${topExpenses[0][0]} represents ${topExpensePercentage.toFixed(0)}% of total expenses.`,
        impact: "medium",
        actionable: true,
        suggested_actions: [
          `Review ${topExpenses[0][0]} contracts for better rates`,
          "Explore alternative vendors",
          "Implement cost tracking for this category",
        ],
      });
    }
  }

  // 5. Scaling opportunity
  if (data.companies.length === 1 && totalIncome > 10000) {
    insights.push({
      type: "scaling",
      title: "Scaling Opportunity",
      description: "Your single company is performing well. Consider expanding your ecosystem.",
      impact: "high",
      actionable: true,
      suggested_actions: [
        "Evaluate opportunities for a satellite company",
        "Consider geographic expansion",
        "Explore strategic partnerships",
      ],
    });
  }

  // Always add at least one positive insight
  if (insights.length === 0) {
    insights.push({
      type: "status",
      title: "Business Health Check",
      description: "Your business metrics are within normal ranges. Keep monitoring key indicators.",
      impact: "low",
      actionable: false,
    });
  }

  return insights;
}

function generateContentSuggestions(payload: Record<string, unknown>): Record<string, unknown> {
  const topic = (payload.topic as string) || "business growth";
  const platform = (payload.platform as string) || "linkedin";
  const tone = (payload.tone as string) || "professional";

  return {
    content_calendar: [
      {
        day: "Monday",
        type: "Educational",
        topic: `5 Tips for ${topic}`,
        format: "Carousel",
      },
      {
        day: "Wednesday",
        type: "Case Study",
        topic: "Client Success Story",
        format: "Single Image + Caption",
      },
      {
        day: "Friday",
        type: "Engagement",
        topic: "Industry Poll / Question",
        format: "Text Post",
      },
    ],
    carousel_script: {
      slides: [
        { slide: 1, content: `The Ultimate Guide to ${topic}` },
        { slide: 2, content: "Problem: What challenges do you face?" },
        { slide: 3, content: "Solution: Here's what works" },
        { slide: 4, content: "Step 1: [Actionable tip]" },
        { slide: 5, content: "Step 2: [Actionable tip]" },
        { slide: 6, content: "Step 3: [Actionable tip]" },
        { slide: 7, content: "Results: What to expect" },
        { slide: 8, content: "CTA: Ready to start? Contact us!" },
      ],
    },
    caption_templates: [
      `🚀 ${topic} doesn't have to be complicated.\n\nHere are 3 things I learned:\n\n1. [Insight]\n2. [Insight]\n3. [Insight]\n\nWhat's your biggest challenge with ${topic}? 👇`,
      `I used to struggle with ${topic}.\n\nThen I discovered this:\n\n[Key insight]\n\nThe result? [Outcome]\n\nDM me if you want to learn more.`,
    ],
    hashtag_suggestions: [
      `#${topic.replace(/\s+/g, "")}`,
      "#BusinessGrowth",
      "#Entrepreneurship",
      "#SmallBusiness",
      "#BusinessTips",
    ],
    best_posting_times: {
      [platform]: ["9:00 AM", "12:00 PM", "5:00 PM"],
    },
  };
}
