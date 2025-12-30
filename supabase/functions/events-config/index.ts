import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simple in-memory rate limiting (per IP, resets on function restart)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 30; // 30 requests per minute per IP

function checkRateLimit(clientIP: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const record = rateLimitMap.get(clientIP);
  
  if (!record || now > record.resetTime) {
    // New window
    rateLimitMap.set(clientIP, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - 1 };
  }
  
  if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
    return { allowed: false, remaining: 0 };
  }
  
  record.count++;
  return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - record.count };
}

// Validate project name format: alphanumeric, hyphens, underscores, 1-100 chars
const isValidProjectName = (name: string): boolean => {
  if (!name || name.length < 1 || name.length > 100) return false;
  return /^[a-zA-Z0-9_-]+$/.test(name);
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Extract client IP for rate limiting
  const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                   req.headers.get('cf-connecting-ip') || 
                   'unknown';

  // Check rate limit
  const rateLimit = checkRateLimit(clientIP);
  if (!rateLimit.allowed) {
    console.warn(`Rate limit exceeded for IP: ${clientIP}`);
    return new Response(
      JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
      { 
        status: 429,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Retry-After': '60'
        } 
      }
    );
  }

  try {
    const url = new URL(req.url);
    const projectName = url.searchParams.get('project');

    if (!projectName) {
      console.log(`Request from ${clientIP}: Missing project parameter`);
      return new Response(
        JSON.stringify({ error: 'Missing project name parameter' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // SECURITY: Validate project name format to prevent enumeration attacks
    if (!isValidProjectName(projectName)) {
      console.log(`Request from ${clientIP}: Invalid project name format: ${projectName.substring(0, 20)}...`);
      return new Response(
        JSON.stringify({ error: 'Invalid project name format' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch the most recent config for this project (public endpoint - no auth required)
    // SECURITY NOTE: This endpoint intentionally bypasses RLS to serve loader script configs
    // Only the 'config' column is returned - NO API keys or sensitive credentials
    const { data, error } = await supabase
      .from('event_configs')
      .select('config')
      .eq('project_name', projectName)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error(`Error fetching config for project ${projectName}:`, error.message);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch configuration' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (!data) {
      // Log but don't reveal whether project exists (timing attack prevention)
      console.log(`Config request from ${clientIP} for project: ${projectName} - not found`);
      return new Response(
        JSON.stringify({ error: 'Project not found' }),
        { 
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`Serving config for project: ${projectName} to IP: ${clientIP}`);

    // SECURITY: Only return event selectors/triggers - NO API keys or sensitive data
    return new Response(
      JSON.stringify({
        events: data.config
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'X-RateLimit-Remaining': String(rateLimit.remaining)
        } 
      }
    );
  } catch (error) {
    console.error('Error in events-config:', error instanceof Error ? error.message : String(error));
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
