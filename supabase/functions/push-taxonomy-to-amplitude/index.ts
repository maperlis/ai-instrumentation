import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AmplitudeCredentials {
  apiKey: string;
  secretKey: string;
  region: 'US' | 'EU';
}

interface TaxonomyEvent {
  event_name: string;
  description: string;
  category?: string;
  event_properties?: string[];
  [key: string]: any;
}

interface SyncResult {
  categories_created: number;
  categories_skipped: number;
  events_created: number;
  events_updated: number;
  events_skipped: number;
  properties_created: number;
  properties_skipped: number;
  errors: string[];
}

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function makeAmplitudeRequest(
  endpoint: string,
  method: string,
  credentials: AmplitudeCredentials,
  body?: any
) {
  const baseUrl = credentials.region === 'EU' 
    ? 'https://analytics.eu.amplitude.com/api/2'
    : 'https://amplitude.com/api/2';
  
  const authString = btoa(`${credentials.apiKey}:${credentials.secretKey}`);
  
  const headers: Record<string, string> = {
    'Authorization': `Basic ${authString}`,
  };

  let requestBody: string | undefined;
  
  if (body) {
    if (method === 'GET') {
      const params = new URLSearchParams(body);
      endpoint = `${endpoint}?${params.toString()}`;
    } else {
      headers['Content-Type'] = 'application/x-www-form-urlencoded';
      requestBody = new URLSearchParams(body).toString();
    }
  }

  console.log(`Making ${method} request to: ${baseUrl}${endpoint}`);
  
  const response = await fetch(`${baseUrl}${endpoint}`, {
    method,
    headers,
    body: requestBody,
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Amplitude API error (${response.status}):`, errorText);
    throw new Error(`Amplitude API error (${response.status}): ${errorText}`);
  }

  return await response.json();
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { credentials, taxonomy, dryRun = false } = await req.json();

    if (!credentials?.apiKey || !credentials?.secretKey || !credentials?.region) {
      throw new Error('Missing required Amplitude credentials');
    }

    if (!taxonomy || !Array.isArray(taxonomy)) {
      throw new Error('Invalid taxonomy data');
    }

    console.log(`Starting taxonomy sync for ${taxonomy.length} events (dry run: ${dryRun})`);

    const result: SyncResult = {
      categories_created: 0,
      categories_skipped: 0,
      events_created: 0,
      events_updated: 0,
      events_skipped: 0,
      properties_created: 0,
      properties_skipped: 0,
      errors: [],
    };

    // Extract unique categories from events
    const categories = new Set<string>();
    taxonomy.forEach((event: TaxonomyEvent) => {
      if (event.category) {
        categories.add(event.category);
      }
    });

    // Sync categories
    for (const categoryName of categories) {
      try {
        await delay(100); // Rate limiting
        
        // Check if category exists
        const existingCategories = await makeAmplitudeRequest(
          '/taxonomy/category',
          'GET',
          credentials,
          { category_name: categoryName }
        );

        if (existingCategories?.data?.length > 0) {
          console.log(`Category "${categoryName}" already exists`);
          result.categories_skipped++;
        } else if (!dryRun) {
          // Create category
          await makeAmplitudeRequest(
            '/taxonomy/category',
            'POST',
            credentials,
            { category_name: categoryName }
          );
          console.log(`Created category: ${categoryName}`);
          result.categories_created++;
        }
      } catch (error) {
        const errorMsg = `Failed to sync category "${categoryName}": ${error instanceof Error ? error.message : String(error)}`;
        console.error(errorMsg);
        result.errors.push(errorMsg);
      }
    }

    // Sync events and properties
    for (const event of taxonomy) {
      try {
        await delay(150); // Rate limiting
        
        const eventName = event.event_name;
        const eventCategory = event.category || 'Uncategorized';
        const eventDescription = event.description || '';

        // Check if event exists
        const existingEvents = await makeAmplitudeRequest(
          '/taxonomy/event',
          'GET',
          credentials,
          { event_name: eventName }
        );

        const eventExists = existingEvents?.data?.length > 0;
        
        if (!dryRun) {
          if (!eventExists) {
            // Create event
            await makeAmplitudeRequest(
              '/taxonomy/event',
              'POST',
              credentials,
              {
                event_name: eventName,
                category: eventCategory,
                description: eventDescription,
              }
            );
            console.log(`Created event: ${eventName}`);
            result.events_created++;
          } else {
            // Check if update needed
            const existing = existingEvents.data[0];
            if (existing.description !== eventDescription || existing.category !== eventCategory) {
              await makeAmplitudeRequest(
                '/taxonomy/event',
                'POST',
                credentials,
                {
                  event_name: eventName,
                  category: eventCategory,
                  description: eventDescription,
                }
              );
              console.log(`Updated event: ${eventName}`);
              result.events_updated++;
            } else {
              result.events_skipped++;
            }
          }

          // Sync event properties
          if (event.event_properties && Array.isArray(event.event_properties)) {
            for (const propertyName of event.event_properties) {
              try {
                await delay(100);
                await makeAmplitudeRequest(
                  '/taxonomy/event-property',
                  'POST',
                  credentials,
                  {
                    event_name: eventName,
                    event_property: propertyName,
                    description: `Property for ${eventName}`,
                    type: 'string',
                  }
                );
                result.properties_created++;
              } catch (error) {
                const errorStr = error instanceof Error ? error.message : String(error);
                if (errorStr.includes('409')) {
                  result.properties_skipped++;
                } else {
                  result.errors.push(`Failed to sync property "${propertyName}" for event "${eventName}"`);
                }
              }
            }
          }
        } else {
          console.log(`[DRY RUN] Would ${eventExists ? 'update' : 'create'} event: ${eventName}`);
        }
      } catch (error) {
        const errorMsg = `Failed to sync event "${event.event_name}": ${error instanceof Error ? error.message : String(error)}`;
        console.error(errorMsg);
        result.errors.push(errorMsg);
      }
    }

    console.log('Sync completed:', result);

    return new Response(
      JSON.stringify({ 
        success: true, 
        result,
        dryRun 
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
