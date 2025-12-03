import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation schemas
const taxonomyEventSchema = z.object({
  event_name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  category: z.string().max(100).optional(),
  trigger_action: z.string().max(100).optional(),
  screen: z.string().max(200).optional(),
  event_properties: z.array(z.string().max(200)).max(100).optional(),
}).passthrough();

const credentialsSchema = z.object({
  apiKey: z.string().min(1).max(100),
  region: z.enum(['US', 'EU']),
});

const requestSchema = z.object({
  credentials: credentialsSchema,
  taxonomy: z.array(taxonomyEventSchema).min(1).max(500),
  dryRun: z.boolean().optional().default(false),
  projectName: z.string().min(1).max(200).optional(),
});

type AmplitudeRegion = "US" | "EU";

interface AmplitudeCredentials {
  apiKey: string;
  region: AmplitudeRegion;
}

interface TaxonomyEvent {
  event_name: string;
  description?: string;
  category?: string;
  trigger_action?: string;
  screen?: string;
  event_properties?: string[];
  [key: string]: any;
}

interface SyncResult {
  events_created: number;
  events_failed: number;
  errors: string[];
}

function ingestionBase(region: AmplitudeRegion): string {
  return region === "EU" 
    ? "https://api.eu.amplitude.com" 
    : "https://api2.amplitude.com";
}

function sampleValue(propertyName?: string): any {
  const name = (propertyName || "").toLowerCase();
  
  if (name.includes("id") || name.includes("key")) return "sample_id_123";
  if (name.includes("name") || name.includes("title")) return "sample_name";
  if (name.includes("url") || name.includes("link")) return "https://example.com";
  if (name.includes("email")) return "sample@example.com";
  if (name.includes("count") || name.includes("number")) return 1;
  if (name.includes("enabled") || name.includes("is_")) return true;
  if (name.includes("tags") || name.includes("list")) return ["sample"];
  
  return "sample_value";
}

function generateSelector(event: TaxonomyEvent): string {
  const eventName = event.event_name || "";
  const screen = event.screen || "";
  
  const parts = eventName.split("_");
  const object = parts[parts.length - 1];
  
  if (eventName.includes("button") || eventName.includes("click")) {
    return `button[data-event="${eventName}"], .${object}-button`;
  }
  if (eventName.includes("form") || eventName.includes("submit")) {
    return `form[data-event="${eventName}"], .${object}-form`;
  }
  if (eventName.includes("link")) {
    return `a[data-event="${eventName}"], .${object}-link`;
  }
  if (eventName.includes("input") || eventName.includes("field")) {
    return `input[data-event="${eventName}"], .${object}-input`;
  }
  
  const screenClass = screen.toLowerCase().replace(/\s+/g, "-");
  return `[data-event="${eventName}"], .${screenClass} .${object}`;
}

function mapTriggerAction(triggerAction?: string): string {
  const action = (triggerAction || "").toLowerCase();
  
  if (action.includes("click")) return "click";
  if (action.includes("submit")) return "submit";
  if (action.includes("change")) return "change";
  if (action.includes("focus")) return "focus";
  if (action.includes("blur")) return "blur";
  if (action.includes("load")) return "load";
  if (action.includes("scroll")) return "scroll";
  if (action.includes("hover") || action.includes("mouseover")) return "mouseenter";
  
  return "click";
}

