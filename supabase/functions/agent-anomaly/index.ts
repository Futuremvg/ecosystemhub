import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AnomalyPayload {
  event_id: string;
  event_type: string;
  payload: Record<string, unknown>;
  user_id: string;
  previous_results?: {
    normalization?: { normalized_data?: Record<string, unknown> };
    classification?: { category?: string };
  };
}

interface AnomalyDetection {
  type: string;
  severity: "low" | "medium" | "high" | "critical";
  description: string;
  confidence: number;
  recommendation?: string;
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

    const data: AnomalyPayload = await req.json();
    console.log(`[Anomaly Agent] Processing event: ${data.event_id}`);

    const normalizedData = data.previous_results?.normalization?.normalized_data || data.payload;
    const category = data.previous_results?.classification?.category;

    // Get historical data for comparison
    const { data: historicalData } = await supabase
      .from("master_operations")
      .select("amount, category, transaction_date, operation_type")
      .eq("user_id", data.user_id)
      .order("transaction_date", { ascending: false })
      .limit(100);

    // Run anomaly detection
    const anomalies = detectAnomalies(normalizedData, category, historicalData || []);
    const hasAnomalies = anomalies.length > 0;
    const criticalAnomalies = anomalies.filter(a => a.severity === "critical" || a.severity === "high");

    console.log(`[Anomaly Agent] Detected ${anomalies.length} anomalies (${criticalAnomalies.length} critical/high)`);

    // Create alerts for critical anomalies
    for (const anomaly of criticalAnomalies) {
      await supabase.from("alerts").insert({
        user_id: data.user_id,
        alert_type: "anomaly_detected",
        severity: anomaly.severity,
        title: `Anomaly: ${anomaly.type}`,
        description: anomaly.description,
        data: { 
          anomaly, 
          event_id: data.event_id,
          transaction_amount: normalizedData.amount,
          transaction_date: normalizedData.transaction_date,
        },
      });
    }

    // Log agent activity
    await supabase.from("agent_logs").insert({
      agent_type: "anomaly",
      action_type: hasAnomalies ? "anomalies_detected" : "no_anomalies",
      user_id: data.user_id,
      input_data: { 
        amount: normalizedData.amount, 
        category,
        historical_count: historicalData?.length || 0 
      },
      output_data: { anomalies, hasAnomalies },
      execution_time_ms: Date.now() - startTime,
      confidence_score: hasAnomalies ? anomalies[0].confidence : 100,
    });

    console.log(`[Anomaly Agent] Completed in ${Date.now() - startTime}ms`);

    return new Response(
      JSON.stringify({
        success: true,
        has_anomalies: hasAnomalies,
        anomaly_count: anomalies.length,
        critical_count: criticalAnomalies.length,
        anomalies,
        execution_time_ms: Date.now() - startTime,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[Anomaly Agent] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function detectAnomalies(
  data: Record<string, unknown>,
  category: string | undefined,
  historicalData: Array<{ amount: number; category: string; transaction_date: string; operation_type: string }>
): AnomalyDetection[] {
  const anomalies: AnomalyDetection[] = [];
  const amount = (data.amount as number) || 0;
  const operationType = data.operation_type as string;

  if (historicalData.length < 5) {
    // Not enough data for statistical analysis
    return anomalies;
  }

  // Calculate statistics
  const amounts = historicalData.map(d => d.amount);
  const mean = amounts.reduce((a, b) => a + b, 0) / amounts.length;
  const stdDev = Math.sqrt(amounts.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / amounts.length);
  
  // 1. Amount outlier detection (Z-score > 3)
  const zScore = stdDev > 0 ? (amount - mean) / stdDev : 0;
  if (Math.abs(zScore) > 3) {
    anomalies.push({
      type: "Amount Outlier",
      severity: Math.abs(zScore) > 5 ? "critical" : "high",
      description: `Transaction amount $${amount.toFixed(2)} is ${zScore > 0 ? "significantly higher" : "significantly lower"} than historical average ($${mean.toFixed(2)})`,
      confidence: Math.min(95, 70 + Math.abs(zScore) * 5),
      recommendation: "Review this transaction for accuracy",
    });
  } else if (Math.abs(zScore) > 2) {
    anomalies.push({
      type: "Unusual Amount",
      severity: "medium",
      description: `Transaction amount is ${zScore > 0 ? "higher" : "lower"} than typical`,
      confidence: 75,
    });
  }

  // 2. Category spending spike
  if (category) {
    const categoryData = historicalData.filter(d => d.category === category);
    if (categoryData.length >= 3) {
      const categoryMean = categoryData.reduce((a, b) => a + b.amount, 0) / categoryData.length;
      if (amount > categoryMean * 3) {
        anomalies.push({
          type: "Category Spending Spike",
          severity: "medium",
          description: `This ${category} expense is 3x higher than your average`,
          confidence: 80,
          recommendation: `Your typical ${category} expense is around $${categoryMean.toFixed(2)}`,
        });
      }
    }
  }

  // 3. Frequency anomaly (multiple transactions same day)
  const transactionDate = data.transaction_date as string;
  if (transactionDate) {
    const sameDayTransactions = historicalData.filter(d => d.transaction_date === transactionDate);
    if (sameDayTransactions.length >= 5) {
      anomalies.push({
        type: "High Transaction Frequency",
        severity: "low",
        description: `Multiple transactions on the same day (${sameDayTransactions.length + 1} total)`,
        confidence: 70,
      });
    }
  }

  // 4. Round number detection (potential estimate)
  if (amount > 100 && amount % 100 === 0) {
    anomalies.push({
      type: "Round Number Transaction",
      severity: "low",
      description: "Perfectly round amount may indicate an estimate rather than actual expense",
      confidence: 60,
    });
  }

  // 5. Expense/Income ratio anomaly
  const expenses = historicalData.filter(d => d.operation_type === "expense");
  const income = historicalData.filter(d => d.operation_type === "income");
  
  if (expenses.length >= 10 && income.length >= 3) {
    const avgExpense = expenses.reduce((a, b) => a + b.amount, 0) / expenses.length;
    const avgIncome = income.reduce((a, b) => a + b.amount, 0) / income.length;
    
    if (operationType === "expense" && amount > avgIncome * 0.5) {
      anomalies.push({
        type: "Large Expense Relative to Income",
        severity: "high",
        description: "This single expense represents more than 50% of your average income",
        confidence: 85,
        recommendation: "Ensure you have sufficient cash flow for this expense",
      });
    }
  }

  return anomalies;
}
