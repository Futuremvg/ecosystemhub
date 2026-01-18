-- =============================================
-- FASE 1: NÚCLEO AUTÔNOMO - DATABASE SCHEMA
-- =============================================

-- 1. EVENTS TABLE (Motor de Eventos)
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  event_type TEXT NOT NULL,
  status TEXT DEFAULT 'NEW' CHECK (status IN ('NEW', 'PROCESSING', 'PROCESSED', 'FAILED')),
  payload JSONB DEFAULT '{}',
  source TEXT,
  external_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  processed_at TIMESTAMPTZ,
  error_message TEXT
);

-- 2. MASTER OPERATIONS TABLE (Deduplicação Total)
CREATE TABLE public.master_operations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  operation_type TEXT NOT NULL CHECK (operation_type IN ('income', 'expense', 'transfer')),
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'USD',
  description TEXT,
  counterparty TEXT,
  category TEXT,
  transaction_date DATE,
  confidence_score INTEGER DEFAULT 0 CHECK (confidence_score >= 0 AND confidence_score <= 100),
  auto_classified BOOLEAN DEFAULT false,
  classification_reason JSONB DEFAULT '[]',
  status TEXT DEFAULT 'pending_review' CHECK (status IN ('pending_review', 'confirmed', 'corrected')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. OPERATION SOURCES TABLE (Fontes Secundárias)
CREATE TABLE public.operation_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  master_operation_id UUID REFERENCES public.master_operations(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL,
  external_id TEXT,
  raw_data JSONB,
  match_type TEXT CHECK (match_type IN ('strong', 'probabilistic')),
  match_confidence INTEGER CHECK (match_confidence >= 0 AND match_confidence <= 100),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. AGENT LOGS TABLE (Auditoria de Agentes)
CREATE TABLE public.agent_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  agent_type TEXT NOT NULL,
  action_type TEXT NOT NULL,
  input_data JSONB,
  output_data JSONB,
  confidence_score INTEGER,
  execution_time_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. BUSINESS RULES TABLE (Regras do Cliente)
CREATE TABLE public.business_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  rule_type TEXT NOT NULL CHECK (rule_type IN ('classification', 'approval', 'alert', 'automation')),
  name TEXT NOT NULL,
  conditions JSONB NOT NULL DEFAULT '{}',
  priority INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  learned_from UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. BRIEFINGS TABLE (Briefings Autopilot)
CREATE TABLE public.briefings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  briefing_type TEXT NOT NULL CHECK (briefing_type IN ('morning', 'evening', 'weekly')),
  content JSONB NOT NULL DEFAULT '{}',
  generated_at TIMESTAMPTZ DEFAULT now(),
  read_at TIMESTAMPTZ,
  converted_to_tasks BOOLEAN DEFAULT false
);

-- 7. TASKS TABLE (Tarefas Geradas)
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  due_date DATE,
  source_type TEXT,
  source_id UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- 8. ALERTS TABLE (Alertas Críticos)
CREATE TABLE public.alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  alert_type TEXT NOT NULL,
  severity TEXT DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  title TEXT NOT NULL,
  description TEXT,
  data JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT false,
  is_dismissed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 9. EXPAND TENANTS TABLE (Memória da Empresa)
ALTER TABLE public.tenants 
ADD COLUMN IF NOT EXISTS business_profile JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS average_ticket NUMERIC,
ADD COLUMN IF NOT EXISTS target_margin NUMERIC,
ADD COLUMN IF NOT EXISTS monthly_capacity NUMERIC,
ADD COLUMN IF NOT EXISTS cost_centers JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS autonomy_level TEXT DEFAULT 'supervised',
ADD COLUMN IF NOT EXISTS automation_paused BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;

-- 10. EXPAND PROFILES TABLE (Preferências do Usuário)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS approval_threshold NUMERIC DEFAULT 1000,
ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS role_in_company TEXT DEFAULT 'owner';

-- =============================================
-- ENABLE RLS ON ALL TABLES
-- =============================================

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.master_operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operation_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.briefings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS POLICIES - EVENTS
-- =============================================

CREATE POLICY "Users can view their own events"
ON public.events FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own events"
ON public.events FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own events"
ON public.events FOR UPDATE
USING (auth.uid() = user_id);

-- =============================================
-- RLS POLICIES - MASTER OPERATIONS
-- =============================================

CREATE POLICY "Users can view their own master operations"
ON public.master_operations FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own master operations"
ON public.master_operations FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own master operations"
ON public.master_operations FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own master operations"
ON public.master_operations FOR DELETE
USING (auth.uid() = user_id);

-- =============================================
-- RLS POLICIES - OPERATION SOURCES
-- =============================================

CREATE POLICY "Users can view operation sources for their operations"
ON public.operation_sources FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.master_operations mo
    WHERE mo.id = operation_sources.master_operation_id
    AND mo.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create operation sources for their operations"
ON public.operation_sources FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.master_operations mo
    WHERE mo.id = operation_sources.master_operation_id
    AND mo.user_id = auth.uid()
  )
);

