-- =============================================
-- PHASE 3: Adjust action_logs RLS for service role
-- Allow service role to insert action logs
-- Allow all company members to read (not just owner)
-- =============================================

-- Drop the existing INSERT policy that requires auth.uid() match
DROP POLICY IF EXISTS "Users can insert action logs for their companies" ON public.action_logs;

-- Create a more permissive insert policy for service role calls
-- Service role bypasses RLS, but we need to allow edge functions 
-- that run with user context to also insert
CREATE POLICY "Allow action log inserts for company operations"
ON public.action_logs
FOR INSERT
WITH CHECK (
  -- Service role inserts will bypass this check
  -- For authenticated users, verify they belong to the company
  EXISTS (
    SELECT 1 FROM public.companies c
    WHERE c.id = action_logs.company_id
    AND c.user_id = auth.uid()
  )
  OR 
  -- Or if it's a tenant-based access
  EXISTS (
    SELECT 1 FROM public.companies c
    JOIN public.user_tenants ut ON ut.tenant_id = c.tenant_id
    WHERE c.id = action_logs.company_id
    AND ut.user_id = auth.uid()
  )
);

-- Update the SELECT policy to include all company members (via tenant)
DROP POLICY IF EXISTS "Users can view action logs for their companies" ON public.action_logs;

CREATE POLICY "Company members can view action logs"
ON public.action_logs
FOR SELECT
USING (
  -- Direct company owner
  EXISTS (
    SELECT 1 FROM public.companies c
    WHERE c.id = action_logs.company_id
    AND c.user_id = auth.uid()
  )
  OR
  -- Tenant members
  EXISTS (
    SELECT 1 FROM public.companies c
    JOIN public.user_tenants ut ON ut.tenant_id = c.tenant_id
    WHERE c.id = action_logs.company_id
    AND ut.user_id = auth.uid()
  )
);

-- Add an index to improve query performance for the company lookups
CREATE INDEX IF NOT EXISTS idx_action_logs_user_id ON public.action_logs(user_id);