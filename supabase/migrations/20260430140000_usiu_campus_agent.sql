
-- ============ COURSES ============
CREATE TABLE public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  department TEXT NOT NULL,
  credits INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view courses" ON public.courses FOR SELECT TO authenticated USING (true);

-- ============ AI AUDIT LOGS ============
CREATE TABLE public.ai_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  details JSONB,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_audit_logs ENABLE ROW LEVEL SECURITY;

-- AI can insert audit logs (authenticated users)
CREATE POLICY "AI can insert audit logs" ON public.ai_audit_logs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Admins can view all audit logs
CREATE POLICY "Admins can view all audit logs" ON public.ai_audit_logs FOR SELECT TO authenticated USING (public.is_any_admin(auth.uid()));

-- Add index for performance
CREATE INDEX idx_ai_audit_logs_user ON public.ai_audit_logs(user_id);
CREATE INDEX idx_courses_department ON public.courses(department);
