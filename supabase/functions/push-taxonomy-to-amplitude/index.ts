import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AmplitudeMCPCredentials {
  mcpToken: string;
  projectId: string;
}

interface TaxonomyEvent {
  event_name: string;
  description: string;
  category?: string;
  event_properties?: string[];
  [key: string]: any;
}

interface MCPEvent {
  event_type: string;
  description: string;
  category?: string;
  properties?: Record<string, any>;
}

interface SyncResult {
  events_created: number;
  events_failed: number;
  errors: string[];
}


async function pushEventsToMCP(
  credentials: AmplitudeMCPCredentials,
  events: MCPEvent[]
) {
  const urls = [
    `https://mcp.amplitude.com/api/v1/projects/${credentials.projectId}/events`,
    `https://mcp.eu.amplitude.com/api/v1/projects/${credentials.projectId}/events`,
  ];

  let lastErrorText = '';

  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    console.log(`Pushing events to MCP endpoint: ${url}`);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${credentials.mcpToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ events }),
    });

    if (response.status === 401) {
      throw new Error('Invalid MCP token');
    }

    if (response.status === 400) {
      const errorText = await response.text();
      throw new Error(`Invalid payload: ${errorText}`);
    }

    if (response.status === 404) {
      // Try next region if available
      lastErrorText = await response.text();
      console.warn(`MCP endpoint 404 at ${url}. Trying next region if available...`);
      if (i < urls.length - 1) continue;
      throw new Error('Invalid project ID or endpoint');
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`MCP API error (${response.status}): ${errorText}`);
    }

    // Success for this region
    return await response.json();
  }

  // Should not reach here
  throw new Error(lastErrorText || 'Unknown MCP API error');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { credentials, taxonomy, dryRun = false } = await req.json();

    if (!credentials?.mcpToken || !credentials?.projectId) {
      throw new Error('Missing required MCP credentials (token and project ID)');
    }

    if (!taxonomy || !Array.isArray(taxonomy)) {
      throw new Error('Invalid taxonomy data');
    }

    console.log(`Starting MCP sync for ${taxonomy.length} events (dry run: ${dryRun})`);

    const result: SyncResult = {
      events_created: 0,
      events_failed: 0,
      errors: [],
    };

    if (dryRun) {
      console.log('[DRY RUN] Would create the following events:');
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
          message: `Would create ${taxonomy.length} events`
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Convert taxonomy events to MCP event format
    const mcpEvents: MCPEvent[] = taxonomy.map((event: TaxonomyEvent) => {
      const mcpEvent: MCPEvent = {
        event_type: event.event_name,
        description: event.description || '',
        category: event.category,
      };

      // Add event properties if they exist
      if (event.event_properties && Array.isArray(event.event_properties)) {
        mcpEvent.properties = {};
        event.event_properties.forEach((prop: string) => {
          if (mcpEvent.properties) {
            mcpEvent.properties[prop] = 'string'; // Default type
          }
        });
      }

      return mcpEvent;
    });

    try {
      // Batch upload all events
      console.log(`Pushing ${mcpEvents.length} events to MCP...`);
      const response = await pushEventsToMCP(credentials, mcpEvents);
      
      result.events_created = mcpEvents.length;
      console.log('Successfully pushed events to MCP:', response);

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error('Failed to push events to MCP:', errorMsg);
      result.events_failed = mcpEvents.length;
      result.errors.push(errorMsg);
      
      throw new Error(errorMsg);
    }

    console.log('MCP sync completed:', result);

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
