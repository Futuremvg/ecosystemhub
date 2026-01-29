-- =============================================
-- PHASE 2: EXECUTION LAYER TABLES
-- Adding: permissions, action_logs, integrations
-- NO MODIFICATIONS TO EXISTING TABLES
-- =============================================

-- 1) PERMISSIONS TABLE
-- Purpose: Define what actions the system is allowed to execute per user/company
CREATE TABLE public.permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  user_id UUID DEFAULT NULL, -- Nullable for company-wide permissions
  action_type TEXT NOT NULL,
  action_level TEXT NOT NULL DEFAULT 'review' CHECK (action_level IN ('auto', 'review', 'blocked')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on permissions
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;

-- RLS: Users can view permissions for companies they own
CREATE POLICY "Users can view permissions for their companies"
ON public.permissions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.companies c
    WHERE c.id = permissions.company_id
    AND c.user_id = auth.uid()
  )
);

-- RLS: Users can create permissions for their companies
CREATE POLICY "Users can create permissions for their companies"
ON public.permissions
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.companies c
    WHERE c.id = permissions.company_id
    AND c.user_id = auth.uid()
  )
);

-- RLS: Users can update permissions for their companies
CREATE POLICY "Users can update permissions for their companies"
ON public.permissions
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.companies c
    WHERE c.id = permissions.company_id
    AND c.user_id = auth.uid()
  )
);

-- RLS: Users can delete permissions for their companies
CREATE POLICY "Users can delete permissions for their companies"
ON public.permissions
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.companies c
    WHERE c.id = permissions.company_id
    AND c.user_id = auth.uid()
  )
);

-- Trigger for updated_at on permissions
CREATE TRIGGER update_permissions_updated_at
BEFORE UPDATE ON public.permissions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- 2) ACTION_LOGS TABLE
-- Purpose: Track every executed action by the system
-- =============================================

CREATE TABLE public.action_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  agent_name TEXT NOT NULL,
  action_type TEXT NOT NULL,
  payload JSONB DEFAULT '{}'::jsonb,
  source_event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
  result_status TEXT NOT NULL DEFAULT 'pending' CHECK (result_status IN ('pending', 'success', 'failed')),
  error_message TEXT DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on action_logs
ALTER TABLE public.action_logs ENABLE ROW LEVEL SECURITY;

-- RLS: Users can view action logs for their companies
CREATE POLICY "Users can view action logs for their companies"
ON public.action_logs
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.companies c
    WHERE c.id = action_logs.company_id
    AND c.user_id = auth.uid()
  )
);

-- RLS: Service role / edge functions can insert (authenticated users who own the company)
CREATE POLICY "Users can insert action logs for their companies"
ON public.action_logs
FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM public.companies c
    WHERE c.id = action_logs.company_id
    AND c.user_id = auth.uid()
  )
);

-- =============================================
-- 3) INTEGRATIONS TABLE
-- Purpose: Store connected integrations (bank, email, firecrawl, etc.)
-- =============================================

CREATE TABLE public.integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  integration_type TEXT NOT NULL CHECK (integration_type IN ('bank', 'email', 'firecrawl', 'stripe', 'calendar', 'google_apps_script', 'n8n', 'make')),
  status TEXT NOT NULL DEFAULT 'disconnected' CHECK (status IN ('connected', 'disconnected', 'error', 'pending')),
  credentials JSONB DEFAULT '{}'::jsonb,
  config JSONB DEFAULT '{}'::jsonb,
  last_sync_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(company_id, integration_type)
);

-- Enable RLS on integrations
ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;

-- RLS: Users can view integrations for their companies
CREATE POLICY "Users can view integrations for their companies"
ON public.integrations
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.companies c
    WHERE c.id = integrations.company_id
    AND c.user_id = auth.uid()
  )
);

-- RLS: Users can create integrations for their companies
CREATE POLICY "Users can create integrations for their companies"
ON public.integrations
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.companies c
    WHERE c.id = integrations.company_id
    AND c.user_id = auth.uid()
  )
);

-- RLS: Users can update integrations for their companies
CREATE POLICY "Users can update integrations for their companies"
ON public.integrations
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.companies c
    WHERE c.id = integrations.company_id
    AND c.user_id = auth.uid()
  )
);

-- RLS: Users can delete integrations for their companies
CREATE POLICY "Users can delete integrations for their companies"
ON public.integrations
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.companies c
    WHERE c.id = integrations.company_id
    AND c.user_id = auth.uid()
  )
);

-- Trigger for updated_at on integrations
CREATE TRIGGER update_integrations_updated_at
BEFORE UPDATE ON public.integrations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

CREATE INDEX idx_permissions_company_id ON public.permissions(company_id);
CREATE INDEX idx_permissions_action_type ON public.permissions(action_type);
CREATE INDEX idx_action_logs_company_id ON public.action_logs(company_id);
CREATE INDEX idx_action_logs_source_event_id ON public.action_logs(source_event_id);
CREATE INDEX idx_action_logs_created_at ON public.action_logs(created_at DESC);
CREATE INDEX idx_integrations_company_id ON public.integrations(company_id);
CREATE INDEX idx_integrations_type_status ON public.integrations(integration_type, status);