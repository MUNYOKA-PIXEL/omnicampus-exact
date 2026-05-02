
-- ============ NOTIFICATIONS ============
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT CHECK (type IN ('info', 'success', 'warning', 'error')) DEFAULT 'info',
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own notifications
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications" ON public.notifications 
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Users can update (mark as read) their own notifications
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "Users can update own notifications" ON public.notifications 
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- System/Admins can create notifications
DROP POLICY IF EXISTS "Admins can manage all notifications" ON public.notifications;
CREATE POLICY "Admins can manage all notifications" ON public.notifications 
  FOR ALL TO authenticated USING (public.is_any_admin(auth.uid()));

-- ============ COURSE ENROLLMENTS ============
-- This table tracks which students are enrolled in which courses for specific semesters
CREATE TABLE IF NOT EXISTS public.course_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  semester TEXT NOT NULL, -- e.g., 'Spring 2026'
  status TEXT CHECK (status IN ('active', 'completed', 'withdrawn')) DEFAULT 'active',
  grade TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, course_id, semester)
);

ALTER TABLE public.course_enrollments ENABLE ROW LEVEL SECURITY;

-- Students view their own enrollments
DROP POLICY IF EXISTS "Students view own enrollments" ON public.course_enrollments;
CREATE POLICY "Students view own enrollments" ON public.course_enrollments 
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Admins/Registrar can manage all enrollments
DROP POLICY IF EXISTS "Admins manage enrollments" ON public.course_enrollments;
CREATE POLICY "Admins manage enrollments" ON public.course_enrollments 
  FOR ALL TO authenticated USING (public.is_any_admin(auth.uid()));

-- ============ MEDICAL RECORDS ============
-- This table stores sensitive health history, accessible only to the student and medical admins
CREATE TABLE IF NOT EXISTS public.medical_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  doctor_id UUID REFERENCES public.doctors(id) ON DELETE SET NULL,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  diagnosis TEXT NOT NULL,
  treatment_plan TEXT,
  prescriptions TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.medical_records ENABLE ROW LEVEL SECURITY;

-- Students can view their own medical history
DROP POLICY IF EXISTS "Students view own medical records" ON public.medical_records;
CREATE POLICY "Students view own medical records" ON public.medical_records 
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- ONLY medical admins and superadmins can manage medical records
DROP POLICY IF EXISTS "Medical admins manage medical records" ON public.medical_records;
CREATE POLICY "Medical admins manage medical records" ON public.medical_records 
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'medadmin') OR public.has_role(auth.uid(), 'superadmin'));

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_medical_records_updated_at ON public.medical_records;
CREATE TRIGGER update_medical_records_updated_at
  BEFORE UPDATE ON public.medical_records
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_user ON public.course_enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_medical_records_user ON public.medical_records(user_id);
