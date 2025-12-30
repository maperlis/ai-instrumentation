import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation schema
const requestSchema = z.object({
  text: z.string().min(1).max(50000), // Max 50KB of text
});

const PARSE_PROMPT = `You are a metrics parser. Extract metric names and their definitions from the provided text.

The text may be in various formats:
- "Metric Name: Definition"
- "Metric Name - Definition"
- Bullet points or numbered lists
- Table format
- Natural language with embedded metric definitions
- Markdown format

For each metric found, extract:
1. The metric name (keep it concise, title case)
2. The definition (a clear explanation of what the metric measures)

IMPORTANT:
- Only extract actual metrics (measurable quantities), not general concepts
- If a definition is missing, infer a reasonable one based on the metric name
- Clean up and normalize metric names (remove redundant words, fix capitalization)
- Combine related definitions if split across lines

Return ONLY a valid JSON object with this structure:
{
  "metrics": [
    {
      "name": "Monthly Active Users",
      "definition": "Users who have performed at least one action in the last 30 days"
    }
  ],
  "parseNotes": "Optional notes about the parsing, e.g., 'Extracted 5 metrics from bullet list format'"
}

If no valid metrics are found, return an empty metrics array.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse and validate request body
    let rawBody: unknown;
    try {
      rawBody = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const validationResult = requestSchema.safeParse(rawBody);
    if (!validationResult.success) {
      console.error("Validation error:", validationResult.error.flatten());
      return new Response(
        JSON.stringify({ 
          error: 'Invalid request data',
          details: validationResult.error.flatten().fieldErrors
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { text } = validationResult.data;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Parsing metrics text, length:", text.length);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: PARSE_PROMPT },
          { role: "user", content: `Parse the following text and extract all metric names and definitions:\n\n${text}` }
        ],
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 402 || response.status === 429) {
        const message = response.status === 402 
          ? "AI credits exhausted" 
          : "Rate limit exceeded";
        return new Response(
          JSON.stringify({ error: message, metrics: [] }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    let content = data.choices?.[0]?.message?.content || "";
    
    // Strip markdown code fences if present
    content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    const parsedResponse = JSON.parse(content);

    console.log("Parsed metrics count:", parsedResponse.metrics?.length || 0);

    return new Response(JSON.stringify({
      metrics: parsedResponse.metrics || [],
      parseNotes: parsedResponse.parseNotes
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error parsing metrics text:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Failed to parse text',
      metrics: []
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
