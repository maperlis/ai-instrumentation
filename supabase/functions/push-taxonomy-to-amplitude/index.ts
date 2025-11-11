import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type AmplitudeRegion = "US" | "EU";

interface AmplitudeCredentials {
  apiKey: string;
  region: AmplitudeRegion;
}

interface TaxonomyEvent {
  event_name: string;
  description: string;
  category?: string;
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
  // Generate reasonable sample values based on property name hints
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

  // Send in chunks of 500 (Amplitude's batch limit)
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
    const { credentials, taxonomy, dryRun = false } = await req.json();

    if (!credentials?.apiKey) {
      throw new Error('Missing required Amplitude API key');
    }

    if (!credentials?.region || !['US', 'EU'].includes(credentials.region)) {
      throw new Error('Missing or invalid region (must be US or EU)');
    }

    if (!taxonomy || !Array.isArray(taxonomy)) {
      throw new Error('Invalid taxonomy data');
    }

    console.log(`Starting Amplitude ingestion-based taxonomy sync for ${taxonomy.length} events (dry run: ${dryRun}, region: ${credentials.region})`);

    const result = await publishTaxonomyViaIngestion(taxonomy, credentials, dryRun);

    console.log('Taxonomy sync completed:', result);

    return new Response(
      JSON.stringify({ 
        success: true, 
        result,
        dryRun,
        message: dryRun 
          ? `Would send ${taxonomy.length} sample events` 
          : `Sent ${result.events_created} sample events to register taxonomy`
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
