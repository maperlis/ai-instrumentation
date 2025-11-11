import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AmplitudeCredentials {
  apiKey: string;
  secretKey: string;
}

interface TaxonomyEvent {
  event_name: string;
  description: string;
  category?: string;
  event_properties?: string[];
  [key: string]: any;
}

interface TaxonomyEventType {
  event_type: string;
  description: string;
  category?: string;
  owner?: string;
}

interface SyncResult {
  events_created: number;
  events_failed: number;
  errors: string[];
}


async function pushEventToTaxonomy(
  credentials: AmplitudeCredentials,
  event: TaxonomyEventType,
  region: 'us' | 'eu' = 'us'
) {
  const baseUrl = region === 'eu' 
    ? 'https://analytics.eu.amplitude.com/api/2/taxonomy/event'
    : 'https://amplitude.com/api/2/taxonomy/event';

  // Create Basic Auth header
  const authString = `${credentials.apiKey}:${credentials.secretKey}`;
  const base64Auth = btoa(authString);

  console.log(`Pushing event "${event.event_type}" to Amplitude Taxonomy API (${region})`);

  // Create form-encoded body
  const formBody = new URLSearchParams();
  formBody.append('event_type', event.event_type);
  if (event.description) formBody.append('description', event.description);
  if (event.category) formBody.append('category', event.category);
  if (event.owner) formBody.append('owner', event.owner);

  const response = await fetch(baseUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${base64Auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formBody.toString(),
  });

  const responseText = await response.text();

  if (response.status === 401) {
    throw new Error('Invalid API credentials');
  }

  if (!response.ok) {
    console.error(`Failed to push event "${event.event_type}": ${responseText}`);
    throw new Error(`Taxonomy API error (${response.status}): ${responseText}`);
  }

  return JSON.parse(responseText);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { credentials, taxonomy, dryRun = false, region = 'us' } = await req.json();

    if (!credentials?.apiKey || !credentials?.secretKey) {
      throw new Error('Missing required Amplitude credentials (API key and secret key)');
    }

    if (!taxonomy || !Array.isArray(taxonomy)) {
      throw new Error('Invalid taxonomy data');
    }

    console.log(`Starting Amplitude Taxonomy sync for ${taxonomy.length} events (dry run: ${dryRun})`);

    const result: SyncResult = {
      events_created: 0,
      events_failed: 0,
      errors: [],
    };

    if (dryRun) {
      console.log('[DRY RUN] Would create the following event types:');
      taxonomy.forEach((event: TaxonomyEvent) => {
        console.log(`- ${event.event_name} (${event.category || 'Uncategorized'})`);
      });
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          result: {
            ...result,
            events_created: taxonomy.length,
          },
          dryRun: true,
          message: `Would create ${taxonomy.length} event types`
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Convert taxonomy events to Taxonomy API format
    const taxonomyEvents: TaxonomyEventType[] = taxonomy.map((event: TaxonomyEvent) => ({
      event_type: event.event_name,
      description: event.description || '',
      category: event.category,
      owner: event.owner,
    }));

    // Push events one by one (Taxonomy API doesn't support batch)
    console.log(`Pushing ${taxonomyEvents.length} event types to Amplitude Taxonomy API...`);
    
    for (const event of taxonomyEvents) {
      try {
        await pushEventToTaxonomy(credentials, event, region as 'us' | 'eu');
        result.events_created++;
        console.log(`Successfully created event type: ${event.event_type}`);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error(`Failed to create event type "${event.event_type}":`, errorMsg);
        result.events_failed++;
        result.errors.push(`${event.event_type}: ${errorMsg}`);
      }
    }

    console.log('Taxonomy sync completed:', result);

    return new Response(
      JSON.stringify({ 
        success: true, 
        result,
        dryRun: false 
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
