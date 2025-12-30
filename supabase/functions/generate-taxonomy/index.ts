import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Input validation schemas
const customFieldSchema = z.object({
  id: z.string().max(100),
  name: z.string().max(200),
  type: z.string().max(50).optional(),
}).passthrough();

const metricSchema = z.object({
  id: z.string().max(100),
  name: z.string().max(200),
  description: z.string().max(1000).optional(),
  category: z.string().max(100).optional(),
  example_events: z.array(z.string().max(200)).max(20).optional(),
  calculation: z.string().max(500).optional(),
  businessQuestions: z.array(z.string().max(300)).max(10).optional(),
}).passthrough();

const eventSchema = z.object({
  event_name: z.string().max(200),
  description: z.string().max(1000).optional(),
  trigger_action: z.string().max(100).optional(),
  screen: z.string().max(200).optional(),
  event_properties: z.array(z.string().max(200)).max(50).optional(),
  owner: z.string().max(200).optional(),
  notes: z.string().max(2000).optional(),
  confidence: z.number().min(0).max(1).optional(),
}).passthrough();

// Helper to handle optional URL (empty string should become undefined)
const optionalUrl = z.string().max(2000).optional().transform(val => {
  if (!val || val.trim() === '') return undefined;
  // Validate URL format only if provided
  try {
    new URL(val);
    return val;
  } catch {
    return undefined; // Invalid URLs become undefined
  }
});

// Schema for existing metrics from user imports
const existingMetricSchema = z.object({
  id: z.string().max(100),
  name: z.string().max(200),
  definition: z.string().max(1000).optional(),
  source: z.enum(['csv', 'pasted', 'manual']).optional(),
}).passthrough();

const requestSchema = z.object({
  sessionId: z.string().max(100).optional(),
  url: optionalUrl,
  imageData: z.string().max(15_000_000).optional(),
  videoData: z.string().max(15_000_000).optional(),
  productDetails: z.string().max(10000).optional(),
  mode: z.enum(['metrics', 'taxonomy']).optional(),
  selectedMetrics: z.array(z.string().max(200)).max(50).optional(),
  customFields: z.array(customFieldSchema).max(20).optional(),
  userMessage: z.string().max(5000).optional(),
  action: z.enum(['start', 'continue', 'approve', 'reject']).optional(),
  approvalType: z.enum(['metrics', 'taxonomy']).optional(),
  inputData: z.object({
    url: optionalUrl,
    imageData: z.string().max(15_000_000).optional(),
    videoData: z.string().max(15_000_000).optional(),
    productDetails: z.string().max(10000).optional(),
  }).optional(),
  metrics: z.array(metricSchema).max(50).optional(),
  events: z.array(eventSchema).max(200).optional(),
  existingMetrics: z.array(existingMetricSchema).max(100).optional(),
});

// Agent prompts
const FRAMEWORK_RECOMMENDATION_PROMPT = `You are a Product Analytics Specialist. Analyze the product and recommend the best metrics framework for visualizing and tracking their key metrics.

The three framework options are:
1. "driver_tree" - A hierarchical Driver Tree showing a North Star metric at top with contributing metrics branching below. Best for: understanding cause-and-effect relationships, products with clear metric hierarchies.
2. "conversion_funnel" - A step-by-step Conversion Funnel showing user journey stages. Best for: e-commerce, SaaS onboarding, lead generation, products with clear user journeys.
3. "growth_flywheel" - A circular Growth Flywheel showing self-reinforcing loops. Best for: marketplace products, viral products, community-driven products with network effects.

Based on the product, provide:
1. Your recommended framework with reasoning
2. 2-3 clarifying questions to refine your recommendation (if helpful)

Return ONLY a valid JSON object with this structure:
{
  "recommendedFramework": "driver_tree|conversion_funnel|growth_flywheel",
  "confidence": 0.0-1.0,
  "reasoning": "Clear explanation of why this framework suits their product. Be conversational and helpful. Use plain language.",
  "clarifyingQuestions": [
    {
      "id": "question_1",
      "question": "What is your primary business goal right now?",
      "type": "single_choice",
      "options": ["Grow new users", "Increase engagement", "Improve retention", "Drive revenue"]
    }
  ]
}`;

