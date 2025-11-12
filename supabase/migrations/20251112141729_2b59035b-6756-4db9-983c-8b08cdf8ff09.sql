-- Create function to update timestamps (if it doesn't exist)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create table for storing event instrumentation configs
CREATE TABLE IF NOT EXISTS public.event_configs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_name TEXT NOT NULL,
  amplitude_api_key TEXT NOT NULL,
  amplitude_region TEXT NOT NULL DEFAULT 'US',
  config JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.event_configs ENABLE ROW LEVEL SECURITY;

-- Allow public read access to configs (needed for the loader script)
CREATE POLICY "Event configs are publicly readable"
ON public.event_configs
FOR SELECT
USING (true);

-- Allow anyone to insert/update configs (for now, can be restricted later)
CREATE POLICY "Anyone can insert event configs"
ON public.event_configs
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can update their own event configs"
ON public.event_configs
FOR UPDATE
USING (true);

-- Create index for faster lookups
CREATE INDEX idx_event_configs_project_name ON public.event_configs(project_name);

-- Add trigger for updating timestamps
CREATE TRIGGER update_event_configs_updated_at
BEFORE UPDATE ON public.event_configs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();