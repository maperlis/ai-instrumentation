import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation schemas
const eventSchema = z.object({
  event_name: z.string().min(1).max(200),
  description: z.string().max(2000).optional().default(''),
  trigger_action: z.string().max(100).optional().default(''),
  screen: z.string().max(200).optional().default(''),
  event_properties: z.array(z.string().max(200)).max(100).optional().default([]),
  owner: z.string().max(200).optional().default(''),
  notes: z.string().max(2000).optional().default(''),
  confidence: z.number().min(0).max(1).optional(),
}).passthrough();

const customTicketSchema = z.object({
  title: z.string().min(1).max(500),
  description: z.string().max(50000),
  tags: z.array(z.string().max(100)).max(20).optional(),
  priority: z.number().min(1).max(4).optional(), // ClickUp uses 1-4, 1=urgent, 4=low
}).optional();

const requestSchema = z.object({
  events: z.array(eventSchema).min(1).max(200),
  selectedMetrics: z.array(z.string().max(200)).max(50).optional().default([]),
  customTicket: customTicketSchema,
});

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
          error: "Invalid request data",
          details: validationResult.error.flatten().fieldErrors
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const { events, selectedMetrics, customTicket } = validationResult.data;

    // Check if ClickUp credentials are configured
    const clickupApiToken = Deno.env.get('CLICKUP_API_TOKEN');
    const clickupListId = Deno.env.get('CLICKUP_LIST_ID');

    const hasClickUpConfig = clickupApiToken && clickupListId;

    // Generate implementation code
    const implementationCode = generateImplementationCode(events);
    
    // Generate ticket content (or use custom if provided)
    const ticketContent = customTicket || generateTicketContent(events, selectedMetrics, implementationCode);

    if (hasClickUpConfig) {
      // Create ClickUp task
      const clickupTask = await createClickUpTask(
        clickupApiToken!,
        clickupListId!,
        ticketContent
      );

      console.log("ClickUp task created:", clickupTask);

      return new Response(
        JSON.stringify({ 
          success: true, 
          clickupTask,
          ticketContent 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      // Return formatted ticket content for manual use
      return new Response(
        JSON.stringify({ 
          success: true, 
          ticketContent,
          hasClickUpConfig: false
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error('Error creating ClickUp task:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

function generateImplementationCode(events: any[]): string {
  return `// Analytics Implementation Code

// 1. Initialize your analytics library (e.g., Segment, Amplitude, Mixpanel)
import analytics from './analytics'; // Your analytics instance

// 2. Event tracking functions
${events.map(event => `
/**
 * ${event.description || 'Track ' + event.event_name}
 * @param properties - Event properties: ${(event.event_properties || []).join(', ') || 'none'}
 */
function track${toCamelCase(event.event_name)}(properties: {
  ${(event.event_properties || []).map((prop: string) => `${prop}: string | number;`).join('\n  ')}
}) {
  analytics.track('${event.event_name}', {
    ...properties,
    screen: '${event.screen || 'unknown'}',
    timestamp: new Date().toISOString()
  });
}
`).join('\n')}

// 3. Example usage:
// track${toCamelCase(events[0]?.event_name || 'Event')}({
//   ${(events[0]?.event_properties || []).map((prop: string) => `${prop}: 'value'`).join(',\n//   ') || '// No properties'}
// });
`;
}

function toCamelCase(str: string): string {
  return str
    .split('_')
    .map((word, index) => 
      index === 0 
        ? word.charAt(0).toUpperCase() + word.slice(1) 
        : word.charAt(0).toUpperCase() + word.slice(1)
    )
    .join('');
}

function generateTicketContent(events: any[], selectedMetrics: string[], code: string) {
  return {
    title: `Implement Analytics Taxonomy - ${events.length} Events`,
    description: `# Analytics Instrumentation Implementation

## Overview
Implement the following analytics taxonomy to track key product metrics and user behaviors.

## Selected Metrics
${selectedMetrics.map(metric => `- ${metric}`).join('\n') || '- No specific metrics selected'}

## Events to Implement (${events.length} total)

${events.map((event, index) => `
### ${index + 1}. ${event.event_name}

**Description:** ${event.description || 'No description'}

**Trigger Action:** ${event.trigger_action || 'Not specified'}

**Screen/Location:** ${event.screen || 'Not specified'}

**Properties:**
${(event.event_properties || []).map((prop: string) => `- \`${prop}\``).join('\n') || '- No properties'}

**Owner:** ${event.owner || 'Not assigned'}

**Notes:** ${event.notes || 'No notes'}

**Confidence Score:** ${event.confidence ? (event.confidence * 100).toFixed(0) + '%' : 'N/A'}

---
`).join('\n')}

## Implementation Code

\`\`\`typescript
${code}
\`\`\`

## Testing Checklist
${events.map(event => `- [ ] Verify ${event.event_name} fires on ${event.trigger_action || 'trigger'}`).join('\n')}
- [ ] Validate all event properties are captured correctly
- [ ] Test events in development environment
- [ ] Verify events appear in analytics dashboard
- [ ] Document any deviations from spec

## Naming Convention
All events follow the \`product_area_action_object\` pattern using snake_case for consistency.

## Resources
- Analytics Documentation: [Add your docs link]
- Metrics Dashboard: [Add dashboard link]
- Testing Guide: [Add testing guide link]
`,
    tags: ['analytics', 'instrumentation', 'tracking'],
    priority: 3, // Normal priority in ClickUp (1=urgent, 2=high, 3=normal, 4=low)
  };
}

// Map string priority to ClickUp priority number
function mapPriorityToClickUp(priority: string): number {
  const priorityMap: Record<string, number> = {
    'Urgent': 1,
    'High': 2,
    'Medium': 3,
    'Normal': 3,
    'Low': 4,
  };
  return priorityMap[priority] || 3;
}

async function createClickUpTask(
  apiToken: string,
  listId: string,
  ticketContent: any
) {
  const response = await fetch(`https://api.clickup.com/api/v2/list/${listId}/task`, {
    method: 'POST',
    headers: {
      'Authorization': apiToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: ticketContent.title,
      markdown_description: ticketContent.description,
      tags: ticketContent.tags || [],
      priority: typeof ticketContent.priority === 'number' 
        ? ticketContent.priority 
        : mapPriorityToClickUp(ticketContent.priority || 'Medium'),
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("ClickUp API error response:", error);
    throw new Error(`ClickUp API error: ${error}`);
  }

  const data = await response.json();
  return {
    id: data.id,
    url: data.url,
    name: data.name,
  };
}
