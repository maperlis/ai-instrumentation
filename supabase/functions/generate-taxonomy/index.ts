import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Agent prompts
const PRODUCT_ANALYST_PROMPT = `You are a Product Analytics Specialist. Analyze the product and recommend 5-8 key metrics that should be measured.

Group metrics by category (Acquisition, Engagement, Retention, Monetization, Product Usage).

Return ONLY a valid JSON object with this exact structure:
{
  "metrics": [
    {
      "id": "conversion_rate",
      "name": "Conversion Rate",
      "description": "Percentage of users who complete key actions like signup or purchase",
      "category": "Acquisition",
      "example_events": ["signup_completed", "purchase_completed", "trial_started"]
    }
  ],
  "analysis": "Brief analysis of the product and why these metrics matter"
}`;

const INSTRUMENTATION_ARCHITECT_PROMPT = `You are an Instrumentation Architect. Generate a comprehensive event taxonomy optimized for measuring these metrics: {selectedMetrics}.

Follow these principles:
- Use snake_case for all event names
- Follow the pattern: product_area_action_object
- Focus on events that directly support the selected metrics
- Generate appropriate event properties for context
- Assign confidence scores based on clarity of the UI element
- Assign owners based on product area
{customFieldsInstruction}

Return ONLY a valid JSON object with this exact structure:
{
  "events": [
    {
      "event_name": "string",
      "description": "string",
      "trigger_action": "click|view|submit|scroll|etc",
      "screen": "string",
      "event_properties": ["array", "of", "strings"],
      "owner": "string",
      "notes": "string",
      "confidence": 0.0-1.0
      {customFieldsJson}
    }
  ],
  "summary": "Brief summary of the instrumentation approach"
}`;

async function callLovableAI(systemPrompt: string, userContent: any[], apiKey: string) {
  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent },
      ],
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("AI API error:", response.status, errorText);
    throw new Error(`AI API error: ${response.status}`);
  }

  const aiData = await response.json();
  const content = aiData.choices?.[0]?.message?.content;
  
  if (!content) {
    throw new Error("No content in AI response");
  }

  // Strip markdown code fences if present
  let cleanedContent = content.trim();
  if (cleanedContent.startsWith('```')) {
    cleanedContent = cleanedContent.replace(/^```(?:json)?\s*\n/, '');
    cleanedContent = cleanedContent.replace(/\n```\s*$/, '');
  }

  return JSON.parse(cleanedContent);
}

