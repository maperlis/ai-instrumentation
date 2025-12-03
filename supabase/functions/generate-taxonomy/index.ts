import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// In-memory session store (for demo - consider using database for production)
const sessions = new Map<string, any>();

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

const IMPLEMENTATION_SPECIALIST_PROMPT = `You are an Implementation Specialist. Review and enhance this taxonomy with implementation details.

Current taxonomy:
{taxonomy}

Add practical implementation notes, priority order, and any potential conflicts or dependencies between events.

Return ONLY a valid JSON object with the enhanced events array including any additional implementation guidance.`;

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
    } = await req.json();

    console.log("Mode:", mode, "Action:", action, "Session:", sessionId);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    // Handle different actions
    let currentSession = sessionId ? sessions.get(sessionId) : null;
    const newSessionId = sessionId || generateSessionId();

    // Build user content for AI
    const userContent: any[] = [];

    if (url) {
      userContent.push({
        type: "text",
        text: `Analyze this product URL:\n\nURL: ${url}${productDetails ? `\n\nProduct Context: ${productDetails}` : ""}`,
      });
    } else if (imageData) {
      userContent.push({
        type: "text",
        text: `Analyze this product design.${productDetails ? `\n\nProduct Context: ${productDetails}` : ""}`,
      });
      userContent.push({
        type: "image_url",
        image_url: { url: imageData },
      });
    } else if (videoData) {
      userContent.push({
        type: "text",
        text: `Analyze this product demo video frame.${productDetails ? `\n\nProduct Context: ${productDetails}` : ""}`,
      });
      userContent.push({
        type: "image_url",
        image_url: { url: videoData },
      });
    }

    // Action handlers
    if (action === 'start' || (action === 'continue' && mode === 'metrics')) {
      // Step 1: Product Analyst Agent - Generate metrics
      console.log("Running Product Analyst Agent...");
      
      const metricsResult = await callLovableAI(PRODUCT_ANALYST_PROMPT, userContent, LOVABLE_API_KEY);
      
      // Store session state
      sessions.set(newSessionId, {
        inputData: { url, imageData, videoData, productDetails },
        metrics: metricsResult.metrics,
        status: 'waiting_metrics_approval',
        conversationHistory: [
          { role: 'assistant', agent: 'Product Analyst', content: metricsResult.analysis || 'I have analyzed your product and identified key metrics.' }
        ]
      });

      return new Response(JSON.stringify({
        sessionId: newSessionId,
        status: 'waiting_approval',
        requiresApproval: true,
        approvalType: 'metrics',
        metrics: metricsResult.metrics,
        analysis: metricsResult.analysis,
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
      
      if (!currentSession) {
        throw new Error("Session not found. Please start a new session.");
      }

      const metricsToUse = selectedMetrics || currentSession.metrics?.map((m: any) => m.name) || [];
      
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

      // Re-build user content with metrics focus
      const taxonomyUserContent: any[] = [];
      const inputData = currentSession.inputData;
      
      if (inputData.url) {
        taxonomyUserContent.push({
          type: "text",
          text: `Generate taxonomy for this product:\n\nURL: ${inputData.url}${inputData.productDetails ? `\n\nProduct Context: ${inputData.productDetails}` : ""}\n\nFocus on events for: ${metricsToUse.join(', ')}`,
        });
      } else if (inputData.imageData) {
        taxonomyUserContent.push({
          type: "text",
          text: `Generate taxonomy for this product design.${inputData.productDetails ? `\n\nProduct Context: ${inputData.productDetails}` : ""}\n\nFocus on events for: ${metricsToUse.join(', ')}`,
        });
        taxonomyUserContent.push({
          type: "image_url",
          image_url: { url: inputData.imageData },
        });
      } else if (inputData.videoData) {
        taxonomyUserContent.push({
          type: "text",
          text: `Generate taxonomy for this product.${inputData.productDetails ? `\n\nProduct Context: ${inputData.productDetails}` : ""}\n\nFocus on events for: ${metricsToUse.join(', ')}`,
        });
        taxonomyUserContent.push({
          type: "image_url",
          image_url: { url: inputData.videoData },
        });
      }

      const taxonomyResult = await callLovableAI(architectPrompt, taxonomyUserContent, LOVABLE_API_KEY);
      
      // Update session
      currentSession.taxonomy = taxonomyResult.events;
      currentSession.status = 'waiting_taxonomy_approval';
      currentSession.conversationHistory.push({
        role: 'assistant',
        agent: 'Instrumentation Architect',
        content: taxonomyResult.summary || `I have generated ${taxonomyResult.events?.length || 0} events based on your selected metrics.`
      });
      sessions.set(sessionId, currentSession);

      return new Response(JSON.stringify({
        sessionId,
        status: 'waiting_approval',
        requiresApproval: true,
        approvalType: 'taxonomy',
        events: taxonomyResult.events,
        summary: taxonomyResult.summary,
        conversationHistory: currentSession.conversationHistory
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === 'approve' && approvalType === 'taxonomy') {
      // Step 3: Implementation Specialist Agent - Finalize
      console.log("Running Implementation Specialist Agent...");
      
      if (!currentSession) {
        throw new Error("Session not found. Please start a new session.");
      }

      // For now, just return the taxonomy as completed
      // In a full implementation, we could enhance with more details
      currentSession.status = 'completed';
      currentSession.conversationHistory.push({
        role: 'assistant',
        agent: 'Implementation Specialist',
        content: 'Your taxonomy has been finalized and is ready for implementation!'
      });
      sessions.set(sessionId, currentSession);

      return new Response(JSON.stringify({
        sessionId,
        status: 'completed',
        requiresApproval: false,
        events: currentSession.taxonomy,
        conversationHistory: currentSession.conversationHistory
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === 'reject') {
      // Handle rejection - allow user to provide feedback
      if (currentSession) {
        currentSession.conversationHistory.push({
          role: 'user',
          content: userMessage || 'Rejected'
        });
        sessions.set(sessionId, currentSession);
      }

      return new Response(JSON.stringify({
        sessionId,
        status: 'rejected',
        message: 'Please provide feedback or start a new session.',
        conversationHistory: currentSession?.conversationHistory || []
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Legacy support: direct mode calls (backwards compatibility)
    if (mode === 'metrics' && !action) {
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

      userContent[0] = {
        type: "text",
        text: `${userContent[0]?.text || ''}\n\nFocus on events for: ${selectedMetrics.join(', ')}`,
      };

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
