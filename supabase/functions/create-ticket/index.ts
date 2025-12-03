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
  labels: z.array(z.string().max(100)).max(20).optional(),
  priority: z.string().max(50).optional(),
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

    // Check if JIRA credentials are configured
    const jiraEmail = Deno.env.get('JIRA_EMAIL');
    const jiraApiToken = Deno.env.get('JIRA_API_TOKEN');
    const jiraDomain = Deno.env.get('JIRA_DOMAIN');
    const jiraProjectKey = Deno.env.get('JIRA_PROJECT_KEY');

    const hasJiraConfig = jiraEmail && jiraApiToken && jiraDomain && jiraProjectKey;

    // Generate implementation code
    const implementationCode = generateImplementationCode(events);
    
    // Generate ticket content (or use custom if provided)
    const ticketContent = customTicket || generateTicketContent(events, selectedMetrics, implementationCode);

    if (hasJiraConfig) {
      // Create JIRA ticket
      const jiraTicket = await createJiraTicket(
        jiraDomain!,
        jiraEmail!,
        jiraApiToken!,
        jiraProjectKey!,
        ticketContent
      );

      return new Response(
        JSON.stringify({ 
          success: true, 
          jiraTicket,
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
          hasJiraConfig: false
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error('Error creating ticket:', error);
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
    labels: ['analytics', 'instrumentation', 'tracking'],
    priority: 'Medium',
  };
}

async function createJiraTicket(
  domain: string,
  email: string,
  apiToken: string,
  projectKey: string,
  ticketContent: any
) {
  const auth = btoa(`${email}:${apiToken}`);
  
  // Remove protocol and trailing slashes from domain if present
  const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/\/+$/, '');
  
  const response = await fetch(`https://${cleanDomain}/rest/api/3/issue`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      fields: {
        project: {
          key: projectKey,
        },
        summary: ticketContent.title,
        description: {
          type: 'doc',
          version: 1,
          content: [
            {
              type: 'paragraph',
              content: [
                {
                  type: 'text',
                  text: ticketContent.description,
                },
              ],
            },
          ],
        },
        issuetype: {
          name: 'Task',
        },
        labels: ticketContent.labels || [],
        priority: {
          name: ticketContent.priority || 'Medium',
        },
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`JIRA API error: ${error}`);
  }

  const data = await response.json();
  return {
    key: data.key,
    url: `https://${cleanDomain}/browse/${data.key}`,
  };
}
