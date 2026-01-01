import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Input validation schema with reasonable limits
// UPDATED: Now accepts 'existingMetrics'
const requestSchema = z
  .object({
    url: z.string().url().max(2000).optional().nullable(),
    imageData: z.string().max(15_000_000).optional().nullable(), // ~15MB for base64 images
    productDetails: z.string().max(10000).optional().nullable(),
    existingMetrics: z.string().max(5000).optional().nullable(),
  })
  .refine((data) => data.url || data.imageData || data.productDetails || data.existingMetrics, {
    message: "At least one of url, imageData, productDetails, or existingMetrics must be provided",
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
          fallbackReason: "Invalid JSON format. Using defaults.",
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

    const { url, imageData, productDetails, existingMetrics } = validationResult.data;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build context from validated input
    // UPDATED: Now includes existingMetrics in the text context
    let contextDescription = "Analyze this product/feature and generate tailored discovery questions:\n\n";

    if (url) {
      contextDescription += `URL: ${url}\n`;
    }

    if (productDetails) {
      contextDescription += `Product Description: ${productDetails}\n`;
    }

    if (existingMetrics) {
      contextDescription += `Current Metrics Tracked: ${existingMetrics}\n`;
    }

    // UPDATED SYSTEM PROMPT: Context-Aware & Adaptive
    const messages: any[] = [
      {
        role: "system",
        content: `You are a contextual Product Analytics Consultant. Your goal is to analyze the input (Screenshot, Video, URL, Description, or Existing Metrics) and generate 4-5 "Trade-off" questions that help clarify the measurement strategy.

## CRITICAL: ADAPT TO YOUR INPUT
**You will receive various inputs. Adapt your "Voice" accordingly:**

1.  **IF YOU SEE AN IMAGE OR VIDEO:**
    -   **Rule:** You MUST prove you see it. Quote specific UI text, button colors, or layout details.
    -   **Phrasing:** "I see the 'Quick Add' button in the screenshot..." or "In the video, the user paused at the checkout..."

2.  **IF YOU SEE EXISTING METRICS:**
    -   **Rule:** Critique them. Are they vanity metrics? Do they miss the "quality" side?
    -   **Phrasing:** "I see you currently track 'Total Clicks', but have you considered tracking 'Successful Completions' to measure quality?"

3.  **IF YOU ONLY SEE TEXT/URL:**
    -   **Rule:** Do not hallucinate UI elements. Focus on the business model inferred from the description.
    -   **Phrasing:** "Given this is a [Industry] product, success usually depends on..."

## YOUR GOAL
Generate questions that uncover the **measurement trade-offs** (Speed vs. Quality, Adoption vs. Retention). Avoid generic questions like "What is your goal?".

## EXAMPLES OF ADAPTABILITY

**Scenario: Visual Input**
-   *Question:* "I see the 'Weekly Trends' chart is the largest element. Is the goal for users to check this *frequently* (Habit) or to take *action* (Decision Support)?"

**Scenario: Existing Metrics Input**
-   *Context:* User tracks "Page Views" and "Signups".
-   *Question:* "You are tracking 'Signups' (Acquisition), but I don't see an Activation metric. Which action best defines a 'Activated' user for you?"
    *Options:* "Completed Profile", "Sent First Message", "Invited a Friend".

## REQUIRED OUTPUT FORMAT
Return a valid JSON object with this EXACT structure:
{
  "questions": [
    {
      "id": "unique_id_snake_case",
      "question": "Your specific question tailored to the input type...",
      "description": "Why this distinction matters for metrics.",
      "type": "single_choice",
      "category": "product",
      "options": [
        { "value": "option_a", "label": "Short Label", "description": "Explanation of trade-off" },
        { "value": "option_b", "label": "Short Label", "description": "Explanation of trade-off" },
        { "value": "option_c", "label": "Short Label", "description": "Explanation of trade-off" }
      ]
    }
  ],
  "productInsights": {
    "detectedType": "saas|marketplace|ecommerce|social|other",
    "keyFeatures": ["List 2-3 features identified from context"],
    "suggestedNorthStar": "A specific metric based on the input"
  }
}

CRITICAL:
- Every question MUST have an options array with at least 3 options.
- Every question MUST be specific to the product context provided.`,
      },
    ];

    // Add image/video if provided
    if (imageData) {
      // UPDATED: Logic to handle video vs image mime types
      // If the string starts with data:video, we use mp4, otherwise default to jpeg
      const isVideo = imageData.startsWith("data:video");
      const mimeType = isVideo ? "video/mp4" : "image/jpeg";

      // Ensure we have a valid data URI
      const finalUrl = imageData.startsWith("data:") ? imageData : `data:${mimeType};base64,${imageData}`;

      messages.push({
        role: "user",
        content: [
          { type: "text", text: contextDescription },
          {
            type: "image_url",
            image_url: {
              url: finalUrl,
            },
          },
        ],
      });
    } else {
      messages.push({
        role: "user",
        content: [{ type: "text", text: contextDescription }],
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
