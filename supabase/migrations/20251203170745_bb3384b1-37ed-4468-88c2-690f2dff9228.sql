-- Add user_id column to associate configs with authenticated users
ALTER TABLE public.event_configs ADD COLUMN user_id UUID REFERENCES auth.users(id);

-- Drop existing overly permissive RLS policies
DROP POLICY IF EXISTS "Event configs are publicly readable" ON public.event_configs;
DROP POLICY IF EXISTS "Anyone can insert event configs" ON public.event_configs;
DROP POLICY IF EXISTS "Anyone can update their own event configs" ON public.event_configs;

-- Create proper owner-based RLS policies
CREATE POLICY "Users can read own configs" 
ON public.event_configs 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own configs" 
ON public.event_configs 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own configs" 
ON public.event_configs 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own configs" 
ON public.event_configs 
FOR DELETE 
USING (auth.uid() = user_id);