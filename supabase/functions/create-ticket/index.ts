import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { events, selectedMetrics } = await req.json();

    // Check if JIRA credentials are configured
    const jiraEmail = Deno.env.get('JIRA_EMAIL');
    const jiraApiToken = Deno.env.get('JIRA_API_TOKEN');
    const jiraDomain = Deno.env.get('JIRA_DOMAIN');
    const jiraProjectKey = Deno.env.get('JIRA_PROJECT_KEY');

    const hasJiraConfig = jiraEmail && jiraApiToken && jiraDomain && jiraProjectKey;

    // Generate implementation code
    const implementationCode = generateImplementationCode(events);
    
    // Generate ticket content
    const ticketContent = generateTicketContent(events, selectedMetrics, implementationCode);

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
 * ${event.description}
 * @param properties - Event properties: ${event.event_properties.join(', ')}
 */
function track${toCamelCase(event.event_name)}(properties: {
  ${event.event_properties.map((prop: string) => `${prop}: string | number;`).join('\n  ')}
}) {
  analytics.track('${event.event_name}', {
    ...properties,
    screen: '${event.screen}',
    timestamp: new Date().toISOString()
  });
}
`).join('\n')}

// 3. Example usage:
// track${toCamelCase(events[0]?.event_name || 'Event')}({
//   ${events[0]?.event_properties.map((prop: string) => `${prop}: 'value'`).join(',\n//   ')}
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
${selectedMetrics.map(metric => `- ${metric}`).join('\n')}

## Events to Implement (${events.length} total)

${events.map((event, index) => `
### ${index + 1}. ${event.event_name}

**Description:** ${event.description}

**Trigger Action:** ${event.trigger_action}

**Screen/Location:** ${event.screen}

**Properties:**
${event.event_properties.map((prop: string) => `- \`${prop}\``).join('\n')}

**Owner:** ${event.owner}

**Notes:** ${event.notes}

**Confidence Score:** ${event.confidence ? (event.confidence * 100).toFixed(0) + '%' : 'N/A'}

---
`).join('\n')}

## Implementation Code

\`\`\`typescript
${code}
\`\`\`

## Testing Checklist
${events.map(event => `- [ ] Verify ${event.event_name} fires on ${event.trigger_action}`).join('\n')}
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
  
  const response = await fetch(`https://${domain}/rest/api/3/issue`, {
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
        labels: ticketContent.labels,
        priority: {
          name: ticketContent.priority,
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
    url: `https://${domain}/browse/${data.key}`,
  };
}
