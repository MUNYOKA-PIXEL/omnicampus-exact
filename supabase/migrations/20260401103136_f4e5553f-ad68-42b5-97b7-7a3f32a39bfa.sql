
-- Drop ALL existing policies on all tables first
DROP POLICY IF EXISTS "Admins can manage all appointments" ON public.appointments;
DROP POLICY IF EXISTS "Users can create own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Users can update own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Users can view own appointments" ON public.appointments;

DROP POLICY IF EXISTS "Admins can manage all loans" ON public.book_loans;
DROP POLICY IF EXISTS "Admins can view all loans" ON public.book_loans;
DROP POLICY IF EXISTS "Users can create own loans" ON public.book_loans;
DROP POLICY IF EXISTS "Users can view own loans" ON public.book_loans;

DROP POLICY IF EXISTS "Admins can manage all requests" ON public.book_requests;
DROP POLICY IF EXISTS "Admins can view all requests" ON public.book_requests;
DROP POLICY IF EXISTS "Users can create own requests" ON public.book_requests;
DROP POLICY IF EXISTS "Users can view own requests" ON public.book_requests;

DROP POLICY IF EXISTS "Admins can manage books" ON public.books;
DROP POLICY IF EXISTS "Anyone authenticated can view books" ON public.books;

DROP POLICY IF EXISTS "Admins can manage events" ON public.club_events;
DROP POLICY IF EXISTS "Anyone authenticated can view events" ON public.club_events;

DROP POLICY IF EXISTS "Anyone authenticated can view memberships" ON public.club_memberships;
DROP POLICY IF EXISTS "Users can join clubs" ON public.club_memberships;
DROP POLICY IF EXISTS "Users can leave clubs" ON public.club_memberships;

DROP POLICY IF EXISTS "Admins can manage clubs" ON public.clubs;
DROP POLICY IF EXISTS "Anyone authenticated can view clubs" ON public.clubs;

DROP POLICY IF EXISTS "Admins can manage doctors" ON public.doctors;
DROP POLICY IF EXISTS "Anyone authenticated can view doctors" ON public.doctors;

DROP POLICY IF EXISTS "Anyone authenticated can view rsvps" ON public.event_rsvps;
DROP POLICY IF EXISTS "Users can cancel rsvp" ON public.event_rsvps;
DROP POLICY IF EXISTS "Users can rsvp" ON public.event_rsvps;

DROP POLICY IF EXISTS "Admins can manage all items" ON public.lost_found_items;
DROP POLICY IF EXISTS "Anyone authenticated can view items" ON public.lost_found_items;
DROP POLICY IF EXISTS "Users can create own reports" ON public.lost_found_items;
DROP POLICY IF EXISTS "Users can update own reports" ON public.lost_found_items;

DROP POLICY IF EXISTS "Admins can manage medications" ON public.medications;
DROP POLICY IF EXISTS "Anyone authenticated can view medications" ON public.medications;

DROP POLICY IF EXISTS "Anyone authenticated can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Superadmin can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Superadmin can view all roles" ON public.user_roles;

-- Drop old function
DROP FUNCTION IF EXISTS public.has_role(_user_id uuid, _role app_role);
DROP FUNCTION IF EXISTS public.is_any_admin(_user_id uuid);

-- Rename old enum, create new
ALTER TYPE public.app_role RENAME TO app_role_old;
CREATE TYPE public.app_role AS ENUM ('superadmin', 'libadmin', 'medadmin', 'clubadmin', 'student');

ALTER TABLE public.user_roles 
  ALTER COLUMN role TYPE public.app_role 
  USING (
    CASE role::text
      WHEN 'admin' THEN 'superadmin'::public.app_role
      WHEN 'student' THEN 'student'::public.app_role
    END
  );

DROP TYPE public.app_role_old;

-- Recreate functions
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.is_any_admin(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('superadmin','libadmin','medadmin','clubadmin'))
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), NEW.email);
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'student');
  RETURN NEW;
END;
$$;