const PRODUCT_ANALYST_PROMPT = `You are a senior Product Analytics Specialist. Your role is to analyze the product context and existing metrics to recommend a tailored metrics framework.

## Your Context
- Recommended framework: {framework}
- User's answers: {clarifyingAnswers}
- Existing metrics user tracks: {existingMetrics}
- Content context: {contentContext}

## Your Approach

**Context-Aware Analysis:**
1. Study the existing metrics the user uploaded. Identify what they're already measuring well.
2. Use the content (URL, image, video, product description) to understand their product deeply.
3. Identify gaps between what they measure and what they NEED to measure for their stated goals.
4. Reuse existing metrics where they align with best practices. Don't reinvent the wheel.

**Metric Recommendations:**
For each metric, determine its status:
- "existing" - The user already tracks this (match by name or definition similarity)
- "new" - A gap the user should start tracking
- "needs_update" - An existing metric that needs refinement (better definition, calculation, etc.)

## Output Format

Return ONLY a valid JSON object:
{
  "metrics": [
    {
      "id": "metric_id_snake_case",
      "name": "Metric Name",
      "description": "Clear, actionable description",
      "category": "Acquisition|Engagement|Retention|Monetization|Product Usage",
      "status": "existing|new|needs_update",
      "matchedExistingMetric": "Name of matched existing metric (if status is existing or needs_update)",
      "updateReason": "Why this metric needs refinement (if status is needs_update)",
      "example_events": ["event_from_calculation_1", "event_from_calculation_2"],
      "level": 0|1|2,
      "influenceDescription": "How this metric drives metrics above it",
      "calculation": "formula showing how metric is computed",
      "businessQuestions": [
        "What business question can this answer?",
        "How does this vary across segments?",
        "What factors influence this?"
      ]
    }
  ],
  "executiveSummary": [
    "**Key Finding 1:** Brief insight about their measurement maturity",
    "**Key Finding 2:** Most critical gap identified",
    "**Key Finding 3:** Quick win opportunity",
    "**Recommendation:** Overall strategic direction"
  ],
  "existingMetricsInsights": "Analysis of their current metrics: what's strong, what's missing, what needs work",
  "recommendedInstrumentationPlan": [
    "**Phase 1:** Immediate quick wins (1-2 weeks)",
    "**Phase 2:** Core instrumentation (2-4 weeks)", 
    "**Phase 3:** Advanced analytics (4-8 weeks)"
  ],
  "nextSteps": [
    "First concrete action item",
    "Second concrete action item",
    "Third concrete action item"
  ],
  "analysis": "Brief, executive-friendly analysis (3-4 sentences max). Mention the framework choice and key relationships."
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

const CONVERSATION_PROMPT = `You are a Product Analytics Specialist having a conversation with a user about metrics for their product.

Current metrics being considered:
{currentMetrics}

The user has asked: "{userMessage}"

You should:
1. Answer their question helpfully and concisely
2. If they ask for different or additional metrics, suggest new ones
3. If you suggest new metrics, include them in your response with calculation formulas and business questions

IMPORTANT: The example_events array must contain ONLY the events that are used to compute the calculation. Use snake_case event names that match what's referenced in the calculation formula.

Return ONLY a valid JSON object with this structure:
{
  "response": "Your conversational response to the user",
  "newMetrics": [
    {
      "id": "metric_id_snake_case",
      "name": "Metric Name",
      "description": "Description of the metric",
      "category": "Acquisition|Engagement|Retention|Monetization|Product Usage",
      "example_events": ["event_from_calculation_1", "event_from_calculation_2"],
      "calculation": "event_from_calculation_1_count / event_from_calculation_2_count * 100",
      "businessQuestions": [
        "What business question can this metric answer?",
        "How does this metric vary across segments?",
        "What factors influence this metric?"
      ]
    }
  ]
}

If no new metrics are suggested, return an empty array for newMetrics.
Keep your response concise and helpful.`;

const TAXONOMY_CONVERSATION_PROMPT = `You are an Instrumentation Architect having a conversation with a user about their event taxonomy.

Current events in the taxonomy:
{currentEvents}

The user has asked: "{userMessage}"

You should:
1. Answer their question helpfully and concisely
2. If they request changes to events, provide the updated events
3. If they ask for new events, add them
4. If they ask to remove events, exclude them from the response

Return ONLY a valid JSON object with this structure:
{
  "response": "Your conversational response explaining the changes",
  "updatedEvents": [
    {
      "event_name": "string",
      "description": "string",
      "trigger_action": "click|view|submit|scroll|etc",
      "screen": "string",
      "event_properties": ["array", "of", "strings"],
      "owner": "string",
      "notes": "string",
      "confidence": 0.0-1.0
    }
  ],
  "hasChanges": true
}

