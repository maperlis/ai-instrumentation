-- Make user_id column NOT NULL to strengthen RLS protection
ALTER TABLE public.event_configs ALTER COLUMN user_id SET NOT NULL;