-- profiles
CREATE POLICY "Anyone can view profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- user_roles
CREATE POLICY "Superadmin manage roles" ON public.user_roles FOR ALL TO authenticated USING (has_role(auth.uid(), 'superadmin'));
CREATE POLICY "Users view own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- appointments
CREATE POLICY "Superadmin full appointments" ON public.appointments FOR ALL TO authenticated USING (has_role(auth.uid(), 'superadmin'));
CREATE POLICY "Medadmin manage appointments" ON public.appointments FOR ALL TO authenticated USING (has_role(auth.uid(), 'medadmin'));
CREATE POLICY "Users view own appointments" ON public.appointments FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users create own appointments" ON public.appointments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own appointments" ON public.appointments FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- book_loans
CREATE POLICY "Superadmin full loans" ON public.book_loans FOR ALL TO authenticated USING (has_role(auth.uid(), 'superadmin'));
CREATE POLICY "Libadmin manage loans" ON public.book_loans FOR ALL TO authenticated USING (has_role(auth.uid(), 'libadmin'));
CREATE POLICY "Users view own loans" ON public.book_loans FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users create own loans" ON public.book_loans FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- book_requests
CREATE POLICY "Superadmin full requests" ON public.book_requests FOR ALL TO authenticated USING (has_role(auth.uid(), 'superadmin'));
CREATE POLICY "Libadmin manage requests" ON public.book_requests FOR ALL TO authenticated USING (has_role(auth.uid(), 'libadmin'));
CREATE POLICY "Users view own requests" ON public.book_requests FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users create own requests" ON public.book_requests FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- books
CREATE POLICY "Superadmin manage books" ON public.books FOR ALL TO authenticated USING (has_role(auth.uid(), 'superadmin'));
CREATE POLICY "Libadmin manage books" ON public.books FOR ALL TO authenticated USING (has_role(auth.uid(), 'libadmin'));
CREATE POLICY "Anyone view books" ON public.books FOR SELECT TO authenticated USING (true);

-- club_events
CREATE POLICY "Superadmin manage events" ON public.club_events FOR ALL TO authenticated USING (has_role(auth.uid(), 'superadmin'));
CREATE POLICY "Clubadmin manage events" ON public.club_events FOR ALL TO authenticated USING (has_role(auth.uid(), 'clubadmin'));
CREATE POLICY "Anyone view events" ON public.club_events FOR SELECT TO authenticated USING (true);

-- club_memberships
CREATE POLICY "Anyone view memberships" ON public.club_memberships FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users join clubs" ON public.club_memberships FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users leave clubs" ON public.club_memberships FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- clubs
CREATE POLICY "Superadmin manage clubs" ON public.clubs FOR ALL TO authenticated USING (has_role(auth.uid(), 'superadmin'));
CREATE POLICY "Clubadmin manage clubs" ON public.clubs FOR ALL TO authenticated USING (has_role(auth.uid(), 'clubadmin'));
CREATE POLICY "Anyone view clubs" ON public.clubs FOR SELECT TO authenticated USING (true);

-- doctors
CREATE POLICY "Superadmin manage doctors" ON public.doctors FOR ALL TO authenticated USING (has_role(auth.uid(), 'superadmin'));
CREATE POLICY "Medadmin manage doctors" ON public.doctors FOR ALL TO authenticated USING (has_role(auth.uid(), 'medadmin'));
CREATE POLICY "Anyone view doctors" ON public.doctors FOR SELECT TO authenticated USING (true);

-- event_rsvps
CREATE POLICY "Anyone view rsvps" ON public.event_rsvps FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users rsvp" ON public.event_rsvps FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users cancel rsvp" ON public.event_rsvps FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- lost_found_items
CREATE POLICY "Superadmin manage lost found" ON public.lost_found_items FOR ALL TO authenticated USING (has_role(auth.uid(), 'superadmin'));
CREATE POLICY "Anyone view items" ON public.lost_found_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users create reports" ON public.lost_found_items FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own reports" ON public.lost_found_items FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- medications
CREATE POLICY "Superadmin manage medications" ON public.medications FOR ALL TO authenticated USING (has_role(auth.uid(), 'superadmin'));
CREATE POLICY "Medadmin manage medications" ON public.medications FOR ALL TO authenticated USING (has_role(auth.uid(), 'medadmin'));
CREATE POLICY "Anyone view medications" ON public.medications FOR SELECT TO authenticated USING (true);

-- Resources table
CREATE TABLE IF NOT EXISTS public.resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  file_url text,
  category text NOT NULL DEFAULT 'general',
  uploaded_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone view resources" ON public.resources FOR SELECT TO authenticated USING (true);
CREATE POLICY "Superadmin manage resources" ON public.resources FOR ALL TO authenticated USING (has_role(auth.uid(), 'superadmin'));
CREATE POLICY "Libadmin manage library resources" ON public.resources FOR ALL TO authenticated USING (has_role(auth.uid(), 'libadmin') AND category = 'library');
CREATE POLICY "Medadmin manage medical resources" ON public.resources FOR ALL TO authenticated USING (has_role(auth.uid(), 'medadmin') AND category = 'medical');
CREATE POLICY "Clubadmin manage club resources" ON public.resources FOR ALL TO authenticated USING (has_role(auth.uid(), 'clubadmin') AND category = 'club');

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_student_id ON public.profiles(student_id);
CREATE INDEX IF NOT EXISTS idx_books_category ON public.books(category);
CREATE INDEX IF NOT EXISTS idx_book_loans_user_id ON public.book_loans(user_id);
CREATE INDEX IF NOT EXISTS idx_appointments_user_id ON public.appointments(user_id);
CREATE INDEX IF NOT EXISTS idx_lost_found_items_type ON public.lost_found_items(type);
CREATE INDEX IF NOT EXISTS idx_club_memberships_user_id ON public.club_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_resources_category ON public.resources(category);
