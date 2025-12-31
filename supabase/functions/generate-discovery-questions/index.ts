import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Input validation schema with reasonable limits
const requestSchema = z
  .object({
    url: z.string().url().max(2000).optional().nullable(),
    imageData: z.string().max(15_000_000).optional().nullable(), // ~15MB for base64 images
    productDetails: z.string().max(10000).optional().nullable(),
  })
  .refine((data) => data.url || data.imageData || data.productDetails, {
    message: "At least one of url, imageData, or productDetails must be provided",
  });

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse and validate request body
    let rawBody: unknown;
    try {
      rawBody = await req.json();
    } catch {
      return new Response(
        JSON.stringify({
          error: "Invalid JSON in request body",
          questions: getFallbackQuestions(),
          productInsights: null,
          fallbackReason: "Invalid request format. Using defaults.",
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Validate input against schema
    const validationResult = requestSchema.safeParse(rawBody);
    if (!validationResult.success) {
      console.error("Input validation failed:", validationResult.error.flatten().fieldErrors);
      return new Response(
        JSON.stringify({
          error: "Invalid request data",
          details: validationResult.error.flatten().fieldErrors,
          questions: getFallbackQuestions(),
          productInsights: null,
          fallbackReason: "Invalid input data. Using defaults.",
        }),
        {
          status: 200, // Return 200 with fallback so user can proceed
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const { url, imageData, productDetails } = validationResult.data;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build context from validated input
    let contextDescription = "Analyze this product/feature and generate tailored discovery questions:\n\n";

    if (url) {
      contextDescription += `URL: ${url}\n`;
    }

    if (productDetails) {
      contextDescription += `Product Description: ${productDetails}\n`;
    }

    const messages: any[] = [
      {
        role: "system",
        content: `You are a senior product strategist and analytics expert. Your job is to deeply understand the product context provided (URL, screenshot, and/or description) and generate 5–6 highly specific discovery questions that uncover:

1. The core user value this product delivers
2. The primary user journey and the most important actions within it
3. The key moments that signal activation, success, or conversion
4. The biggest friction points or drop-off risks
5. What the user (the PM) is trying to improve, diagnose, or understand
6. How existing metrics (if any are mentioned) relate to the product’s value

Your questions MUST be grounded in the actual product context. Reference UI elements, flows, features, or behaviors you infer from the product description, URL, or image.

IMPORTANT RULES:
- Never ask generic PM questions such as “What stage is your product at?”, “What is your business model?”, or “What is your primary objective?”
- Never ask about frameworks or visualization preferences.
- Every question MUST be a single-choice question with exactly 3–4 mutually exclusive options.
- Each option MUST include: value, label, and description.
- Do NOT create open-ended questions.
- Do NOT fall back to generic questions if context is limited. Instead, infer likely user flows and value moments based on the product type.

Your questions should feel like they were written by a senior PM who deeply understands the product.

---

### EXAMPLES OF GOOD QUESTIONS (use these as patterns):

Example 1:
{
  "id": "value_moment",
  "question": "Which action best represents the moment users experience core value in your product?",
  "description": "Identifies the activation moment that should anchor your metrics.",
  "type": "single_choice",
  "category": "product",
  "options": [
    { "value": "create", "label": "Creating something", "description": "Users generate content or output" },
    { "value": "share", "label": "Sharing with others", "description": "Users distribute value to others" },
    { "value": "complete", "label": "Completing a task", "description": "Users achieve a meaningful outcome" }
  ]
}

Example 2:
{
  "id": "critical_path",
  "question": "Which part of the user journey is most critical to improve right now?",
  "description": "Helps identify the highest-leverage area for metric focus.",
  "type": "single_choice",
  "category": "metrics",
  "options": [
    { "value": "onboarding", "label": "Onboarding", "description": "Helping users reach value faster" },
    { "value": "activation", "label": "Activation", "description": "Ensuring users complete key actions" },
    { "value": "retention", "label": "Retention", "description": "Keeping users engaged over time" }
  ]
}

Example 3:
{
  "id": "friction_point",
  "question": "Where do users most commonly encounter friction in your product?",
  "description": "Identifies potential drop-off points that metrics should monitor.",
  "type": "single_choice",
  "category": "product",
  "options": [
    { "value": "signup", "label": "Signup or onboarding", "description": "Users struggle to get started" },
    { "value": "navigation", "label": "Finding key features", "description": "Users can’t locate what they need" },
    { "value": "completion", "label": "Completing core actions", "description": "Users drop off before finishing tasks" }
  ]
}

---

### REQUIRED OUTPUT FORMAT:
Return a JSON object with this EXACT structure:

{
  "questions": [
    {
      "id": "unique_id",
      "question": "Specific question text",
      "description": "Why this question matters",
      "type": "single_choice",
      "category": "business|product|metrics",
      "options": [
        { "value": "option_value_snake_case", "label": "Display Label", "description": "Brief description" },
        { "value": "option_value_2", "label": "Label 2", "description": "Description 2" },
        { "value": "option_value_3", "label": "Label 3", "description": "Description 3" }
      ]
    }
  ],
  "productInsights": {
    "detectedType": "e-commerce|saas|marketplace|content|social|portfolio|other",
    "keyFeatures": ["feature1", "feature2"],
    "suggestedNorthStar": "suggested metric name"
  }
}

CRITICAL:
- Every question MUST have an options array with at least 3 options.
- Every question MUST be specific to the product context.
- Never return generic or boilerplate questions.`,
      },
    ];

    // Add image if provided
    if (imageData) {
      messages.push({
        role: "user",
        content: [
          { type: "text", text: contextDescription },
          {
            type: "image_url",
            image_url: {
              url: imageData.startsWith("data:") ? imageData : `data:image/jpeg;base64,${imageData}`,
            },
          },
        ],
      });
    } else {
      messages.push({
        role: "user",
        content: contextDescription,
      });
    }

    console.log("Generating discovery questions with validated input");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-pro-preview",
        messages,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);

      // For 402 (payment required) and 429 (rate limit), return fallback with 200 so user can proceed
      if (response.status === 402 || response.status === 429) {
        const errorMessage =
          response.status === 402
            ? "AI credits exhausted. Using default questions."
            : "Rate limit exceeded. Using default questions.";
        console.log(errorMessage, "Returning fallback questions.");
        return new Response(
          JSON.stringify({
            questions: getFallbackQuestions(),
            productInsights: null,
            fallbackReason: errorMessage,
          }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }

      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    let content = data.choices?.[0]?.message?.content || "";

    // Strip markdown code fences if present
    content = content
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    const parsedResponse = JSON.parse(content);

    return new Response(JSON.stringify(parsedResponse), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error generating discovery questions:", error);
    // Return fallback questions with 200 status so user can still proceed
    return new Response(
      JSON.stringify({
        questions: getFallbackQuestions(),
        productInsights: null,
        fallbackReason: "Failed to generate tailored questions. Using defaults.",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});

// Fallback questions - ONLY used when AI credits are exhausted or rate limited
// These are intentionally product-focused (not generic PM questions) to align with the system prompt
function getFallbackQuestions() {
  return [
    {
      id: "value_moment",
      question: "Which action best represents the moment users experience core value in your product?",
      description: "Identifies the activation moment that should anchor your metrics.",
      type: "single_choice",
      category: "product",
      options: [
        { value: "create", label: "Creating something", description: "Users generate content or output" },
        { value: "share", label: "Sharing with others", description: "Users distribute value to others" },
        { value: "complete", label: "Completing a task", description: "Users achieve a meaningful outcome" },
        { value: "connect", label: "Connecting with others", description: "Users interact with other users" },
      ],
    },
    {
      id: "critical_path",
      question: "Which part of the user journey is most critical to improve right now?",
      description: "Helps identify the highest-leverage area for metric focus.",
      type: "single_choice",
      category: "metrics",
      options: [
        { value: "onboarding", label: "Onboarding", description: "Helping users reach value faster" },
        { value: "activation", label: "Activation", description: "Ensuring users complete key actions" },
        { value: "retention", label: "Retention", description: "Keeping users engaged over time" },
        { value: "monetization", label: "Monetization", description: "Converting users to revenue" },
      ],
    },
    {
      id: "friction_point",
      question: "Where do users most commonly encounter friction in your product?",
      description: "Identifies potential drop-off points that metrics should monitor.",
      type: "single_choice",
      category: "product",
      options: [
        { value: "signup", label: "Signup or onboarding", description: "Users struggle to get started" },
        { value: "navigation", label: "Finding key features", description: "Users can't locate what they need" },
        { value: "completion", label: "Completing core actions", description: "Users drop off before finishing tasks" },
      ],
    },
    {
      id: "success_signal",
      question: "What signals that a user has become successful with your product?",
      description: "Defines the outcome that indicates product-market fit for a user.",
      type: "single_choice",
      category: "metrics",
      options: [
        { value: "frequency", label: "Regular usage", description: "Users return frequently" },
        { value: "depth", label: "Deep engagement", description: "Users explore advanced features" },
        { value: "output", label: "Valuable output", description: "Users create meaningful results" },
        { value: "referral", label: "Referring others", description: "Users recommend to peers" },
      ],
    },
  ];
}
