import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation schema with reasonable limits
const requestSchema = z.object({
  url: z.string().url().max(2000).optional().nullable(),
  imageData: z.string().max(15_000_000).optional().nullable(), // ~15MB for base64 images
  productDetails: z.string().max(10000).optional().nullable(),
}).refine(
  (data) => data.url || data.imageData || data.productDetails,
  { message: "At least one of url, imageData, or productDetails must be provided" }
);

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
        JSON.stringify({ 
          error: 'Invalid JSON in request body',
          questions: getFallbackQuestions(),
          productInsights: null,
          fallbackReason: "Invalid request format. Using defaults."
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Validate input against schema
    const validationResult = requestSchema.safeParse(rawBody);
    if (!validationResult.success) {
      console.error("Input validation failed:", validationResult.error.flatten().fieldErrors);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid request data',
          details: validationResult.error.flatten().fieldErrors,
          questions: getFallbackQuestions(),
          productInsights: null,
          fallbackReason: "Invalid input data. Using defaults."
        }),
        { 
          status: 200, // Return 200 with fallback so user can proceed
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
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
        content: `You are a product analytics expert. Based on the provided product context (URL, screenshot, and/or description), generate 5-6 highly specific discovery questions that will help determine:
1. The user's primary business objectives for this specific product/feature
2. What stage this product/feature is at (new, growing, mature)
3. Key user actions and conversion points
4. What metrics would be most valuable to track
5. How users engage with the product

IMPORTANT RULES:
- Do NOT ask users which metrics framework they prefer or how they want to visualize metrics. We will determine the best framework based on their answers.
- EVERY question MUST have exactly 3-4 options with a "value", "label", and "description" field.
- Options should be specific, mutually exclusive choices that the user can select from.
- Do NOT create open-ended questions without options.

The questions should reference specific elements from the product context when possible.

Return a JSON object with this EXACT structure:
{
  "questions": [
    {
      "id": "unique_id",
      "question": "The specific question text",
      "description": "Why this question matters",
      "type": "single_choice",
      "category": "business|product|metrics",
      "options": [
        { "value": "option_value_snake_case", "label": "Display Label", "description": "Brief description of this option" },
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

CRITICAL: Each question in the "questions" array MUST have an "options" array with at least 3 options. Never return a question without options.`
      }
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
              url: imageData.startsWith('data:') ? imageData : `data:image/jpeg;base64,${imageData}` 
            } 
          }
        ]
      });
    } else {
      messages.push({
        role: "user",
        content: contextDescription
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
        model: "google/gemini-2.5-flash",
        messages,
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      // For 402 (payment required) and 429 (rate limit), return fallback with 200 so user can proceed
      if (response.status === 402 || response.status === 429) {
        const errorMessage = response.status === 402 
          ? "AI credits exhausted. Using default questions." 
          : "Rate limit exceeded. Using default questions.";
        console.log(errorMessage, "Returning fallback questions.");
        return new Response(JSON.stringify({ 
          questions: getFallbackQuestions(),
          productInsights: null,
          fallbackReason: errorMessage
        }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    let content = data.choices?.[0]?.message?.content || "";
    
    // Strip markdown code fences if present
    content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    const parsedResponse = JSON.parse(content);

    return new Response(JSON.stringify(parsedResponse), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error generating discovery questions:", error);
    // Return fallback questions with 200 status so user can still proceed
    return new Response(JSON.stringify({ 
      questions: getFallbackQuestions(),
      productInsights: null,
      fallbackReason: "Failed to generate tailored questions. Using defaults."
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function getFallbackQuestions() {
  return [
    {
      id: "primary_goal",
      question: "What is your primary business objective?",
      description: "This helps us recommend metrics aligned with your goals",
      type: "single_choice",
      category: "business",
      options: [
        { value: "growth", label: "User Growth", description: "Acquiring new users" },
        { value: "engagement", label: "User Engagement", description: "Increasing active usage" },
        { value: "monetization", label: "Revenue", description: "Converting to paying customers" },
        { value: "retention", label: "Retention", description: "Keeping users coming back" },
      ],
    },
    {
      id: "product_stage",
      question: "What stage is your product at?",
      description: "Different stages require different metric focuses",
      type: "single_choice",
      category: "product",
      options: [
        { value: "pre_launch", label: "Pre-launch / MVP", description: "Building and validating" },
        { value: "early_growth", label: "Early Growth", description: "Finding product-market fit" },
        { value: "scaling", label: "Scaling", description: "Rapid growth phase" },
        { value: "mature", label: "Mature", description: "Established, optimizing" },
      ],
    },
    {
      id: "business_model",
      question: "What is your business model?",
      description: "This determines which metrics matter most",
      type: "single_choice",
      category: "business",
      options: [
        { value: "subscription", label: "Subscription (SaaS)", description: "Recurring revenue" },
        { value: "marketplace", label: "Marketplace", description: "Connecting buyers and sellers" },
        { value: "ecommerce", label: "E-commerce", description: "Selling products" },
        { value: "freemium", label: "Freemium", description: "Free with paid upgrades" },
      ],
    },
    {
      id: "key_action",
      question: "What is the most important action users take in your product?",
      description: "This helps identify your core conversion metric",
      type: "single_choice",
      category: "metrics",
      options: [
        { value: "purchase", label: "Making a Purchase", description: "Completing a transaction" },
        { value: "signup", label: "Signing Up", description: "Creating an account" },
        { value: "engagement", label: "Engaging with Content", description: "Consuming or creating content" },
        { value: "connection", label: "Connecting with Others", description: "Social or marketplace interactions" },
      ],
    },
  ];
}
