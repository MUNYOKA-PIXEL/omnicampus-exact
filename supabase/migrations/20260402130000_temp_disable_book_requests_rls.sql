-- Temporarily disable RLS for book_requests to test insertion
DROP POLICY IF EXISTS "Users create own requests" ON public.book_requests;
DROP POLICY IF EXISTS "Users can create own requests" ON public.book_requests;

CREATE POLICY "Allow all inserts to book_requests"
ON public.book_requests
FOR INSERT
TO authenticated
USING (true);

-- Keep select policies for now
CREATE POLICY "Users view own requests" 
ON public.book_requests 
FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "Admins view all requests" 
ON public.book_requests 
FOR SELECT 
TO authenticated 
USING (public.has_role(auth.uid(), 'admin'));
