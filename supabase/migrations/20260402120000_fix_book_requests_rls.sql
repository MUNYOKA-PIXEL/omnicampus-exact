-- Fix RLS for book_requests to ensure students can submit requests
-- First, drop existing policies that might be conflicting
DROP POLICY IF EXISTS "Users can create own requests" ON public.book_requests;
DROP POLICY IF EXISTS "Users create own requests" ON public.book_requests;

-- Create a robust policy for insertion
-- This allows any authenticated user to insert a request where the user_id matches their own ID
CREATE POLICY "authenticated_user_create_request" 
ON public.book_requests 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

-- Also ensure they can see their own requests
DROP POLICY IF EXISTS "Users can view own requests" ON public.book_requests;
DROP POLICY IF EXISTS "Users view own requests" ON public.book_requests;

CREATE POLICY "authenticated_user_view_own_requests" 
ON public.book_requests 
FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);