If no changes to the taxonomy, set hasChanges to false and return the current events in updatedEvents.
Keep your response concise and helpful.`;

// Custom error class for AI credit/rate limit issues
class AICreditsError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);
    this.name = 'AICreditsError';
  }
}

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
    
    // Throw special error for credit/rate limit issues
    if (response.status === 402 || response.status === 429) {
      const message = response.status === 402 
        ? "AI credits exhausted" 
        : "Rate limit exceeded";
      throw new AICreditsError(response.status, message);
    }
    
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

// Fallback metrics when AI is unavailable
function getFallbackMetrics() {
  return [
    {
      id: "monthly_active_users",
      name: "Monthly Active Users",
      description: "Users who have performed at least one action in the last 30 days",
      category: "Engagement",
      example_events: ["user_session_started"],
      level: 0,
      influenceDescription: "North Star metric indicating overall product health",
      calculation: "count(distinct user_id) where timestamp > now() - 30 days",
      businessQuestions: [
        "How is our user base growing over time?",
        "What percentage of signups become active users?",
        "Which features drive the most engagement?"
      ]
    },
    {
      id: "signup_conversion_rate",
      name: "Signup Conversion Rate",
      description: "Percentage of visitors who complete signup",
      category: "Acquisition",
      example_events: ["signup_completed", "page_viewed"],
      level: 1,
      influenceDescription: "Higher signup conversion increases active user count",
      calculation: "signup_completed_count / page_viewed_count * 100",
      businessQuestions: [
        "Which traffic sources have the highest conversion?",
        "How does conversion vary by device type?",
        "What is the impact of form changes?"
      ]
    },
    {
      id: "feature_adoption_rate",
      name: "Feature Adoption Rate",
      description: "Percentage of users who use key features",
      category: "Product Usage",
      example_events: ["feature_used", "user_session_started"],
      level: 1,
      influenceDescription: "Higher feature adoption leads to better retention",
      calculation: "users_with_feature_use / total_active_users * 100",
      businessQuestions: [
        "Which features are most popular?",
        "How long until users discover key features?",
        "What drives feature discovery?"
      ]
    },
    {
      id: "retention_rate",
      name: "7-Day Retention Rate",
      description: "Users who return within 7 days of first use",
      category: "Retention",
      example_events: ["user_session_started"],
      level: 1,
      influenceDescription: "Retained users drive sustainable growth",
      calculation: "users_returning_day_7 / cohort_size * 100",
      businessQuestions: [
        "What actions predict strong retention?",
        "How does retention vary by acquisition channel?",
        "What causes users to churn?"
      ]
    }
  ];
}

// Fallback events when AI is unavailable
function getFallbackEvents(metricsToUse: string[]) {
  return [
    {
      event_name: "page_viewed",
      description: "User views a page in the application",
      trigger_action: "view",
      screen: "Any",
      event_properties: ["page_name", "page_url", "referrer"],
      owner: "Engineering",
      notes: "Core pageview tracking for all screens",
      confidence: 0.95
    },
    {
      event_name: "user_session_started",
      description: "User starts a new session",
      trigger_action: "automatic",
      screen: "App Entry",
      event_properties: ["session_id", "device_type", "platform"],
      owner: "Engineering",
      notes: "Session tracking for MAU and retention calculations",
      confidence: 0.95
    },
    {
      event_name: "signup_started",
      description: "User begins the signup process",
      trigger_action: "click",
      screen: "Landing Page",
      event_properties: ["signup_method", "referral_source"],
      owner: "Growth",
      notes: "Track signup funnel entry",
      confidence: 0.9
    },
    {
      event_name: "signup_completed",
      description: "User completes account creation",
      trigger_action: "submit",
      screen: "Signup Form",
      event_properties: ["signup_method", "time_to_complete"],
      owner: "Growth",
      notes: "Track successful signups for conversion rate",
      confidence: 0.95
    },
    {
      event_name: "feature_used",
      description: "User interacts with a key feature",
      trigger_action: "click",
      screen: "Main App",
      event_properties: ["feature_name", "feature_category"],
      owner: "Product",
      notes: "Track feature adoption and usage patterns",
      confidence: 0.85
    },
    {
      event_name: "button_clicked",
      description: "User clicks a CTA button",
      trigger_action: "click",
      screen: "Various",
      event_properties: ["button_name", "button_location", "page_name"],
      owner: "Product",
      notes: "General button click tracking for UX analysis",
      confidence: 0.8
    }
  ];
}

function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
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
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

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
      inputData: providedInputData,
      metrics: providedMetrics,
      events: providedEvents,
      existingMetrics: providedExistingMetrics,
    } = validationResult.data;

    console.log("Mode:", mode, "Action:", action, "Session:", sessionId, "ExistingMetrics:", providedExistingMetrics?.length || 0);

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
        userContent.push({
          type: "text",
          text: `Analyze this product:\n\n${input.productDetails}${extraText ? `\n\n${extraText}` : ""}`,
        });
      }
      
      if (userContent.length === 0) {
        throw new Error("No input provided. Please provide a URL, image, video, or product details.");
      }
      
      return userContent;
    };

    // Action handlers
    if (action === 'start') {
      console.log("Running Framework Recommendation + Product Analyst Agent...");
      
      const userContent = buildUserContent(inputData);
      
      // Build existing metrics context string
      const existingMetricsStr = providedExistingMetrics && providedExistingMetrics.length > 0
        ? providedExistingMetrics.map((m: any) => `- ${m.name}: ${m.definition || 'No definition provided'}`).join('\n')
        : 'None provided - user is starting fresh';
      
      // Build content context string
      const contentContextParts: string[] = [];
      if (inputData.url) contentContextParts.push(`URL analyzed: ${inputData.url}`);
      if (inputData.imageData) contentContextParts.push('Product screenshot/mockup provided');
      if (inputData.videoData) contentContextParts.push('Product video frame provided');
      if (inputData.productDetails) contentContextParts.push(`Product description: ${inputData.productDetails.substring(0, 500)}...`);
      const contentContext = contentContextParts.length > 0 
        ? contentContextParts.join('\n') 
        : 'Limited context provided';
      
      // First, get framework recommendation
      const frameworkResult = await callLovableAI(FRAMEWORK_RECOMMENDATION_PROMPT, userContent, LOVABLE_API_KEY);
      console.log("Framework recommendation:", frameworkResult.recommendedFramework);
      
      // Then get metrics with full context
      const metricsPrompt = PRODUCT_ANALYST_PROMPT
        .replace('{framework}', frameworkResult.recommendedFramework || 'driver_tree')
        .replace('{clarifyingAnswers}', 'Extracted from product context')
        .replace('{existingMetrics}', existingMetricsStr)
        .replace('{contentContext}', contentContext);
      
      const metricsResult = await callLovableAI(metricsPrompt, userContent, LOVABLE_API_KEY);
      
      // Build executive summary for chat display
      const executiveSummary = metricsResult.executiveSummary 
        ? `**Executive Summary**\n${metricsResult.executiveSummary.map((s: string) => `• ${s}`).join('\n')}`
        : '';
      
      const existingInsights = metricsResult.existingMetricsInsights
        ? `\n\n**Insights Based on Your Existing Metrics**\n${metricsResult.existingMetricsInsights}`
        : '';
        
      const instrumentationPlan = metricsResult.recommendedInstrumentationPlan
        ? `\n\n**Recommended Instrumentation Plan**\n${metricsResult.recommendedInstrumentationPlan.map((p: string) => `• ${p}`).join('\n')}`
        : '';
        
      const nextSteps = metricsResult.nextSteps
        ? `\n\n**Next Steps**\n${metricsResult.nextSteps.map((s: string) => `• ${s}`).join('\n')}`
        : '';
      
      const fullAnalysis = `${executiveSummary}${existingInsights}${instrumentationPlan}${nextSteps}`.trim() || metricsResult.analysis || 'Here are the key metrics I recommend tracking.';

      return new Response(JSON.stringify({
        sessionId: newSessionId,
        status: 'waiting_approval',
        requiresApproval: true,
        approvalType: 'metrics',
        metrics: metricsResult.metrics,
        analysis: metricsResult.analysis,
        executiveSummary: metricsResult.executiveSummary,
        existingMetricsInsights: metricsResult.existingMetricsInsights,
        recommendedInstrumentationPlan: metricsResult.recommendedInstrumentationPlan,
        nextSteps: metricsResult.nextSteps,
        inputData,
        frameworkRecommendation: {
          recommendedFramework: frameworkResult.recommendedFramework,
          confidence: frameworkResult.confidence || 0.8,
          reasoning: frameworkResult.reasoning,
        },
        clarifyingQuestions: frameworkResult.clarifyingQuestions || [],
        conversationHistory: [
          { role: 'assistant', agent: 'Product Analyst', content: frameworkResult.reasoning || 'I have analyzed your product.' },
          { role: 'assistant', agent: 'Product Analyst', content: fullAnalysis }
        ]
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === 'continue' && userMessage) {
      console.log("Processing follow-up question, approvalType:", approvalType);
      
      if (approvalType === 'taxonomy') {
        const currentEventsStr = providedEvents?.map((e: any) => 
          `- ${e.event_name}: ${e.description} (trigger: ${e.trigger_action}, screen: ${e.screen})`
        ).join('\n') || 'No events yet';
        
        const conversationPrompt = TAXONOMY_CONVERSATION_PROMPT
          .replace('{currentEvents}', currentEventsStr)
          .replace('{userMessage}', userMessage);

        const userContent = buildUserContent(inputData, `User question about taxonomy: ${userMessage}`);
        const result = await callLovableAI(conversationPrompt, userContent, LOVABLE_API_KEY);
        
        return new Response(JSON.stringify({
          sessionId: newSessionId,
          status: 'waiting_approval',
          requiresApproval: true,
          approvalType: 'taxonomy',
          events: result.hasChanges ? result.updatedEvents : providedEvents,
          inputData,
          metrics: providedMetrics,
          conversationHistory: [
            { role: 'assistant', agent: 'Instrumentation Architect', content: result.response }
          ]
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } else {
        const currentMetricsStr = providedMetrics?.map((m: any) => `- ${m.name}: ${m.description}`).join('\n') || 'No metrics yet';
        
        const conversationPrompt = CONVERSATION_PROMPT
          .replace('{currentMetrics}', currentMetricsStr)
          .replace('{userMessage}', userMessage);

        const userContent = buildUserContent(inputData, `User question: ${userMessage}`);
        const result = await callLovableAI(conversationPrompt, userContent, LOVABLE_API_KEY);
        
        const existingMetricIds = new Set(providedMetrics?.map((m: any) => m.id) || []);
        const newMetrics = (result.newMetrics || []).filter((m: any) => !existingMetricIds.has(m.id));
        const allMetrics = [...(providedMetrics || []), ...newMetrics];

        return new Response(JSON.stringify({
          sessionId: newSessionId,
          status: 'waiting_approval',
          requiresApproval: true,
          approvalType: 'metrics',
          metrics: allMetrics,
          inputData,
          conversationHistory: [
            { role: 'assistant', agent: 'Product Analyst', content: result.response }
          ]
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    if (action === 'approve' && approvalType === 'metrics') {
      console.log("Running Instrumentation Architect Agent...");
      
      const metricsToUse = selectedMetrics || providedMetrics?.map((m: any) => m.name) || [];
      
      if (metricsToUse.length === 0) {
        throw new Error("No metrics provided for taxonomy generation");
      }
      
      // Check if we have any input data to work with
      const hasInputData = inputData && (inputData.url || inputData.imageData || inputData.videoData || inputData.productDetails);
      
      let taxonomyResult;
      
      if (hasInputData) {
        // We have input data, try AI generation
        try {
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
          taxonomyResult = await callLovableAI(architectPrompt, userContent, LOVABLE_API_KEY);
        } catch (err) {
          if (err instanceof AICreditsError) {
            console.info("AI credits exhausted during taxonomy generation. Using fallback events.");
            taxonomyResult = {
              events: getFallbackEvents(metricsToUse),
              summary: "Using standard event templates. AI credits are currently unavailable.",
              fallbackReason: "AI credits exhausted"
            };
          } else {
            throw err;
          }
        }
      } else {
        // No input data (fallback mode) - use fallback events
        console.info("No input data available. Using fallback events.");
        taxonomyResult = {
          events: getFallbackEvents(metricsToUse),
          summary: "Generated standard event templates based on common analytics patterns.",
          fallbackReason: "No input data available"
        };
      }

      return new Response(JSON.stringify({
        sessionId: newSessionId,
        status: 'waiting_approval',
        requiresApproval: true,
        approvalType: 'taxonomy',
        events: taxonomyResult.events,
        summary: taxonomyResult.summary,
        fallbackReason: taxonomyResult.fallbackReason,
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
    
    // Handle AI credit/rate limit errors gracefully with fallback data
    if (error instanceof AICreditsError) {
      const fallbackReason = error.statusCode === 402 
        ? "AI credits exhausted. Using default metrics." 
        : "Rate limit exceeded. Using default metrics.";
      console.log(fallbackReason, "Returning fallback metrics.");
      
      return new Response(
        JSON.stringify({
          sessionId: `fallback_${Date.now()}`,
          status: 'waiting_approval',
          requiresApproval: true,
          approvalType: 'metrics',
          metrics: getFallbackMetrics(),
          analysis: "We're using default metrics because AI generation is temporarily unavailable. You can still proceed with selecting and customizing these metrics.",
          inputData: {},
          frameworkRecommendation: {
            recommendedFramework: 'driver_tree',
            confidence: 0.7,
            reasoning: "Default framework recommendation. Driver Tree is a versatile choice for understanding metric relationships.",
          },
          clarifyingQuestions: [],
          conversationHistory: [
            { role: 'assistant', agent: 'Product Analyst', content: fallbackReason + " Here are recommended default metrics to get you started." }
          ],
          fallbackReason
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    
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