async function sendEvents(
  apiKey: string,
  region: AmplitudeRegion,
  events: Array<Record<string, any>>
): Promise<void> {
  const url = `${ingestionBase(region)}/2/httpapi`;
  const payload = { api_key: apiKey, events };

  console.log(`Sending ${events.length} events to ${url}`);

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Amplitude HTTP API error ${res.status}: ${text}`);
  }

  const result = await res.json();
  console.log(`Successfully sent events:`, result);
}

async function publishTaxonomyViaIngestion(
  taxonomy: TaxonomyEvent[],
  credentials: AmplitudeCredentials,
  dryRun: boolean = false
): Promise<SyncResult> {
  const result: SyncResult = {
    events_created: 0,
    events_failed: 0,
    errors: [],
  };

  if (dryRun) {
    console.log('[DRY RUN] Would send the following sample events:');
    taxonomy.forEach((event: TaxonomyEvent) => {
      console.log(`- ${event.event_name} with properties: ${event.event_properties?.join(', ') || 'none'}`);
    });
    result.events_created = taxonomy.length;
    return result;
  }

  const seedUserId = "taxonomy-seeder";
  const events = taxonomy.map((evt) => {
    const props: Record<string, any> = {};
    
    if (evt.event_properties && Array.isArray(evt.event_properties)) {
      evt.event_properties.forEach((propName) => {
        props[propName] = sampleValue(propName);
      });
    }

    return {
      event_type: evt.event_name,
      user_id: seedUserId,
      event_properties: props,
      device_id: "taxonomy-seeder-device",
      platform: "Web",
      time: Date.now(),
    };
  });

  const chunkSize = 500;
  for (let i = 0; i < events.length; i += chunkSize) {
    const chunk = events.slice(i, i + chunkSize);
    try {
      await sendEvents(credentials.apiKey, credentials.region, chunk);
      result.events_created += chunk.length;
      console.log(`Successfully sent chunk ${Math.floor(i / chunkSize) + 1}: ${chunk.length} events`);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error(`Failed to send chunk ${Math.floor(i / chunkSize) + 1}:`, errorMsg);
      result.events_failed += chunk.length;
      chunk.forEach((evt) => {
        result.errors.push(`${evt.event_type}: ${errorMsg}`);
      });
    }
  }

  return result;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse and validate request body
    const rawBody = await req.json();
    const validationResult = requestSchema.safeParse(rawBody);
    
    if (!validationResult.success) {
      console.error("Validation error:", validationResult.error.flatten());
      return new Response(
        JSON.stringify({ 
          success: false,
          error: "Invalid request data",
          details: validationResult.error.flatten().fieldErrors
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const { credentials, taxonomy, dryRun, projectName } = validationResult.data;

    // Extract user_id from JWT token
    const authHeader = req.headers.get('authorization');
    let userId: string | null = null;
    
    if (authHeader?.startsWith('Bearer ')) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey, {
        global: { headers: { Authorization: authHeader } }
      });
      
      const { data: { user } } = await supabase.auth.getUser();
      userId = user?.id || null;
    }

    console.log(`Starting Amplitude ingestion-based taxonomy sync for ${taxonomy.length} events (dry run: ${dryRun}, region: ${credentials.region})`);

    const result = await publishTaxonomyViaIngestion(taxonomy, credentials, dryRun);

    console.log('Taxonomy sync completed:', result);

    // Store the config in database if not a dry run and projectName is provided
    if (!dryRun && projectName && userId) {
      try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        const config = taxonomy.map((event: TaxonomyEvent) => ({
          event_name: event.event_name,
          selector: generateSelector(event),
          trigger: mapTriggerAction(event.trigger_action),
          properties: event.event_properties || []
        }));

        const { error: dbError } = await supabase
          .from('event_configs')
          .insert({
            project_name: projectName,
            amplitude_api_key: credentials.apiKey,
            amplitude_region: credentials.region,
            config: config,
            user_id: userId
          });

        if (dbError) {
          console.error('Error storing config:', dbError);
        } else {
          console.log(`Config stored for project: ${projectName}`);
        }
      } catch (dbError) {
        console.error('Failed to store config:', dbError);
      }
    } else if (!dryRun && projectName && !userId) {
      console.warn('No user_id available - config not stored (user must be authenticated)');
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        result,
        dryRun,
        message: dryRun 
          ? `Would send ${taxonomy.length} sample events` 
          : `Sent ${result.events_created} sample events to register taxonomy`,
        projectName: projectName || null
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in push-taxonomy-to-amplitude:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : String(error)
      }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
