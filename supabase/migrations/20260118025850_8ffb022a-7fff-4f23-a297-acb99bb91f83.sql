-- Fix the permissive RLS policy for agent_logs INSERT
DROP POLICY IF EXISTS "Service role can insert agent logs" ON public.agent_logs;

CREATE POLICY "Users can create their own agent logs"
ON public.agent_logs FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Fix the function search_path
CREATE OR REPLACE FUNCTION public.update_master_operations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public;