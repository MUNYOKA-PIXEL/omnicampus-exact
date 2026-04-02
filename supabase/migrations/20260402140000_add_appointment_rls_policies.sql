-- RLS Policies for appointments table
-- Admins should be able to see all appointments
CREATE POLICY "Admins view all appointments" ON public.appointments FOR SELECT TO authenticated USING (public.is_any_admin(auth.uid()));

-- Users should be able to see their own appointments
CREATE POLICY "Users view own appointments" ON public.appointments FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Users should be able to create their own appointments
CREATE POLICY "Users create own appointments" ON public.appointments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