function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      sessionId,
      url, 
      imageData, 
      videoData, 
      productDetails, 
      mode = 'metrics', 
      selectedMetrics, 
      customFields,
      userMessage,
      action = 'start',
      approvalType,
      // Stateless: client sends back context from previous responses
      inputData: providedInputData,
      metrics: providedMetrics,
    } = await req.json();

    console.log("Mode:", mode, "Action:", action, "Session:", sessionId);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    const newSessionId = sessionId || generateSessionId();
    
    // Use provided input data or build from current request
    const inputData = providedInputData || { url, imageData, videoData, productDetails };

    // Build user content for AI
    const buildUserContent = (input: any, extraText?: string) => {
      const userContent: any[] = [];
      
      if (input.url) {
        userContent.push({
          type: "text",
          text: `Analyze this product URL:\n\nURL: ${input.url}${input.productDetails ? `\n\nProduct Context: ${input.productDetails}` : ""}${extraText ? `\n\n${extraText}` : ""}`,
        });
      } else if (input.imageData) {
        userContent.push({
          type: "text",
          text: `Analyze this product design.${input.productDetails ? `\n\nProduct Context: ${input.productDetails}` : ""}${extraText ? `\n\n${extraText}` : ""}`,
        });
        userContent.push({
          type: "image_url",
          image_url: { url: input.imageData },
        });
      } else if (input.videoData) {
        userContent.push({
          type: "text",
          text: `Analyze this product demo video frame.${input.productDetails ? `\n\nProduct Context: ${input.productDetails}` : ""}${extraText ? `\n\n${extraText}` : ""}`,
        });
        userContent.push({
          type: "image_url",
          image_url: { url: input.videoData },
        });
      } else if (input.productDetails) {
        // Fallback: use product details as text input
        userContent.push({
          type: "text",
          text: `Analyze this product:\n\n${input.productDetails}${extraText ? `\n\n${extraText}` : ""}`,
        });
      }
      
      // Validate we have content
      if (userContent.length === 0) {
        throw new Error("No input provided. Please provide a URL, image, video, or product details.");
      }
      
      return userContent;
    };

    // Action handlers
    if (action === 'start' || (action === 'continue' && mode === 'metrics')) {
      // Step 1: Product Analyst Agent - Generate metrics
      console.log("Running Product Analyst Agent...");
      
      const userContent = buildUserContent(inputData);
      const metricsResult = await callLovableAI(PRODUCT_ANALYST_PROMPT, userContent, LOVABLE_API_KEY);

      return new Response(JSON.stringify({
        sessionId: newSessionId,
        status: 'waiting_approval',
        requiresApproval: true,
        approvalType: 'metrics',
        metrics: metricsResult.metrics,
        analysis: metricsResult.analysis,
        // Return input data for client to send back
        inputData,
        conversationHistory: [
          { role: 'assistant', agent: 'Product Analyst', content: metricsResult.analysis || 'I have analyzed your product and identified key metrics to track.' }
        ]
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === 'approve' && approvalType === 'metrics') {
      // Step 2: Instrumentation Architect Agent - Generate taxonomy
      console.log("Running Instrumentation Architect Agent...");
      
      const metricsToUse = selectedMetrics || providedMetrics?.map((m: any) => m.name) || [];
      
      if (metricsToUse.length === 0) {
        throw new Error("No metrics provided for taxonomy generation");
      }
      
      // Build custom fields instruction
      let customFieldsInstruction = '';
      let customFieldsJson = '';
      if (customFields && customFields.length > 0) {
        customFieldsInstruction = `- Include these custom fields in each event: ${customFields.map((f: any) => f.name).join(', ')}`;
        customFieldsJson = customFields.map((f: any) => {
          const type = f.type === 'array' ? '["array"]' : f.type === 'number' ? '0' : '"string"';
          return `"${f.id}": ${type}`;
        }).join(',\n      ');
        if (customFieldsJson) customFieldsJson = ',\n      ' + customFieldsJson;
      }

      const architectPrompt = INSTRUMENTATION_ARCHITECT_PROMPT
        .replace('{selectedMetrics}', metricsToUse.join(', '))
        .replace('{customFieldsInstruction}', customFieldsInstruction)
        .replace('{customFieldsJson}', customFieldsJson);

      const userContent = buildUserContent(inputData, `Focus on events for: ${metricsToUse.join(', ')}`);
      const taxonomyResult = await callLovableAI(architectPrompt, userContent, LOVABLE_API_KEY);

      return new Response(JSON.stringify({
        sessionId: newSessionId,
        status: 'waiting_approval',
        requiresApproval: true,
        approvalType: 'taxonomy',
        events: taxonomyResult.events,
        summary: taxonomyResult.summary,
        // Return data for client to send back
        inputData,
        metrics: providedMetrics,
        conversationHistory: [
          { role: 'assistant', agent: 'Product Analyst', content: 'I have analyzed your product and identified key metrics to track.' },
          { role: 'assistant', agent: 'Instrumentation Architect', content: taxonomyResult.summary || `I have generated ${taxonomyResult.events?.length || 0} events based on your selected metrics.` }
        ]
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === 'approve' && approvalType === 'taxonomy') {
      // Step 3: Finalize
      console.log("Finalizing taxonomy...");

      return new Response(JSON.stringify({
        sessionId: newSessionId,
        status: 'completed',
        requiresApproval: false,
        conversationHistory: [
          { role: 'assistant', agent: 'Product Analyst', content: 'I have analyzed your product and identified key metrics to track.' },
          { role: 'assistant', agent: 'Instrumentation Architect', content: 'I have generated events based on your selected metrics.' },
          { role: 'assistant', agent: 'Implementation Specialist', content: 'Your taxonomy has been finalized and is ready for implementation!' }
        ]
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === 'reject') {
      return new Response(JSON.stringify({
        sessionId: newSessionId,
        status: 'rejected',
        message: 'Please provide feedback or start a new session.',
        conversationHistory: []
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Legacy support: direct mode calls
    if (mode === 'metrics' && !action) {
      const userContent = buildUserContent({ url, imageData, videoData, productDetails });
      const metricsResult = await callLovableAI(PRODUCT_ANALYST_PROMPT, userContent, LOVABLE_API_KEY);
      return new Response(JSON.stringify(metricsResult), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (mode === 'taxonomy' && selectedMetrics) {
      let customFieldsInstruction = '';
      let customFieldsJson = '';
      if (customFields && customFields.length > 0) {
        customFieldsInstruction = `- Include these custom fields in each event: ${customFields.map((f: any) => f.name).join(', ')}`;
        customFieldsJson = customFields.map((f: any) => {
          const type = f.type === 'array' ? '["array"]' : f.type === 'number' ? '0' : '"string"';
          return `"${f.id}": ${type}`;
        }).join(',\n      ');
        if (customFieldsJson) customFieldsJson = ',\n      ' + customFieldsJson;
      }

      const architectPrompt = INSTRUMENTATION_ARCHITECT_PROMPT
        .replace('{selectedMetrics}', selectedMetrics.join(', '))
        .replace('{customFieldsInstruction}', customFieldsInstruction)
        .replace('{customFieldsJson}', customFieldsJson);

      const userContent = buildUserContent({ url, imageData, videoData, productDetails }, `Focus on events for: ${selectedMetrics.join(', ')}`);
      const taxonomyResult = await callLovableAI(architectPrompt, userContent, LOVABLE_API_KEY);
      return new Response(JSON.stringify(taxonomyResult), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    throw new Error("Invalid request parameters");

  } catch (error: any) {
    console.error("Error in generate-taxonomy:", error);
    return new Response(
      JSON.stringify({
        error: error.message || "Failed to generate taxonomy",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