-- =============================================
-- RLS POLICIES - AGENT LOGS
-- =============================================

CREATE POLICY "Users can view their own agent logs"
ON public.agent_logs FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert agent logs"
ON public.agent_logs FOR INSERT
WITH CHECK (true);

-- =============================================
-- RLS POLICIES - BUSINESS RULES
-- =============================================

CREATE POLICY "Users can view their own business rules"
ON public.business_rules FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own business rules"
ON public.business_rules FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own business rules"
ON public.business_rules FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own business rules"
ON public.business_rules FOR DELETE
USING (auth.uid() = user_id);

-- =============================================
-- RLS POLICIES - BRIEFINGS
-- =============================================

CREATE POLICY "Users can view their own briefings"
ON public.briefings FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own briefings"
ON public.briefings FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own briefings"
ON public.briefings FOR UPDATE
USING (auth.uid() = user_id);

-- =============================================
-- RLS POLICIES - TASKS
-- =============================================

CREATE POLICY "Users can view their own tasks"
ON public.tasks FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own tasks"
ON public.tasks FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tasks"
ON public.tasks FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tasks"
ON public.tasks FOR DELETE
USING (auth.uid() = user_id);

-- =============================================
-- RLS POLICIES - ALERTS
-- =============================================

CREATE POLICY "Users can view their own alerts"
ON public.alerts FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own alerts"
ON public.alerts FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own alerts"
ON public.alerts FOR UPDATE
USING (auth.uid() = user_id);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

CREATE INDEX IF NOT EXISTS idx_events_user_id ON public.events(user_id);
CREATE INDEX IF NOT EXISTS idx_events_status ON public.events(status);
CREATE INDEX IF NOT EXISTS idx_events_event_type ON public.events(event_type);
CREATE INDEX IF NOT EXISTS idx_events_created_at ON public.events(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_master_operations_user_id ON public.master_operations(user_id);
CREATE INDEX IF NOT EXISTS idx_master_operations_status ON public.master_operations(status);
CREATE INDEX IF NOT EXISTS idx_master_operations_company_id ON public.master_operations(company_id);
CREATE INDEX IF NOT EXISTS idx_master_operations_transaction_date ON public.master_operations(transaction_date DESC);

CREATE INDEX IF NOT EXISTS idx_operation_sources_master_id ON public.operation_sources(master_operation_id);

CREATE INDEX IF NOT EXISTS idx_agent_logs_user_id ON public.agent_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_logs_agent_type ON public.agent_logs(agent_type);
CREATE INDEX IF NOT EXISTS idx_agent_logs_created_at ON public.agent_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_business_rules_user_id ON public.business_rules(user_id);
CREATE INDEX IF NOT EXISTS idx_business_rules_rule_type ON public.business_rules(rule_type);

CREATE INDEX IF NOT EXISTS idx_briefings_user_id ON public.briefings(user_id);
CREATE INDEX IF NOT EXISTS idx_briefings_type ON public.briefings(briefing_type);
CREATE INDEX IF NOT EXISTS idx_briefings_generated_at ON public.briefings(generated_at DESC);

CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON public.tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON public.tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON public.tasks(due_date);

CREATE INDEX IF NOT EXISTS idx_alerts_user_id ON public.alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_alerts_severity ON public.alerts(severity);
CREATE INDEX IF NOT EXISTS idx_alerts_is_read ON public.alerts(is_read);

-- =============================================
-- UPDATED_AT TRIGGER FOR MASTER OPERATIONS
-- =============================================

CREATE OR REPLACE FUNCTION public.update_master_operations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_master_operations_updated_at
BEFORE UPDATE ON public.master_operations
FOR EACH ROW
EXECUTE FUNCTION public.update_master_operations_updated_at();

-- =============================================
-- ENABLE REALTIME FOR KEY TABLES
-- =============================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.alerts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.briefings;